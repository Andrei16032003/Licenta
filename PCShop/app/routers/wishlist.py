from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID

from app.database import get_db
from app.models.user_profile import Wishlist
from app.models.product import Product

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

class WishlistAdd(BaseModel):
    user_id: UUID
    product_id: UUID

@router.get("/{user_id}")
def get_wishlist(user_id: UUID, db: Session = Depends(get_db)):
    items = db.query(Wishlist).filter(Wishlist.user_id == user_id).all()
    result = []
    for item in items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if p:
            result.append({
                "wishlist_id": str(item.id),
                "product_id":  str(p.id),
                "name":        p.name,
                "brand":       p.brand,
                "price":       float(p.price),
                "old_price":   float(p.old_price) if p.old_price else None,
                "stock":       p.stock,
                "category":    p.category.name if p.category else None,
                "added_at":    item.added_at,
            })
    return result

@router.post("/", status_code=201)
def add_to_wishlist(req: WishlistAdd, db: Session = Depends(get_db)):
    existing = db.query(Wishlist).filter(
        Wishlist.user_id == req.user_id,
        Wishlist.product_id == req.product_id,
    ).first()
    if existing:
        return {"message": "Deja in wishlist", "already": True}
    db.add(Wishlist(user_id=req.user_id, product_id=req.product_id))
    db.commit()
    return {"message": "Adaugat in wishlist"}

@router.delete("/{user_id}/{product_id}")
def remove_from_wishlist(user_id: UUID, product_id: UUID, db: Session = Depends(get_db)):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == user_id,
        Wishlist.product_id == product_id,
    ).first()
    if not item:
        raise HTTPException(404, "Nu exista in wishlist")
    db.delete(item)
    db.commit()
    return {"message": "Eliminat din wishlist"}
