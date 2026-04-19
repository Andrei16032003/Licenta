import datetime
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
import stripe

from app.database import get_db
from app.models.order import Order, OrderItem, CartItem
from app.models.product import Product
from app.models.user_profile import UserAddress
from app.models.voucher import Voucher
from app.dependencies import require_role
_require_orders = require_role("admin", "suport", "manager")
from app.models.user import User
from app.config import STRIPE_SECRET_KEY
from app.notifications import notify_order_placed, notify_order_status

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter(prefix="/orders", tags=["Comenzi"])

SELLER = {
    "name": "PCShop SRL",
    "cui": "RO12345678",
    "reg_com": "J40/1234/2024",
    "address": "Str. Principala nr. 1, Sector 1, Bucuresti",
    "bank": "ING Bank Romania",
    "iban": "RO49INGB0000999901234567",
    "email": "comenzi@pcshop.ro",
}

VALID_CARDS = {"4242424242424242"}        # carduri care merg
DECLINED_CARDS = {"4000000000000002"}     # carduri refuzate explicit

def _stripe_ready() -> bool:
    """Returneaza True doar daca STRIPE_SECRET_KEY e o cheie reala, nu placeholder."""
    k = STRIPE_SECRET_KEY or ""
    return k.startswith(("sk_test_", "sk_live_")) and "YOUR" not in k and "HERE" not in k

class OrderCreate(BaseModel):
    user_id: UUID
    address_id: UUID
    payment_method_type: str = "cod"      # cod | card | transfer
    notes: Optional[str] = None
    voucher_code: Optional[str] = None

class CardPaymentRequest(BaseModel):
    card_number: str
    expiry: str
    cvv: str
    cardholder: str

class StripeConfirmRequest(BaseModel):
    payment_intent_id: str

# ── PLASEAZA COMANDA ─────────────────────────────────────────

