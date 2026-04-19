from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
import random, string

from app.database import get_db
from app.models.service import ServiceRequest
from app.models.product import Product, ProductImage
from app.dependencies import require_role
_require_service = require_role("admin", "suport", "manager")
from app.models.user import User
from app.notifications import notify_service_created, notify_service_status

router = APIRouter(prefix="/service", tags=["Service"])

# Genereaza un numar de ticket unic format SRV-XXXXXX
def gen_ticket():
    return "SRV-" + "".join(random.choices(string.digits, k=6))

class ServiceCreate(BaseModel):
    user_id:         UUID
    order_id:        UUID
    product_id:      Optional[UUID] = None
    product_name:    str
    descriere:       str
    pickup_address:  dict = {}
    contact_telefon: str
    contact_email:   Optional[str] = None

# Inregistreaza o cerere de service si genereaza un nr_ticket unic
@router.post("")
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    req = ServiceRequest(
        user_id        = data.user_id,
        order_id       = data.order_id,
        product_id     = data.product_id,
        product_name   = data.product_name,
        descriere      = data.descriere,
        pickup_address = data.pickup_address,
        contact_telefon= data.contact_telefon,
        contact_email  = data.contact_email,
        status         = "in_asteptare",
        nr_ticket      = gen_ticket(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    user = db.query(User).filter(User.id == data.user_id).first()
    if user:
        notify_service_created(user.email, user.name, req.nr_ticket, data.product_name)

    return {"success": True, "id": str(req.id), "nr_ticket": req.nr_ticket}

# Returneaza toate cererile de service ale unui user
@router.get("/user/{user_id}")
def get_service_user(user_id: UUID, db: Session = Depends(get_db)):
    requests = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.user_id == user_id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    product_ids = [r.product_id for r in requests if r.product_id]
    images_by_product = {}
    if product_ids:
        imgs = db.query(ProductImage).filter(ProductImage.product_id.in_(product_ids)).order_by(ProductImage.sort_order).all()
        for img in imgs:
            if img.product_id not in images_by_product:
                images_by_product[img.product_id] = img.url
    return [
        {
            "id":              str(r.id),
            "order_id":        str(r.order_id),
            "product_id":      str(r.product_id) if r.product_id else None,
            "product_name":    r.product_name,
            "image_url":       images_by_product.get(r.product_id),
            "descriere":       r.descriere,
            "pickup_address":  r.pickup_address,
            "contact_telefon": r.contact_telefon,
            "contact_email":   r.contact_email,
            "status":          r.status,
            "nr_ticket":       r.nr_ticket,
            "created_at":      r.created_at,
        }
        for r in requests
    ]

# Returneaza toate cererile de service ordonate descendent dupa data crearii (admin)
@router.get("/admin/all")
def get_all_service(db: Session = Depends(get_db), _: User = Depends(_require_service)):
    reqs = db.query(ServiceRequest).order_by(ServiceRequest.created_at.desc()).all()
    product_ids = [r.product_id for r in reqs if r.product_id]
    images_by_product = {}
    if product_ids:
        imgs = db.query(ProductImage).filter(ProductImage.product_id.in_(product_ids)).order_by(ProductImage.sort_order).all()
        for img in imgs:
            if img.product_id not in images_by_product:
                images_by_product[img.product_id] = img.url
    return [
        {
            "id":              str(r.id),
            "order_id":        str(r.order_id),
            "product_id":      str(r.product_id) if r.product_id else None,
            "product_name":    r.product_name,
            "image_url":       images_by_product.get(r.product_id),
            "descriere":       r.descriere,
            "pickup_address":  r.pickup_address,
            "contact_telefon": r.contact_telefon,
            "contact_email":   r.contact_email,
            "nr_ticket":       r.nr_ticket,
            "status":          r.status,
            "priority":        r.priority or "normal",
            "created_at":      r.created_at,
        }
        for r in reqs
    ]

# Actualizeaza statusul unei cereri de service (admin)
@router.patch("/{req_id}/status")
def update_service_status(req_id: UUID, data: dict, db: Session = Depends(get_db), _: User = Depends(_require_service)):
    r = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not r: raise HTTPException(404)
    r.status = data.get("status", r.status)
    db.commit()

    user = db.query(User).filter(User.id == r.user_id).first()
    if user:
        notify_service_status(user.email, user.name, r.nr_ticket, r.product_name, r.status)

    return {"success": True}

# Actualizeaza prioritatea unei cereri de service (admin/suport)
@router.patch("/{req_id}/priority")
def update_service_priority(req_id: UUID, data: dict, db: Session = Depends(get_db), _: User = Depends(_require_service)):
    r = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not r: raise HTTPException(404)
    priority = data.get("priority", "normal")
    if priority not in ("normal", "ridicat", "urgent"):
        raise HTTPException(400, "Prioritate invalida")
    r.priority = priority
    db.commit()
    return {"success": True}
