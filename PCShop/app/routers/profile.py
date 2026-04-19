from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.user_profile import UserAddress, UserPaymentMethod
from app.models.user import User

router = APIRouter(prefix="/profile", tags=["Profil utilizator"])

# ── DATE PERSONALE ──────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@router.put("/{user_id}")
def update_profile(user_id: UUID, req: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost gasit")
    if req.name is not None:
        name = req.name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Numele trebuie să aibă minim 2 caractere")
        user.name = name
    if req.phone is not None:
        user.phone = req.phone.strip() or None
    db.commit()
    return {"message": "Profil actualizat", "name": user.name, "phone": user.phone}

# ── ADRESE ───────────────────────────────────────────────────
class AddressCreate(BaseModel):
    user_id: UUID
    label: str = "Acasa"
    full_name: str
    phone: Optional[str] = None
    county: str
    city: str
    street: str
    postal_code: Optional[str] = None
    is_default: bool = False

@router.get("/{user_id}/addresses")
def get_addresses(user_id: UUID, db: Session = Depends(get_db)):
    addresses = db.query(UserAddress).filter(UserAddress.user_id == user_id).all()
    return [
        {
            "id": str(a.id),
            "label": a.label,
            "full_name": a.full_name,
            "phone": a.phone,
            "county": a.county,
            "city": a.city,
            "street": a.street,
            "postal_code": a.postal_code,
            "is_default": a.is_default,
        }
        for a in addresses
    ]

@router.post("/{user_id}/addresses", status_code=201)
def add_address(user_id: UUID, req: AddressCreate, db: Session = Depends(get_db)):
    if req.is_default:
        db.query(UserAddress).filter(
            UserAddress.user_id == user_id
        ).update({"is_default": False})
    
    address = UserAddress(
        user_id=user_id,
        label=req.label,
        full_name=req.full_name,
        phone=req.phone,
        county=req.county,
        city=req.city,
        street=req.street,
        postal_code=req.postal_code,
        is_default=req.is_default
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return {"message": "Adresa adaugata", "id": str(address.id)}

@router.delete("/{user_id}/addresses/{address_id}")
def delete_address(user_id: UUID, address_id: UUID, db: Session = Depends(get_db)):
    address = db.query(UserAddress).filter(
        UserAddress.id == address_id,
        UserAddress.user_id == user_id
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Adresa negasita")
    db.delete(address)
    db.commit()
    return {"message": "Adresa stearsa"}

# ── METODE DE PLATA ──────────────────────────────────────────
class PaymentMethodCreate(BaseModel):
    user_id: UUID
    provider: str = "card"
    token: str
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    is_default: bool = False

@router.get("/{user_id}/payment-methods")
def get_payment_methods(user_id: UUID, db: Session = Depends(get_db)):
    methods = db.query(UserPaymentMethod).filter(
        UserPaymentMethod.user_id == user_id
    ).all()
    return [
        {
            "id": str(m.id),
            "provider": m.provider,
            "card_last4": m.card_last4,
            "card_brand": m.card_brand,
            "card_exp_month": m.card_exp_month,
            "card_exp_year": m.card_exp_year,
            "is_default": m.is_default,
        }
        for m in methods
    ]

@router.post("/{user_id}/payment-methods", status_code=201)
def add_payment_method(user_id: UUID, req: PaymentMethodCreate, db: Session = Depends(get_db)):
    if req.is_default:
        db.query(UserPaymentMethod).filter(
            UserPaymentMethod.user_id == user_id
        ).update({"is_default": False})
    
    method = UserPaymentMethod(
        user_id=user_id,
        provider=req.provider,
        token=req.token,
        card_last4=req.card_last4,
        card_brand=req.card_brand,
        card_exp_month=req.card_exp_month,
        card_exp_year=req.card_exp_year,
        is_default=req.is_default
    )
    db.add(method)
    db.commit()
    db.refresh(method)
    return {"message": "Metoda de plata adaugata", "id": str(method.id)}

@router.delete("/{user_id}/payment-methods/{method_id}")
def delete_payment_method(user_id: UUID, method_id: UUID, db: Session = Depends(get_db)):
    method = db.query(UserPaymentMethod).filter(
        UserPaymentMethod.id == method_id,
        UserPaymentMethod.user_id == user_id
    ).first()
    if not method:
        raise HTTPException(status_code=404, detail="Metoda de plata negasita")
    db.delete(method)
    db.commit()
    return {"message": "Metoda de plata stearsa"}