# Plaseaza o comanda noua: valideaza cosul, adresa, aplica voucherul si scade stocul
@router.post("/", status_code=201)
def create_order(req: OrderCreate, db: Session = Depends(get_db)):
    if req.payment_method_type not in ("cod", "card", "transfer"):
        raise HTTPException(400, "Metoda de plata invalida. Valori: cod, card, transfer")

    cart_items = db.query(CartItem).filter(CartItem.user_id == req.user_id).all()
    if not cart_items:
        raise HTTPException(400, "Cosul este gol")

    address = db.query(UserAddress).filter(UserAddress.id == req.address_id).first()
    if not address:
        raise HTTPException(404, "Adresa negasita")

    subtotal = 0
    order_items_data = []

    for cart_item in cart_items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if not product:
            continue
        if product.stock < cart_item.quantity:
            raise HTTPException(400, f"Stoc insuficient pentru {product.name}. Disponibil: {product.stock}")
        subtotal += float(product.price) * cart_item.quantity
        order_items_data.append({
            "product": product,
            "quantity": cart_item.quantity,
            "unit_price": float(product.price),
            "product_snapshot": {"name": product.name, "brand": product.brand, "sku": product.sku}
        })

    shipping_cost   = 0.0 if subtotal >= 500 else 25.0
    cod_fee         = 5.0 if req.payment_method_type == "cod" else 0.0
    discount_amount = 0.0
    applied_voucher = None

    if req.voucher_code:
        code = req.voucher_code.strip().upper()
        v = db.query(Voucher).filter(Voucher.code == code).first()
        if not v or not v.is_active:
            raise HTTPException(400, "Codul voucher este invalid sau inactiv.")
        if v.expires_at and v.expires_at.replace(tzinfo=timezone.utc) < datetime.datetime.now(timezone.utc):
            raise HTTPException(400, "Voucher-ul a expirat.")
        if v.usage_limit is not None and v.used_count >= v.usage_limit:
            raise HTTPException(400, "Voucher-ul a atins limita de utilizari.")
        if v.user_id and str(v.user_id) != str(req.user_id):
            raise HTTPException(403, "Acest voucher nu este pentru contul tau.")
        if v.min_order_amount and subtotal < float(v.min_order_amount):
            raise HTTPException(400, f"Comanda minima pentru acest voucher este {float(v.min_order_amount):.0f} RON.")

        if v.type == "percent":
            discount_amount = round(subtotal * float(v.value) / 100, 2)
        elif v.type == "fixed":
            discount_amount = min(float(v.value), subtotal)
        elif v.type == "free_shipping":
            shipping_cost = 0.0

        v.used_count += 1
        applied_voucher = v

    total_price = subtotal - discount_amount + shipping_cost + cod_fee

    # payment_status initial
    payment_status_map = {
        "cod":      "cod",
        "card":     "pending_card",
        "transfer": "pending_transfer",
    }

    # numar factura / proforma
    order_count    = db.query(Order).count()
    year           = datetime.datetime.now().year
    prefix         = "FP" if req.payment_method_type == "transfer" else "FC"
    invoice_number = f"{prefix}-{year}-{order_count + 1:04d}"

    order = Order(
        user_id=req.user_id,
        address_id=req.address_id,
        payment_method_type=req.payment_method_type,
        subtotal=subtotal,
        discount_amount=discount_amount,
        coupon_id=applied_voucher.id if applied_voucher else None,
        shipping_cost=shipping_cost,
        cod_fee=cod_fee,
        total_price=total_price,
        payment_status=payment_status_map[req.payment_method_type],
        notes=req.notes,
        invoice_number=invoice_number,
        shipping_snapshot={
            "full_name":   address.full_name,
            "phone":       address.phone,
            "county":      address.county,
            "city":        address.city,
            "street":      address.street,
            "postal_code": address.postal_code,
            "country":     address.country,
        }
    )
    db.add(order)
    db.flush()

    for item_data in order_items_data:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            product_snapshot=item_data["product_snapshot"]
        ))
        item_data["product"].stock -= item_data["quantity"]

    db.query(CartItem).filter(CartItem.user_id == req.user_id).delete()
    db.commit()

    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        notify_order_placed(
            to_email=user.email,
            name=user.name,
            order_id=str(order.id),
            invoice=invoice_number,
            total=total_price,
            items=[{"name": i["product"].name, "quantity": i["quantity"], "unit_price": i["unit_price"]} for i in order_items_data],
            payment_method=req.payment_method_type,
        )

    return {
        "message":              "Comanda plasata cu succes",
        "order_id":             str(order.id),
        "invoice_number":       invoice_number,
        "total_price":          total_price,
        "subtotal":             subtotal,
        "discount_amount":      discount_amount,
        "shipping_cost":        shipping_cost,
        "cod_fee":              cod_fee,
        "payment_method_type":  req.payment_method_type,
        "payment_status":       payment_status_map[req.payment_method_type],
        "status":               "pending",
    }

# ── SIMULARE PLATA CARD ──────────────────────────────────────

