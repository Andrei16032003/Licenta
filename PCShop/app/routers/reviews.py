from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.user_profile import Review
from app.models.product import Product
from app.dependencies import require_role
_require_reviews = require_role("admin", "suport", "marketing", "manager")
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Review-uri"])

class ReviewCreate(BaseModel):
    user_id: UUID
    product_id: UUID
    order_id: Optional[UUID] = None
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    is_anonymous: bool = False
    author_name: Optional[str] = None

class ReviewApprove(BaseModel):
    is_verified: bool = False

class ReviewReject(BaseModel):
    reason: str

# ── REVIEW-URI PRODUS (aprobate) ──────────────────────────────

# Returneaza review-urile aprobate si media ratingurilor pentru un produs
@router.get("/product/{product_id}")
def get_product_reviews(product_id: UUID, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).order_by(Review.created_at.desc()).all()

    avg = db.query(func.avg(Review.rating)).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).scalar()

    return {
        "product_id": str(product_id),
        "average_rating": round(float(avg), 1) if avg else 0,
        "total_reviews": len(reviews),
        "reviews": [
            {
                "id": str(r.id),
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "author_name": "Anonim" if r.is_anonymous else (r.author_name or "Utilizator"),
                "is_verified": r.is_verified,
                "helpful_count": r.helpful_count,
                "created_at": r.created_at
            }
            for r in reviews
        ]
    }

# ── TOATE REVIEW-URILE (admin) ────────────────────────────────

# Returneaza toate review-urile; incarca produsele intr-un singur query (evita N+1)
@router.get("/admin/all")
def get_all_reviews(db: Session = Depends(get_db), _: User = Depends(_require_reviews)):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()

    product_ids = {r.product_id for r in reviews}
    products_by_id = (
        {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()}
        if product_ids else {}
    )

    # Fetch user names for non-anonymous reviews
    user_ids = {r.user_id for r in reviews if not r.is_anonymous}
    users_by_id = (
        {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
        if user_ids else {}
    )

    result = []
    for r in reviews:
        prod = products_by_id.get(r.product_id)
        u = users_by_id.get(r.user_id)
        result.append({
            "id": str(r.id),
            "user_id": str(r.user_id) if r.user_id else None,
            "user_name": u.name if u and not r.is_anonymous else None,
            "product_id": str(r.product_id),
            "product_name": prod.name if prod else "Produs sters",
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "author_name": "Anonim" if r.is_anonymous else (r.author_name or "Utilizator"),
            "is_anonymous": r.is_anonymous,
            "is_verified": r.is_verified,
            "is_approved": r.is_approved,
            "rejection_reason": r.rejection_reason,
            "helpful_count": r.helpful_count,
            "created_at": r.created_at,
        })
    return result

# ── ADAUGA REVIEW ────────────────────────────────────────────

# Salveaza un review nou; il trimite la moderare (is_approved=False implicit)
@router.post("/", status_code=201)
def add_review(req: ReviewCreate, db: Session = Depends(get_db)):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating-ul trebuie sa fie intre 1 si 5")

    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produsul nu exista")

    existing = db.query(Review).filter(
        Review.user_id == req.user_id,
        Review.product_id == req.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ai scris deja un review pentru acest produs")

    review = Review(
        user_id=req.user_id,
        product_id=req.product_id,
        order_id=req.order_id,
        rating=req.rating,
        title=req.title,
        comment=req.comment,
        is_anonymous=req.is_anonymous,
        author_name=req.author_name,
        is_verified=req.order_id is not None,
        is_approved=False,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "Review trimis spre moderare", "id": str(review.id)}

# ── APROBA REVIEW ─────────────────────────────────────────────
@router.put("/{review_id}/approve")
def approve_review(review_id: UUID, req: ReviewApprove, db: Session = Depends(get_db), _: User = Depends(_require_reviews)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review negasit")
    review.is_approved = True
    review.rejection_reason = None
    review.is_verified = req.is_verified
    db.commit()
    return {"message": "Review aprobat", "is_verified": review.is_verified}

# ── RESPINGE REVIEW ───────────────────────────────────────────
@router.put("/{review_id}/reject")
def reject_review(review_id: UUID, req: ReviewReject, db: Session = Depends(get_db), _: User = Depends(_require_reviews)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review negasit")
    review.is_approved = False
    review.rejection_reason = req.reason
    db.commit()
    return {"message": "Review respins"}

# ── STERGE REVIEW ────────────────────────────────────────────
@router.delete("/{review_id}")
def delete_review(review_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_reviews)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review negasit")
    db.delete(review)
    db.commit()
    return {"message": "Review sters"}

# ── HELPFUL ──────────────────────────────────────────────────

# Incrementeaza contorul de "util" al unui review
@router.post("/{review_id}/helpful")
def mark_helpful(review_id: UUID, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review negasit")
    review.helpful_count += 1
    db.commit()
    return {"message": "Multumim pentru feedback", "helpful_count": review.helpful_count}
