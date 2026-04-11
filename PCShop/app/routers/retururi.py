from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.retur import Retur
from app.dependencies import require_role
_require_retururi = require_role("admin", "suport")
from app.models.user import User

router = APIRouter(prefix="/retururi", tags=["Retururi"])

class ReturCreate(BaseModel):
    user_id:        UUID
    order_id:       UUID
    product_id:     Optional[UUID] = None
    product_name:   str
    motiv:          str
    motiv_detalii:  Optional[str] = None
    stare_produs:   str
    pickup_address: dict = {}
    refund_method:  str = "card"
    iban:           Optional[str] = None
    titular_cont:   Optional[str] = None

# Inregistreaza o cerere de retur pentru un produs dintr-o comanda
@router.post("")
def create_retur(data: ReturCreate, db: Session = Depends(get_db)):
    retur = Retur(
        user_id        = data.user_id,
        order_id       = data.order_id,
        product_id     = data.product_id,
        product_name   = data.product_name,
        motiv          = data.motiv,
        motiv_detalii  = data.motiv_detalii,
        stare_produs   = data.stare_produs,
        pickup_address = data.pickup_address,
        refund_method  = data.refund_method,
        iban           = data.iban,
        titular_cont   = data.titular_cont,
        status         = "in_asteptare",
    )
    db.add(retur)
    db.commit()
    db.refresh(retur)
    return {"success": True, "id": str(retur.id)}

# Returneaza toate cererile de retur ale unui user
@router.get("/user/{user_id}")
def get_retururi_user(user_id: UUID, db: Session = Depends(get_db)):
    retururi = (
        db.query(Retur)
        .filter(Retur.user_id == user_id)
        .order_by(Retur.created_at.desc())
        .all()
    )
    return [
        {
            "id":             str(r.id),
            "order_id":       str(r.order_id),
            "product_name":   r.product_name,
            "motiv":          r.motiv,
            "motiv_detalii":  r.motiv_detalii,
            "stare_produs":   r.stare_produs,
            "pickup_address": r.pickup_address,
            "refund_method":  r.refund_method,
            "iban":           r.iban,
            "titular_cont":   r.titular_cont,
            "status":         r.status,
            "created_at":     r.created_at,
        }
        for r in retururi
    ]

# Returneaza toate cererile de retur ordonate descendent dupa data crearii (admin)
@router.get("/admin/all")
def get_all_retururi(db: Session = Depends(get_db), _: User = Depends(_require_retururi)):
    retururi = db.query(Retur).order_by(Retur.created_at.desc()).all()
    return [
        {
            "id":             str(r.id),
            "order_id":       str(r.order_id),
            "product_name":   r.product_name,
            "motiv":          r.motiv,
            "motiv_detalii":  r.motiv_detalii,
            "stare_produs":   r.stare_produs,
            "refund_method":  r.refund_method,
            "iban":           r.iban,
            "titular_cont":   r.titular_cont,
            "pickup_address": r.pickup_address,
            "status":         r.status,
            "priority":       r.priority or "normal",
            "created_at":     r.created_at,
        }
        for r in retururi
    ]

# Actualizeaza statusul unui retur (admin); ex: in_asteptare -> aprobat -> finalizat
@router.patch("/{retur_id}/status")
def update_retur_status(retur_id: UUID, data: dict, db: Session = Depends(get_db), _: User = Depends(_require_retururi)):
    r = db.query(Retur).filter(Retur.id == retur_id).first()
    if not r: raise HTTPException(404)
    r.status = data.get("status", r.status)
    db.commit()
    return {"success": True}

# Actualizeaza prioritatea unui retur (admin/suport)
@router.patch("/{retur_id}/priority")
def update_retur_priority(retur_id: UUID, data: dict, db: Session = Depends(get_db), _: User = Depends(_require_retururi)):
    r = db.query(Retur).filter(Retur.id == retur_id).first()
    if not r: raise HTTPException(404)
    priority = data.get("priority", "normal")
    if priority not in ("normal", "ridicat", "urgent"):
        raise HTTPException(400, "Prioritate invalida")
    r.priority = priority
    db.commit()
    return {"success": True}