# Simuleaza procesarea platii cu cardul; accepta doar carduri din setul VALID_CARDS
@router.post("/{order_id}/pay-card")
def simulate_card_payment(order_id: UUID, req: CardPaymentRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")
    if order.payment_status == "paid":
        return {"success": True, "message": "Comanda este deja platita"}

    card = req.card_number.replace(" ", "").replace("-", "")

    if len(card) != 16 or not card.isdigit():
        raise HTTPException(400, "Numarul cardului trebuie sa aiba 16 cifre")

    if card in DECLINED_CARDS:
        raise HTTPException(402, "Card refuzat de banca emitenta. Contactati banca dvs.")

    if card not in VALID_CARDS:
        raise HTTPException(402, "Autentificare esuata. Verificati datele cardului.")

    # card valid
    order.payment_status = "paid"
    order.status = "confirmed"
    # inlocuieste FP→FC daca era proforma
    if order.invoice_number and order.invoice_number.startswith("FP"):
        order.invoice_number = "FC" + order.invoice_number[2:]
    db.commit()

    return {
        "success":      True,
        "message":      "Plata procesata cu succes!",
        "card_last4":   card[-4:],
        "order_id":     str(order.id),
        "invoice_number": order.invoice_number,
    }

# ── STRIPE: CREARE PAYMENT INTENT ────────────────────────────

# Creeaza un Stripe PaymentIntent si returneaza client_secret-ul catre frontend
@router.post("/{order_id}/stripe-intent")
def create_stripe_intent(order_id: UUID, db: Session = Depends(get_db)):
    if not _stripe_ready():
        raise HTTPException(503, "Stripe nu este configurat pe server")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")
    if order.payment_status == "paid":
        return {"already_paid": True}
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(order.total_price) * 100),  # in bani (1 RON = 100 bani)
            currency="ron",
            metadata={"order_id": str(order_id)},
        )
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except stripe.StripeError as e:
        raise HTTPException(400, str(e.user_message))

# ── STRIPE: CONFIRMARE PLATA ──────────────────────────────────

# Verifica cu Stripe daca PaymentIntent-ul a reusit si actualizeaza comanda
@router.post("/{order_id}/stripe-confirm")
def confirm_stripe_payment(order_id: UUID, req: StripeConfirmRequest, db: Session = Depends(get_db)):
    if not _stripe_ready():
        raise HTTPException(503, "Stripe nu este configurat pe server")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")
    if order.payment_status == "paid":
        return {"success": True, "message": "Comanda este deja platita"}
    try:
        intent = stripe.PaymentIntent.retrieve(req.payment_intent_id)
    except stripe.StripeError as e:
        raise HTTPException(400, str(e.user_message))
    if intent.status != "succeeded":
        raise HTTPException(402, f"Plata nu a fost finalizata: {intent.status}")
    if str(intent.metadata.get("order_id")) != str(order_id):
        raise HTTPException(400, "PaymentIntent nu corespunde comenzii")
    order.payment_status = "paid"
    order.status = "confirmed"
    if order.invoice_number and order.invoice_number.startswith("FP"):
        order.invoice_number = "FC" + order.invoice_number[2:]
    db.commit()
    return {
        "success": True,
        "order_id": str(order_id),
        "invoice_number": order.invoice_number,
    }

# ── CONFIRMARE TRANSFER BANCAR (admin) ───────────────────────
@router.post("/{order_id}/confirm-transfer")
def confirm_transfer(order_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_orders)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")
    order.payment_status = "paid"
    order.status = "confirmed"
    if order.invoice_number and order.invoice_number.startswith("FP"):
        order.invoice_number = "FC" + order.invoice_number[2:]
    db.commit()
    return {"message": "Transfer confirmat, comanda procesata"}

# ── FACTURA / PROFORMA ────────────────────────────────────────

