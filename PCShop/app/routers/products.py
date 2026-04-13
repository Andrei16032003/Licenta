from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from sqlalchemy.orm import Session, joinedload, subqueryload, contains_eager
from sqlalchemy import or_, func, select, desc, asc
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date as date_type
import uuid as uuid_module
import shutil, os

from app.database import get_db
from app.models.product import Product, Category, ProductImage
from app.models.user_profile import Review
from app.models.filter_option import FilterOption
from app.dependencies import require_role
_require_products  = require_role("admin", "achizitii")
_require_marketing = require_role("admin", "marketing", "manager")
from app.models.user import User

# ── SEED DATA (chei exacte din DB) ───────────────────────────
FILTER_SEEDS = {
    "cpu": [
        {"key": "socket",      "label": "Socket",        "values": ["LGA1700", "AM5", "AM4"],                  "order": 0},
        {"key": "cores",       "label": "Nuclee",         "values": ["4", "6", "8", "10", "12", "14", "16", "24"], "order": 1},
        {"key": "memory_type", "label": "Tip Memorie",   "values": ["DDR4", "DDR5"],                           "order": 2},
        {"key": "tdp",         "label": "TDP (W)",        "values": ["65", "105", "120", "125", "150", "170"], "order": 3},
    ],
    "motherboard": [
        {"key": "socket",       "label": "Socket",      "values": ["LGA1700", "AM5", "AM4"],   "order": 0},
        {"key": "form_factor",  "label": "Form Factor", "values": ["ATX", "mATX", "ITX"],      "order": 1},
        {"key": "memory_type",  "label": "Tip Memorie", "values": ["DDR4", "DDR5"],            "order": 2},
        {"key": "memory_slots", "label": "Sloturi RAM", "values": ["2", "4"],                  "order": 3},
    ],
    "ram": [
        {"key": "type",        "label": "Tip",       "values": ["DDR4", "DDR5"],                                            "order": 0},
        {"key": "capacity_gb", "label": "Capacitate","values": ["8", "16", "32", "64"],                                    "order": 1},
        {"key": "speed_mhz",   "label": "Viteza",    "values": ["2666", "3200", "3600", "4800", "5200", "6000", "6400"],   "order": 2},
    ],
    "storage": [
        {"key": "interface",   "label": "Interfata",  "values": ["NVMe", "SATA III"],              "order": 0},
        {"key": "capacity_gb", "label": "Capacitate", "values": ["120", "240", "480", "500", "960", "1000", "2000", "4000"], "order": 1},
        {"key": "form_factor", "label": "Form Factor","values": ["M.2", "2.5 inch", "3.5 inch"],  "order": 2},
    ],
    "gpu": [
        {"key": "vram_gb",     "label": "VRAM (GB)",   "values": ["4", "6", "8", "12", "16", "20", "24"], "order": 0},
        {"key": "memory_type", "label": "Tip Memorie", "values": ["GDDR6", "GDDR6X"],                     "order": 1},
        {"key": "slot",        "label": "Slot PCIe",   "values": ["PCIe 3.0", "PCIe 4.0"],               "order": 2},
    ],
    "psu": [
        {"key": "wattage",     "label": "Putere (W)",  "values": ["500", "550", "650", "750", "850", "1000", "1200", "1600"], "order": 0},
        {"key": "certification","label": "Certificare","values": ["80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"],  "order": 1},
        {"key": "modular",     "label": "Modular",     "values": ["true", "false"],                                           "order": 2},
    ],
    "case": [
        {"key": "form_factor", "label": "Form Factor", "values": ["ATX", "mATX", "ITX"], "order": 0},
    ],
    "cooler": [
        {"key": "type",        "label": "Tip",           "values": ["air", "aio"],               "order": 0},
        {"key": "radiator_mm", "label": "Radiator (mm)", "values": ["120", "240", "280", "360", "420"], "order": 1},
    ],
    "mouse": [
        {"key": "wireless",  "label": "Conectivitate", "values": ["true", "false"],                                          "order": 0},
        {"key": "dpi",       "label": "DPI Max",       "values": ["6400", "8000", "12000", "16000", "25600", "30000", "35000"], "order": 1},
        {"key": "sensor",    "label": "Senzor",        "values": ["HERO 25K", "HERO 16K", "Focus Pro 35K", "Focus Pro", "Focus+", "TrueMove3+", "TrueMove Core", "PixArt 26K", "PMW3392", "Darkfield"], "order": 2},
    ],
    "keyboard": [
        {"key": "size",     "label": "Marime",       "values": ["full", "TKL", "75%", "60%"],                                "order": 0},
        {"key": "wireless", "label": "Conectivitate","values": ["true", "false"],                                             "order": 1},
        {"key": "switches", "label": "Switch-uri",   "values": ["Razer Yellow", "Razer Optical Linear", "Razer Optical Clicky", "OmniPoint 2.0", "Cherry MX Red", "Cherry MX Speed", "GX Red", "GX Blue", "GL Linear", "GL Tactile", "HyperX Red", "Corsair OPX", "Brown", "Membrana", "Whisper Silent"], "order": 2},
        {"key": "rgb",      "label": "RGB",          "values": ["true", "false"],                                             "order": 3},
    ],
    "headset": [
        {"key": "wireless",  "label": "Conectivitate","values": ["true", "false"],                                             "order": 0},
        {"key": "surround",  "label": "Sunet",        "values": ["stereo", "7.1 virtual", "DTS 7.1", "DTS Headphone:X", "DTS X 2.0", "Dolby 7.1", "Dolby Atmos", "THX Spatial"], "order": 1},
        {"key": "drivers_mm","label": "Difuzoare",    "values": ["40", "50", "53", "90"],                                     "order": 2},
    ],
    "monitor": [
        {"key": "panel",       "label": "Tip Panel",   "values": ["IPS", "VA", "OLED"],                                      "order": 0},
        {"key": "size_inch",   "label": "Diagonala",   "values": ["24", "27", "32", "34", "45", "49"],                        "order": 1},
        {"key": "resolution",  "label": "Rezolutie",   "values": ["1920x1080", "2560x1440", "3440x1440", "3840x2160", "5120x1440"], "order": 2},
        {"key": "refresh_hz",  "label": "Refresh (Hz)","values": ["60", "144", "165", "170", "175", "240", "270"],           "order": 3},
    ],
}

