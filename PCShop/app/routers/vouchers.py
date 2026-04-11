from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.voucher import Voucher
from app.models.product import Category
from app.models.user import User
from app.dependencies import require_role
_require_vouchers = require_role("admin", "marketing")

router = APIRouter(prefix="/vouchers", tags=["Vouchere"])

# ── Schemas ──────────────────────────────────────────────────

class VoucherCreate(BaseModel):
    code: str
    type: str                          # percent | fixed | free_shipping
    value: Optional[float] = None
    description: Optional[str] = None
    min_order_amount: Optional[float] = None
    category_id: Optional[int] = None
    user_id: Optional[UUID] = None
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None

class VoucherUpdate(BaseModel):
    type: Optional[str] = None
    value: Optional[float] = None
    description: Optional[str] = None
    min_order_amount: Optional[float] = None
    category_id: Optional[int] = None
    user_id: Optional[UUID] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class ValidateRequest(BaseModel):
    code: str
    user_id: UUID
    subtotal: float
    category_id: Optional[int] = None  # pentru verificare pe categorie

# ── Helper ────────────────────────────────────────────────────

# Serializeaza un voucher in dict JSON.
# cats_by_id / users_by_id sunt dictionare pre-incarcate (pentru apeluri in bucla).
# Daca lipsesc, face query direct in DB (pentru apeluri pe un singur voucher).
def _serialize(v: Voucher, db: Session, cats_by_id: dict = None, users_by_id: dict = None):
    if cats_by_id is not None:
        cat = cats_by_id.get(v.category_id) if v.category_id else None
        category_name = cat.name if cat else None
    elif v.category_id:
        cat = db.query(Category).filter(Category.id == v.category_id).first()
        category_name = cat.name if cat else None
    else:
        category_name = None

    if users_by_id is not None:
        u = users_by_id.get(v.user_id) if v.user_id else None
        user_name = u.name if u else None
    elif v.user_id:
        u = db.query(User).filter(User.id == v.user_id).first()
        user_name = u.name if u else None
    else:
        user_name = None

    return {
        "id":               str(v.id),
        "code":             v.code,
        "type":             v.type,
        "value":            float(v.value) if v.value is not None else None,
        "description":      v.description,
        "min_order_amount": float(v.min_order_amount) if v.min_order_amount else None,
        "category_id":      v.category_id,
        "category_name":    category_name,
        "user_id":          str(v.user_id) if v.user_id else None,
        "user_name":        user_name,
        "usage_limit":      v.usage_limit,
        "used_count":       v.used_count,
        "is_active":        v.is_active,
        "expires_at":       v.expires_at,
        "created_at":       v.created_at,
    }

# ── CLIENT: voucherele unui user ──────────────────────────────

# Returneaza voucherele active ale unui user + voucherele globale (user_id null)
@router.get("/my/{user_id}")
def get_my_vouchers(user_id: UUID, db: Session = Depends(get_db)):
    from sqlalchemy import or_
    vouchers = db.query(Voucher).filter(
        Voucher.is_active == True,
        or_(Voucher.user_id == user_id, Voucher.user_id == None),
    ).order_by(Voucher.created_at.desc()).all()

    # Incarca categoriile si userii necesari intr-un singur query (evita N+1)
    cat_ids  = {v.category_id for v in vouchers if v.category_id}
    user_ids = {v.user_id     for v in vouchers if v.user_id}
    cats_by_id  = {c.id: c for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()}  if cat_ids  else {}
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}          if user_ids else {}

    return [_serialize(v, db, cats_by_id, users_by_id) for v in vouchers]

# ── CLIENT: claim voucher dupa cod ───────────────────────────

class ClaimRequest(BaseModel):
    code: str
    user_id: UUID

# Utilizatorul revendica un voucher dupa cod; daca e global, il atribuie userului
@router.post("/claim")
def claim_voucher(req: ClaimRequest, db: Session = Depends(get_db)):
    code = req.code.strip().upper()
    v = db.query(Voucher).filter(Voucher.code == code).first()
    if not v:
        raise HTTPException(404, "Codul introdus nu exista.")
    if not v.is_active:
        raise HTTPException(400, "Voucher-ul nu mai este activ.")
    if v.expires_at and v.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(400, "Voucher-ul a expirat.")
    if v.usage_limit is not None and v.used_count >= v.usage_limit:
        raise HTTPException(400, "Voucher-ul a fost deja folosit de numarul maxim de ori.")
    # Daca e atribuit unui alt user
    if v.user_id and str(v.user_id) != str(req.user_id):
        raise HTTPException(403, "Acest voucher nu este pentru contul tau.")
    # Daca e global (user_id null), atribuie-l acestui user
    if v.user_id is None:
        v.user_id = req.user_id
        db.commit()
    return {"message": "Voucher adaugat cu succes!", "voucher": _serialize(v, db)}

# ── CLIENT + CHECKOUT: valideaza voucher ────────────────────