# Genereaza datele pentru factura fiscala sau proforma in functie de statusul platii
@router.get("/{order_id}/invoice")
def get_invoice(order_id: UUID, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")

    is_proforma = order.payment_status == "pending_transfer"
    addr = order.shipping_snapshot or {}

    items_data = []
    for i in order.items:
        price    = float(i.unit_price)
        qty      = i.quantity
        net      = round(price * qty / 1.19, 2)
        vat      = round(price * qty - net, 2)
        items_data.append({
            "name":       i.product_snapshot.get("name"),
            "brand":      i.product_snapshot.get("brand"),
            "quantity":   qty,
            "unit_price": price,
            "subtotal":   round(price * qty, 2),
            "net":        net,
            "vat":        vat,
        })

    total_net = round(sum(x["net"] for x in items_data), 2)
    total_vat = round(sum(x["vat"] for x in items_data), 2)

    return {
        "invoice_number":      order.invoice_number,
        "type":                "proforma" if is_proforma else "fiscala",
        "date":                order.created_at,
        "order_id":            str(order.id),
        "payment_method_type": order.payment_method_type,
        "payment_status":      order.payment_status,
        "seller":              SELLER,
        "buyer": {
            "name":    addr.get("full_name"),
            "phone":   addr.get("phone"),
            "address": f"{addr.get('street', '')}, {addr.get('city', '')}, {addr.get('county', '')}",
            "postal":  addr.get("postal_code"),
        },
        "items":          items_data,
        "subtotal":       float(order.subtotal),
        "shipping_cost":  float(order.shipping_cost),
        "cod_fee":        float(order.cod_fee or 0),
        "discount":       float(order.discount_amount or 0),
        "total_net":      total_net,
        "total_vat":      total_vat,
        "total_price":    float(order.total_price),
        "bank_details": {
            "beneficiar": SELLER["name"],
            "bank":       SELLER["bank"],
            "iban":       SELLER["iban"],
            "referinta":  str(order.id)[:8].upper(),
            "suma":       float(order.total_price),
        } if is_proforma else None,
    }

# ── COMENZILE UNUI USER ──────────────────────────────────────

# Returneaza toate comenzile unui user cu detalii despre produse si adresa de livrare
@router.get("/user/{user_id}")
def get_user_orders(user_id: UUID, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    # Batch-load all products (with images) referenced across all order items — one query
    all_product_ids = list({i.product_id for o in orders for i in o.items})
    products_by_id = {}
    if all_product_ids:
        fetched = (
            db.query(Product)
            .options(joinedload(Product.images))
            .filter(Product.id.in_(all_product_ids))
            .all()
        )
        products_by_id = {p.id: p for p in fetched}

    result = []
    for o in orders:
        items_data = []
        for i in o.items:
            product = products_by_id.get(i.product_id)
            items_data.append({
                "product_id":      str(i.product_id),
                "product_name":    i.product_snapshot.get("name"),
                "brand":           i.product_snapshot.get("brand"),
                "quantity":        i.quantity,
                "unit_price":      float(i.unit_price),
                "warranty_months": product.warranty_months if product else 24,
                "image_url":       product.images[0].url if product and product.images else None,
            })
        result.append({
            "id":                  str(o.id),
            "total_price":         float(o.total_price),
            "status":              o.status,
            "payment_status":      o.payment_status,
            "payment_method_type": o.payment_method_type,
            "invoice_number":      o.invoice_number,
            "created_at":          o.created_at,
            "items_count":         len(items_data),
            "items":               items_data,
            "shipping_address":    o.shipping_snapshot or {},
        })
    return result

# ── DETALII COMANDA ──────────────────────────────────────────
@router.get("/{order_id}")
def get_order(order_id: UUID, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(404, "Comanda negasita")

    all_product_ids = [i.product_id for i in order.items]
    products_by_id = {}
    if all_product_ids:
        fetched = (
            db.query(Product)
            .options(joinedload(Product.images))
            .filter(Product.id.in_(all_product_ids))
            .all()
        )
        products_by_id = {p.id: p for p in fetched}

    return {
        "id":                  str(order.id),
        "status":              order.status,
        "payment_status":      order.payment_status,
        "payment_method_type": order.payment_method_type,
        "invoice_number":      order.invoice_number,
        "subtotal":            float(order.subtotal),
        "shipping_cost":       float(order.shipping_cost),
        "cod_fee":             float(order.cod_fee or 0),
        "discount_amount":     float(order.discount_amount),
        "total_price":         float(order.total_price),
        "shipping_address":    order.shipping_snapshot,
        "notes":               order.notes,
        "created_at":          order.created_at,
        "tracking_number":     order.tracking_number,
        "items": [
            {
                "product_id":   str(i.product_id),
                "product_name": i.product_snapshot.get("name"),
                "brand":        i.product_snapshot.get("brand"),
                "quantity":     i.quantity,
                "unit_price":   float(i.unit_price),
                "subtotal":     float(i.unit_price) * i.quantity,
                "image_url":    products_by_id[i.product_id].images[0].url
                                if i.product_id in products_by_id and products_by_id[i.product_id].images
                                else None,
            }
            for i in order.items
        ]
    }

# ── ADMIN: TOATE COMENZILE ───────────────────────────────────
@router.get("/admin/all")
def get_all_orders(db: Session = Depends(get_db), _: User = Depends(_require_orders)):
    orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()

    all_product_ids = list({i.product_id for o in orders for i in o.items})
    products_by_id = {}
    if all_product_ids:
        fetched = db.query(Product).options(joinedload(Product.images)).filter(Product.id.in_(all_product_ids)).all()
        products_by_id = {p.id: p for p in fetched}

    return [
        {
            "id":                  str(o.id),
            "user_id":             str(o.user_id),
            "total_price":         float(o.total_price),
            "subtotal":            float(o.subtotal),
            "shipping_cost":       float(o.shipping_cost),
            "cod_fee":             float(o.cod_fee or 0),
            "status":              o.status,
            "payment_status":      o.payment_status,
            "payment_method_type": o.payment_method_type,
            "invoice_number":      o.invoice_number,
            "tracking_number":     o.tracking_number,
            "created_at":          o.created_at,
            "items_count":         len(o.items),
            "shipping_address":    o.shipping_snapshot,
            "notes":               o.notes,
            "items": [
                {
                    "product_id":   str(i.product_id),
                    "product_name": i.product_snapshot.get("name"),
                    "brand":        i.product_snapshot.get("brand"),
                    "quantity":     i.quantity,
                    "unit_price":   float(i.unit_price),
                    "image_url":    products_by_id[i.product_id].images[0].url
                                    if i.product_id in products_by_id and products_by_id[i.product_id].images
                                    else None,
                }
                for i in o.items
            ],
        }
        for o in orders
    ]

# ── ADMIN: ACTUALIZEAZA TRACKING ─────────────────────────────
@router.patch("/{order_id}/tracking")
def update_tracking(order_id: UUID, data: dict, db: Session = Depends(get_db), _: User = Depends(_require_orders)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order: raise HTTPException(404)
    order.tracking_number = data.get("tracking_number")
    db.commit()
    return {"success": True}

# ── ADMIN: ACTUALIZEAZA STATUS ───────────────────────────────

# Actualizeaza statusul comenzii; gestioneaza automat stocul la anulare/reactivare
@router.put("/{order_id}/status")
def update_order_status(order_id: UUID, status: str, db: Session = Depends(get_db), _: User = Depends(_require_orders)):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(400, f"Status invalid. Valori: {valid_statuses}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Comanda negasita")

    prev_status = order.status

    # Incarca produsele din comanda intr-un singur query (evita N+1 in buclele de mai jos)
    product_ids = [item.product_id for item in order.items]
    products_map = {
        p.id: p
        for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
    }

    # Restaureaza stock la anulare (doar daca nu era deja anulata)
    if status == "cancelled" and prev_status != "cancelled":
        for item in order.items:
            product = products_map.get(item.product_id)
            if product:
                product.stock += item.quantity

    # Daca se re-activeaza o comanda anulata, scade din nou stock-ul
    if prev_status == "cancelled" and status != "cancelled":
        for item in order.items:
            product = products_map.get(item.product_id)
            if product:
                if product.stock < item.quantity:
                    raise HTTPException(400, f"Stoc insuficient pentru {product.name} (disponibil: {product.stock})")
                product.stock -= item.quantity

    order.status = status
    db.commit()

    user = db.query(User).filter(User.id == order.user_id).first()
    if user and status in ("confirmed", "processing", "shipped", "delivered", "cancelled"):
        notify_order_status(user.email, user.name, str(order.id), status)

    return {"message": f"Status actualizat la: {status}"}


# ── MARKETING: dependinta comuna ─────────────────────────────────
from app.dependencies import require_role as _require_role
_require_marketing_orders = _require_role("admin", "marketing")

# ── MARKETING: segmentare clienti ────────────────────────────────
@router.get("/marketing/client-segments")
def client_segments(
    db: Session = Depends(get_db),
    _: User = Depends(_require_marketing_orders),
):
    from sqlalchemy import func as sqlfunc

    # Comenzi per client (exclus anulate)
    user_rows = (
        db.query(
            Order.user_id,
            sqlfunc.count(Order.id).label("order_count"),
            sqlfunc.sum(Order.total_price).label("total_spent"),
        )
        .filter(Order.status != "cancelled")
        .group_by(Order.user_id)
        .all()
    )

    if not user_rows:
        return {
            "total_clients": 0, "single_buyers": 0, "returning_buyers": 0,
            "avg_order_value": 0, "avg_orders_per_client": 0,
            "voucher_users": 0, "voucher_pct": 0,
            "top_spenders": [],
            "order_freq_dist": [],
        }

    total_clients = len(user_rows)
    single   = sum(1 for u in user_rows if u.order_count == 1)
    returning = total_clients - single
    total_orders = sum(u.order_count for u in user_rows)
    total_revenue = sum(float(u.total_spent or 0) for u in user_rows)

    # Clienti care au folosit voucher
    voucher_users = (
        db.query(sqlfunc.count(sqlfunc.distinct(Order.user_id)))
        .filter(Order.coupon_id.isnot(None), Order.status != "cancelled")
        .scalar()
    ) or 0

    # Top 5 spenderi
    top5 = sorted(user_rows, key=lambda u: float(u.total_spent or 0), reverse=True)[:5]
    user_ids = [u.user_id for u in top5]
    users_map = {u.id: u.email for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    # Distributie frecventa comenzi (1, 2, 3, 4, 5+)
    freq = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for u in user_rows:
        k = min(u.order_count, 5)
        freq[k] += 1

    return {
        "total_clients": total_clients,
        "single_buyers": single,
        "returning_buyers": returning,
        "avg_order_value": round(total_revenue / total_orders, 2) if total_orders else 0,
        "avg_orders_per_client": round(total_orders / total_clients, 2) if total_clients else 0,
        "voucher_users": voucher_users,
        "voucher_pct": round(voucher_users / total_clients * 100, 1) if total_clients else 0,
        "top_spenders": [
            {
                "email": users_map.get(u.user_id, "—"),
                "orders": u.order_count,
                "total": round(float(u.total_spent or 0), 2),
            }
            for u in top5
        ],
        "order_freq_dist": [{"orders": k, "clients": v} for k, v in freq.items()],
    }


# ── MARKETING: venituri in timp ───────────────────────────────────
@router.get("/marketing/revenue-timeline")
def revenue_timeline(
    period: str = "day",
    db: Session = Depends(get_db),
    _: User = Depends(_require_marketing_orders),
):
    from sqlalchemy import cast, Date, func as sqlfunc

    if period not in ("day", "week", "month"):
        period = "day"

    # Group non-cancelled orders by truncated date
    if period == "day":
        date_expr = cast(Order.created_at, Date)
    elif period == "week":
        date_expr = sqlfunc.date_trunc("week", Order.created_at).cast(Date)
    else:
        date_expr = sqlfunc.date_trunc("month", Order.created_at).cast(Date)

    rows = (
        db.query(date_expr.label("period"), sqlfunc.sum(Order.total_price).label("revenue"))
        .filter(Order.status != "cancelled")
        .group_by(date_expr)
        .order_by(date_expr)
        .all()
    )
    return [{"date": str(r.period), "revenue": float(r.revenue or 0)} for r in rows]
