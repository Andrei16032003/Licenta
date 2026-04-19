from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
import bcrypt

from app.database import get_db
from app.models.user import User
from app.dependencies import require_admin

router = APIRouter(prefix="/team", tags=["Echipa"])

# Roluri permise pentru angajati (nu pot crea clienti obisnuiti prin acest endpoint)
STAFF_ROLES = {"admin", "manager", "achizitii", "marketing", "suport"}

class TeamMemberCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

# Lista toti angajatii (exclude clientii obisnuiti)
@router.get("/")
def list_team(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    members = (
        db.query(User)
        .filter(User.role.in_(STAFF_ROLES))
        .order_by(User.created_at)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "email": m.email,
            "role": m.role,
            "phone": m.phone,
            "is_active": m.is_active,
            "last_login": m.last_login.isoformat() if m.last_login else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in members
    ]

# Creeaza un cont nou de angajat
@router.post("/", status_code=201)
def create_member(req: TeamMemberCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if req.role not in STAFF_ROLES:
        raise HTTPException(400, f"Rol invalid. Roluri permise: {', '.join(STAFF_ROLES)}")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(409, "Email deja inregistrat")
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hashed,
        role=req.role,
        phone=req.phone,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "message": "Angajat creat cu succes"}

# Actualizeaza rolul sau datele unui angajat
@router.put("/{user_id}")
def update_member(user_id: UUID, req: TeamMemberUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilizatorul nu a fost gasit")
    if user.role not in STAFF_ROLES:
        raise HTTPException(400, "Poti edita doar angajati")
    if req.role and req.role not in STAFF_ROLES:
        raise HTTPException(400, f"Rol invalid: {req.role}")
    if req.name is not None:
        user.name = req.name
    if req.role is not None:
        user.role = req.role
    if req.phone is not None:
        user.phone = req.phone
    if req.is_active is not None:
        user.is_active = req.is_active
    db.commit()
    return {"message": "Angajat actualizat"}

class AssignRoleRequest(BaseModel):
    email: str
    role: str

# Atribuie un rol de staff unui cont existent dupa email
@router.post("/assign-role")
def assign_role(req: AssignRoleRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if req.role not in STAFF_ROLES:
        raise HTTPException(400, f"Rol invalid. Roluri permise: {', '.join(STAFF_ROLES)}")
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(404, "Nu există niciun cont cu acest email.")
    user.role = req.role
    user.is_verified = True
    db.commit()
    return {"message": f"Rolul '{req.role}' a fost atribuit contului {user.email}.", "name": user.name}

# Sterge definitiv un cont de angajat din baza de date
@router.delete("/{user_id}")
def delete_member(user_id: UUID, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilizatorul nu a fost gasit")
    if user.role not in STAFF_ROLES:
        raise HTTPException(400, "Poti sterge doar angajati")
    if str(user.id) == str(current_admin.id):
        raise HTTPException(400, "Nu te poti sterge pe tine insuti")
    db.delete(user)
    db.commit()
    return {"message": "Angajat sters definitiv"}