router = APIRouter(prefix="/products", tags=["Produse"])

class ProductCreate(BaseModel):
    category_id: int
    name: str
    slug: str
    brand: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None
    price: float
    old_price: Optional[float] = None
    stock: int = 0
    sku: Optional[str] = None
    specs: dict = {}
    warranty_months: int = 24

# Returneaza produse paginate cu filtrare dupa categorie, brand, pret, specs si cautare text
@router.get("/")
def get_products(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    in_stock: Optional[bool] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = (
        db.query(Product)
        .join(Category)
        .options(contains_eager(Product.category), subqueryload(Product.images))
        .filter(Product.is_active == True)
    )
    if featured:
        query = query.filter(Product.is_featured == True)
    if in_stock:
        query = query.filter(Product.stock > 0)
    if category:
        query = query.filter(Category.slug == category)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if search:
        # Split search into individual terms and require ALL terms to match
        # Each term is checked against: product name, brand, category name, category slug, description
        terms = search.strip().split()
        for term in terms:
            pattern = f"%{term}%"
            query = query.filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.brand.ilike(pattern),
                    Product.description.ilike(pattern),
                    Category.name.ilike(pattern),
                    Category.slug.ilike(pattern),
                )
            )
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Spec filters: params prefixed with "spec_" (e.g. spec_socket=AM5&spec_socket=LGA1700)
    # Multiple values for same key → OR; different keys → AND
    spec_filters: dict[str, list[str]] = {}
    for key, value in request.query_params.multi_items():
        if key.startswith("spec_"):
            spec_key = key[5:]
            spec_filters.setdefault(spec_key, []).append(value)
    for spec_key, values in spec_filters.items():
        conditions = [Product.specs[spec_key].astext == v for v in values]
        query = query.filter(or_(*conditions))

    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "name_asc":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    products = query.offset(skip).limit(limit).all()

    # Fetch ratings for all products in one query
    product_ids = [p.id for p in products]
    ratings = {}
    if product_ids:
        rows = db.query(
            Review.product_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("count"),
        ).filter(
            Review.product_id.in_(product_ids),
            Review.is_approved == True,
        ).group_by(Review.product_id).all()
        ratings = {str(r.product_id): (round(float(r.avg_rating), 1), r.count) for r in rows}

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "brand": p.brand,
                "price": float(p.price),
                "old_price": float(p.old_price) if p.old_price else None,
                "stock": p.stock,
                "description": p.description,
                "specs": p.specs,
                "category": p.category.name if p.category else None,
                "category_slug": p.category.slug if p.category else None,
                "image_url": p.images[0].url if p.images else None,
                "is_featured": p.is_featured,
                "average_rating": ratings.get(str(p.id), (0, 0))[0],
                "review_count": ratings.get(str(p.id), (0, 0))[1],
                "sku": p.sku,
                "model": p.model,
                "warranty_months": p.warranty_months,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in products
        ]
    }