# Valideaza un cod voucher si calculeaza reducerea aplicabila comenzii curente
@router.post("/validate")
def validate_voucher(req: ValidateRequest, db: Session = Depends(get_db)):
    code = req.code.strip().upper()
    v = db.query(Voucher).filter(Voucher.code == code).first()
    if not v:
        raise HTTPException(404, "Codul introdus nu exista.")
    if not v.is_active:
        raise HTTPException(400, "Voucher-ul nu mai este activ.")
    if v.expires_at and v.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(400, "Voucher-ul a expirat.")
    if v.usage_limit is not None and v.used_count >= v.usage_limit:
        raise HTTPException(400, "Voucher-ul a atins limita de utilizari.")
    if v.user_id and str(v.user_id) != str(req.user_id):
        raise HTTPException(403, "Acest voucher nu este pentru contul tau.")
    if v.min_order_amount and req.subtotal < float(v.min_order_amount):
        raise HTTPException(400, f"Comanda minima pentru acest voucher este {float(v.min_order_amount):.0f} RON.")

    # Calcul reducere
    discount = 0.0
    free_shipping = False

    if v.type == "percent":
        discount = round(req.subtotal * float(v.value) / 100, 2)
    elif v.type == "fixed":
        discount = min(float(v.value), req.subtotal)
    elif v.type == "free_shipping":
        free_shipping = True

    return {
        "valid": True,
        "code": v.code,
        "type": v.type,
        "value": float(v.value) if v.value else None,
        "discount": discount,
        "free_shipping": free_shipping,
        "description": v.description,
        "voucher_id": str(v.id),
    }

# ── ADMIN: lista toate voucherele ────────────────────────────

# Returneaza toate voucherele; incarca categoriile si userii in bulk (evita N+1)
@router.get("/admin/all")
def admin_list(db: Session = Depends(get_db), _: User = Depends(_require_vouchers)):
    vouchers = db.query(Voucher).order_by(Voucher.created_at.desc()).all()

    cat_ids  = {v.category_id for v in vouchers if v.category_id}
    user_ids = {v.user_id     for v in vouchers if v.user_id}
    cats_by_id  = {c.id: c for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()}  if cat_ids  else {}
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}          if user_ids else {}

    return [_serialize(v, db, cats_by_id, users_by_id) for v in vouchers]

# ── ADMIN: creeaza voucher ────────────────────────────────────

# Creeaza un voucher nou; codul este normalizat la uppercase automat
@router.post("/admin/create", status_code=201)
def admin_create(req: VoucherCreate, db: Session = Depends(get_db), _: User = Depends(_require_vouchers)):
    code = req.code.strip().upper()
    if db.query(Voucher).filter(Voucher.code == code).first():
        raise HTTPException(400, f"Codul '{code}' exista deja.")
    if req.type not in ("percent", "fixed", "free_shipping"):
        raise HTTPException(400, "Tipul trebuie sa fie: percent, fixed sau free_shipping.")
    if req.type in ("percent", "fixed") and req.value is None:
        raise HTTPException(400, "Valoarea este obligatorie pentru tipul ales.")

    v = Voucher(
        code=code,
        type=req.type,
        value=req.value,
        description=req.description,
        min_order_amount=req.min_order_amount,
        category_id=req.category_id,
        user_id=req.user_id,
        usage_limit=req.usage_limit,
        expires_at=req.expires_at,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return _serialize(v, db)

# ── ADMIN: editeaza voucher ───────────────────────────────────

# Actualizeaza doar campurile furnizate (patch partial)
@router.put("/admin/{voucher_id}")
def admin_update(voucher_id: UUID, req: VoucherUpdate, db: Session = Depends(get_db), _: User = Depends(_require_vouchers)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher negasit.")
    if req.type is not None:
        v.type = req.type
    if req.value is not None:
        v.value = req.value
    if req.description is not None:
        v.description = req.description
    if req.min_order_amount is not None:
        v.min_order_amount = req.min_order_amount
    if req.category_id is not None:
        v.category_id = req.category_id
    if req.user_id is not None:
        v.user_id = req.user_id
    if req.usage_limit is not None:
        v.usage_limit = req.usage_limit
    if req.is_active is not None:
        v.is_active = req.is_active
    if req.expires_at is not None:
        v.expires_at = req.expires_at
    db.commit()
    return _serialize(v, db)

# ── ADMIN: sterge voucher ─────────────────────────────────────

@router.delete("/admin/{voucher_id}")
def admin_delete(voucher_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_vouchers)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher negasit.")
    db.delete(v)
    db.commit()
    return {"message": "Voucher sters."}

# ── ADMIN: atribuie voucher unui user ─────────────────────────

class AssignRequest(BaseModel):
    voucher_id: UUID
    user_id: UUID

# Atribuie un voucher existent unui user specific
@router.post("/admin/assign")
def admin_assign(req: AssignRequest, db: Session = Depends(get_db), _: User = Depends(_require_vouchers)):
    v = db.query(Voucher).filter(Voucher.id == req.voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher negasit.")
    v.user_id = req.user_id
    db.commit()
    return {"message": "Voucher atribuit cu succes.", "voucher": _serialize(v, db)}
