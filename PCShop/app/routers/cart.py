from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID

from app.database import get_db
from app.models.order import CartItem
from app.models.product import Product, ProductImage
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/cart", tags=["Cos de cumparaturi"])

class CartAddRequest(BaseModel):
    user_id: UUID
    product_id: UUID
    quantity: int = 1

class CartUpdateRequest(BaseModel):
    quantity: int

# ── GET cos ─────────────────────────────────────────────────
@router.get("/{user_id}")
def get_cart(user_id: UUID, db: Session = Depends(get_db)):
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()

    product_ids = [i.product_id for i in items]
    products_by_id = {}
    if product_ids:
        fetched = (
            db.query(Product)
            .options(joinedload(Product.images))
            .filter(Product.id.in_(product_ids))
            .all()
        )
        products_by_id = {p.id: p for p in fetched}

    result = []
    total = 0

    for item in items:
        product = products_by_id.get(item.product_id)
        if product:
            subtotal = round(float(product.price) * item.quantity, 2)
            total += subtotal
            result.append({
                "cart_item_id": str(item.id),
                "product_id":   str(product.id),
                "name":         product.name,
                "brand":        product.brand,
                "price":        float(product.price),
                "quantity":     item.quantity,
                "subtotal":     subtotal,
                "stock":        product.stock,
                "image_url":    product.images[0].url if product.images else None,
                "added_at":     item.added_at,
            })
    
    return {
        "user_id": str(user_id),
        "items": result,
        "total_items": len(result),
        "total_price": round(total, 2),
    }

# ── ADAUGA in cos ────────────────────────────────────────────
@router.post("/", status_code=201)
def add_to_cart(req: CartAddRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produsul nu exista")
    if product.stock < req.quantity:
        raise HTTPException(status_code=400, detail=f"Stoc insuficient. Disponibil: {product.stock}")
    
    existing = db.query(CartItem).filter(
        CartItem.user_id == req.user_id,
        CartItem.product_id == req.product_id
    ).first()
    
    if existing:
        new_qty = existing.quantity + req.quantity
        if product.stock < new_qty:
            raise HTTPException(status_code=400, detail=f"Stoc insuficient. Disponibil: {product.stock}")
        existing.quantity = new_qty
        db.commit()
        return {"message": "Cantitate actualizata", "quantity": new_qty}
    
    item = CartItem(
        user_id=req.user_id,
        product_id=req.product_id,
        quantity=req.quantity
    )
    db.add(item)
    db.commit()
    return {"message": "Produs adaugat in cos"}

# ── ACTUALIZEAZA cantitate ───────────────────────────────────
@router.put("/{cart_item_id}")
def update_cart_item(
    cart_item_id: UUID,
    req: CartUpdateRequest,
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item negasit in cos")
    
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product.stock < req.quantity:
        raise HTTPException(status_code=400, detail=f"Stoc insuficient. Disponibil: {product.stock}")
    
    if req.quantity <= 0:
        db.delete(item)
        db.commit()
        return {"message": "Produs eliminat din cos"}
    
    item.quantity = req.quantity
    db.commit()
    return {"message": "Cantitate actualizata", "quantity": req.quantity}

# ── STERGE din cos ───────────────────────────────────────────
@router.delete("/{cart_item_id}")
def remove_from_cart(cart_item_id: UUID, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item negasit in cos")
    db.delete(item)
    db.commit()
    return {"message": "Produs eliminat din cos"}

# ── GOLESTE cosul ────────────────────────────────────────────
@router.delete("/clear/{user_id}")
def clear_cart(user_id: UUID, db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    return {"message": "Cos golit"}