# Returneaza detaliile complete ale unui produs inclusiv imagini si rating mediu
@router.get("/{product_id}")
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produsul nu a fost gasit")
    rating_row = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("count"),
    ).filter(
        Review.product_id == product_id,
        Review.is_approved == True,
    ).first()
    return {
        "id": str(product.id),
        "name": product.name,
        "brand": product.brand,
        "model": product.model,
        "description": product.description,
        "price": float(product.price),
        "old_price": float(product.old_price) if product.old_price else None,
        "stock": product.stock,
        "specs": product.specs,
        "warranty_months": product.warranty_months,
        "category": product.category.name if product.category else None,
        "category_slug": product.category.slug if product.category else None,
        "images": [{"id": str(img.id), "url": img.url} for img in product.images],
        "average_rating": round(float(rating_row.avg_rating), 1) if rating_row.avg_rating else 0,
        "review_count": rating_row.count or 0,
    }

# Adauga un produs nou in catalog (doar admin)
@router.post("/", status_code=201)
def create_product(req: ProductCreate, db: Session = Depends(get_db), _: User = Depends(_require_products)):
    product = Product(**req.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"message": "Produs adaugat", "id": str(product.id)}

# Actualizeaza toate campurile unui produs (suprascrie complet)
@router.put("/{product_id}")
def update_product(product_id: UUID, req: ProductCreate, db: Session = Depends(get_db), _: User = Depends(_require_products)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")
    for key, val in req.model_dump().items():
        setattr(product, key, val)
    db.commit()
    return {"message": "Produs actualizat"}

@router.put("/{product_id}/featured")
def toggle_featured(product_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_products)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")
    product.is_featured = not product.is_featured
    db.commit()
    return {"is_featured": product.is_featured}

# Dezactiveaza soft-delete un produs (is_active=False); nu sterge din baza de date
@router.delete("/{product_id}")
def delete_product(product_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_products)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")
    product.is_active = False
    db.commit()
    return {"message": "Produs dezactivat"}

# Returneaza lista tuturor categoriilor sortate dupa sort_order
@router.get("/categories/all")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.sort_order).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in cats]

# Returneaza optiunile de filtrare disponibile pentru o categorie (ex: socket, cores)
@router.get("/categories/{category_slug}/filters")
def get_category_filters(category_slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == category_slug).first()
    if not cat:
        raise HTTPException(404, "Categoria nu a fost gasita")
    filters = (
        db.query(FilterOption)
        .filter(FilterOption.category_id == cat.id)
        .order_by(FilterOption.sort_order)
        .all()
    )
    return [
        {"key": f.filter_key, "label": f.filter_label, "values": f.filter_values}
        for f in filters
    ]

# Populeaza filter_options cu configuratia predefinita din FILTER_SEEDS; ruleaza o singura data
@router.post("/admin/seed-filters", status_code=201)
def seed_filters(db: Session = Depends(get_db), _: User = Depends(_require_products)):
    # Incarca toate categoriile necesare intr-un singur query (evita N+1)
    slugs = list(FILTER_SEEDS.keys())
    cats_by_slug = {
        c.slug: c
        for c in db.query(Category).filter(Category.slug.in_(slugs)).all()
    }

    inserted = 0
    for slug, entries in FILTER_SEEDS.items():
        cat = cats_by_slug.get(slug)
        if not cat:
            continue
        # sterge eventualele intrari vechi pentru aceasta categorie
        db.query(FilterOption).filter(FilterOption.category_id == cat.id).delete()
        for entry in entries:
            fo = FilterOption(
                category_id=cat.id,
                filter_key=entry["key"],
                filter_label=entry["label"],
                filter_values=entry["values"],
                sort_order=entry["order"],
            )
            db.add(fo)
            inserted += 1
    db.commit()
    return {"message": f"Seeding complet: {inserted} filtre adaugate"}

# Returneaza imaginile unui produs ordonate dupa sort_order
@router.get("/{product_id}/images")
def get_product_images(product_id: UUID, db: Session = Depends(get_db)):
    images = db.query(ProductImage).filter(ProductImage.product_id == product_id).order_by(ProductImage.sort_order).all()
    return [{"id": str(img.id), "url": img.url, "alt_text": img.alt_text, "sort_order": img.sort_order} for img in images]

# Incarca o imagine pentru un produs; salveaza fisierul pe disk si inregistreaza URL-ul in DB
@router.post("/{product_id}/images", status_code=201)
async def upload_product_image(product_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(_require_products)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Fisierul trebuie sa fie o imagine")
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid_module.uuid4()}.{ext}"
    file_path = f"uploads/products/{filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    url = f"/uploads/products/{filename}"
    img = ProductImage(product_id=product_id, url=url, alt_text=product.name)
    db.add(img)
    db.commit()
    db.refresh(img)
    return {"id": str(img.id), "url": url, "message": "Imagine incarcata cu succes"}

