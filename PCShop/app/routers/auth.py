from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from uuid import UUID
from jose import JWTError, jwt
import bcrypt

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.retur import Retur
from app.models.service import ServiceRequest
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import require_role
_require_clients = require_role("admin", "suport", "marketing")

router = APIRouter(prefix="/auth", tags=["Autentificare"])

# ── Scheme Pydantic ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

# ── Utilitare ────────────────────────────────────────────────

# Hasheaza parola folosind bcrypt
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Verifica parola introdusa fata de hash-ul din baza de date
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

# Genereaza un token JWT cu expirare configurabila
def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ── Endpoints ────────────────────────────────────────────────
# ── Endpoints ────────────────────────────────────────────────

# Inregistreaza un cont nou; returneaza eroare daca emailul exista deja
@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email deja inregistrat")
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Cont creat cu succes", "id": str(user.id)}

# Autentifica userul si returneaza un token JWT
@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email sau parola incorecta")
    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/clients")
def get_clients(db: Session = Depends(get_db), _: User = Depends(_require_clients)):
    """Admin: lista tuturor utilizatorilor (pentru selectii in formulare)."""
    users = db.query(User).order_by(User.name).all()
    return [{"id": str(u.id), "name": u.name, "email": u.email, "role": u.role} for u in users]

# Returneaza istoricul complet al unui client (comenzi, retururi, service)
@router.get("/clients/{user_id}/history")
def get_client_history(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(_require_clients)):
    from uuid import UUID as _UUID
    uid = user_id
    orders_list = (
        db.query(Order)
        .filter(Order.user_id == uid)
        .order_by(Order.created_at.desc())
        .all()
    )
    retururi_list = (
        db.query(Retur)
        .filter(Retur.user_id == uid)
        .order_by(Retur.created_at.desc())
        .all()
    )
    service_list = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.user_id == uid)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return {
        "orders": [
            {
                "id": str(o.id),
                "invoice_number": o.invoice_number,
                "total_price": float(o.total_price),
                "status": o.status,
                "payment_method_type": o.payment_method_type,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders_list
        ],
        "retururi": [
            {
                "id": str(r.id),
                "product_name": r.product_name,
                "motiv": r.motiv,
                "status": r.status,
                "priority": r.priority or "normal",
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in retururi_list
        ],
        "service": [
            {
                "id": str(s.id),
                "nr_ticket": s.nr_ticket,
                "product_name": s.product_name,
                "status": s.status,
                "priority": s.priority or "normal",
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in service_list
        ],
    }