# ── MARKETING: statistici produse (vanzari + rating) ─────────────
@router.get("/marketing/stats")
def marketing_stats(db: Session = Depends(get_db), _: User = Depends(_require_marketing)):
    from app.models.order import OrderItem
    from app.models.user_profile import Review as ReviewModel

    # Unitati vandute si venituri per produs
    sales = (
        db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
        )
        .group_by(OrderItem.product_id)
        .all()
    )
    sales_map = {str(r.product_id): {"units_sold": int(r.units_sold or 0), "revenue": float(r.revenue or 0)} for r in sales}

    # Rating mediu si numar recenzii per produs
    ratings = (
        db.query(
            ReviewModel.product_id,
            func.avg(ReviewModel.rating).label("avg_rating"),
            func.count(ReviewModel.id).label("review_count"),
        )
        .filter(ReviewModel.is_approved == True)
        .group_by(ReviewModel.product_id)
        .all()
    )
    rating_map = {str(r.product_id): {"avg_rating": round(float(r.avg_rating), 1), "review_count": int(r.review_count)} for r in ratings}

    products = db.query(Product).filter(Product.is_active == True).all()
    cats_by_id = {c.id: c for c in db.query(Category).all()}
    result = []
    today = date_type.today()
    for p in products:
        pid = str(p.id)
        s = sales_map.get(pid, {"units_sold": 0, "revenue": 0.0})
        r = rating_map.get(pid, {"avg_rating": 0.0, "review_count": 0})
        cat = cats_by_id.get(p.category_id)
        discount_expired = bool(p.discount_expires_at and p.discount_expires_at < today)
        result.append({
            "id":               pid,
            "name":             p.name,
            "brand":            p.brand,
            "category":         cat.name if cat else "",
            "category_slug":    cat.slug if cat else "",
            "price":            float(p.price),
            "old_price":        float(p.old_price) if p.old_price else None,
            "discount_expires_at": p.discount_expires_at.isoformat() if p.discount_expires_at else None,
            "discount_expired": discount_expired,
            "stock":            p.stock,
            "units_sold":       s["units_sold"],
            "revenue":          s["revenue"],
            "avg_rating":       r["avg_rating"],
            "review_count":     r["review_count"],
        })
    return result


class DiscountRequest(BaseModel):
    discount_type:   str           # "percent" | "fixed"
    discount_value:  float
    expires_at:      Optional[str] = None   # ISO date string sau None


# ── MARKETING: aplica/elimina reducere pe un produs ───────────────
@router.put("/{product_id}/discount")
def apply_discount(
    product_id: UUID,
    req: DiscountRequest,
    db: Session = Depends(get_db),
    _: User = Depends(_require_marketing),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")

    original = float(product.old_price if product.old_price else product.price)
    current  = float(product.price)
    base     = original  # intotdeauna aplicam discount la pretul original

    if req.discount_type == "percent":
        if not (0 < req.discount_value < 100):
            raise HTTPException(400, "Procentul trebuie sa fie intre 1 si 99")
        new_price = round(base * (1 - req.discount_value / 100), 2)
    elif req.discount_type == "fixed":
        new_price = round(base - req.discount_value, 2)
        if new_price <= 0:
            raise HTTPException(400, "Reducerea depaseste pretul produsului")
    else:
        raise HTTPException(400, "discount_type trebuie sa fie 'percent' sau 'fixed'")

    product.old_price = base
    product.price     = new_price
    product.discount_expires_at = date_type.fromisoformat(req.expires_at) if req.expires_at else None
    db.commit()
    return {"price": product.price, "old_price": product.old_price, "discount_expires_at": req.expires_at}


# ── MARKETING: elimina reducerea de pe un produs ──────────────────
@router.delete("/{product_id}/discount")
def remove_discount(
    product_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(_require_marketing),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produsul nu a fost gasit")
    if product.old_price:
        product.price   = product.old_price
        product.old_price = None
    product.discount_expires_at = None
    db.commit()
    return {"price": float(product.price), "old_price": None}


# Sterge o imagine din DB si de pe disk
@router.delete("/images/{image_id}")
def delete_product_image(image_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_products)):
    img = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not img:
        raise HTTPException(404, "Imaginea nu a fost gasita")
    file_path = img.url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)
    db.delete(img)
    db.commit()
    return {"message": "Imagine stearsa"}