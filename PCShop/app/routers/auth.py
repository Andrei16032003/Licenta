from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from uuid import UUID
from jose import JWTError, jwt
import bcrypt
import secrets
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.database import get_db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.models.email_verification import EmailVerificationCode
from app.models.order import Order
from app.models.retur import Retur
from app.models.service import ServiceRequest
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
from app.dependencies import require_role
_require_clients = require_role("admin", "suport", "marketing", "manager")

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

# Inregistreaza un cont nou si trimite cod de verificare pe email
@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    name     = req.name.strip()
    email    = req.email.strip().lower()
    password = req.password

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Numele trebuie să aibă minim 2 caractere")
    if len(name) > 100:
        raise HTTPException(status_code=400, detail="Numele este prea lung")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Adresa de email nu este validă")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Parola trebuie să aibă minim 8 caractere")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Parola trebuie să conțină cel puțin o literă mare")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Parola trebuie să conțină cel puțin o cifră")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="EMAIL_ALREADY_REGISTERED")
        # Cont neverificat — retrimite cod nou
        db.query(EmailVerificationCode).filter(
            EmailVerificationCode.user_id == existing.id,
            EmailVerificationCode.used == False,
        ).delete()
        code    = str(secrets.randbelow(900000) + 100000)
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.add(EmailVerificationCode(user_id=existing.id, code=code, expires_at=expires))
        db.commit()
        try:
            _send_verify_email(existing.email, existing.name, code)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Eroare la trimiterea emailului: {str(e)}")
        return {"message": "Cont creat. Verifică emailul pentru codul de activare.", "email": email}

    user = User(name=name, email=email, password_hash=hash_password(password), is_verified=False)
    db.add(user)
    db.commit()
    db.refresh(user)

    code    = str(secrets.randbelow(900000) + 100000)
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(EmailVerificationCode(user_id=user.id, code=code, expires_at=expires))
    db.commit()

    try:
        _send_verify_email(user.email, user.name, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la trimiterea emailului: {str(e)}")

    return {"message": "Cont creat. Verifică emailul pentru codul de activare.", "email": email}

# Autentifica userul si returneaza un token JWT
@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email sau parola incorecta")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Contul nu este verificat. Verifică emailul pentru codul de activare.")
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

# ── Verificare email ────────────────────────────────────────

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

# Verifica codul primit pe email si activeaza contul
@router.post("/verify-email", response_model=TokenResponse)
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email invalid.")

    now = datetime.now(timezone.utc)
    record = db.query(EmailVerificationCode).filter(
        EmailVerificationCode.user_id == user.id,
        EmailVerificationCode.code == req.code.strip(),
        EmailVerificationCode.used == False,
        EmailVerificationCode.expires_at > now,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat.")

    user.is_verified = True
    record.used = True
    db.commit()

    token = create_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}

# Retrimite codul de verificare pentru un cont neverificat
@router.post("/resend-verification")
def resend_verification(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or user.is_verified:
        return {"message": "Dacă emailul există și contul nu e verificat, vei primi un cod nou."}

    db.query(EmailVerificationCode).filter(
        EmailVerificationCode.user_id == user.id,
        EmailVerificationCode.used == False,
    ).delete()

    code    = str(secrets.randbelow(900000) + 100000)
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(EmailVerificationCode(user_id=user.id, code=code, expires_at=expires))
    db.commit()

    try:
        _send_verify_email(user.email, user.name, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la trimiterea emailului: {str(e)}")

    return {"message": "Cod retrimis pe email."}

# ── Scheme reset parola ──────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

def _send_verify_email(to_email: str, name: str, code: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;border-radius:16px;padding:40px;color:#e2e8f0">
      <h2 style="color:#0ef6ff;margin-top:0">Verificare cont PCShop</h2>
      <p>Salut <strong>{name}</strong>,</p>
      <p>Folosește codul de mai jos pentru a-ți activa contul:</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#0ef6ff;font-family:monospace">{code}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px">Codul este valabil <strong style="color:#e2e8f0">15 minute</strong>. Dacă nu ai creat acest cont, ignoră emailul.</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0">
      <p style="color:#475569;font-size:12px;margin:0">PCShop — magazin componente PC</p>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Cod verificare cont PCShop: {code}"
    msg["From"]    = MAIL_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())

def _send_reset_email(to_email: str, name: str, code: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;border-radius:16px;padding:40px;color:#e2e8f0">
      <h2 style="color:#0ef6ff;margin-top:0">Resetare parolă PCShop</h2>
      <p>Salut <strong>{name}</strong>,</p>
      <p>Ai solicitat resetarea parolei. Folosește codul de mai jos:</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#0ef6ff;font-family:monospace">{code}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px">Codul este valabil <strong style="color:#e2e8f0">15 minute</strong>. Dacă nu ai solicitat resetarea, ignoră acest email.</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0">
      <p style="color:#475569;font-size:12px;margin:0">PCShop — magazin componente PC</p>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Cod resetare parolă: {code}"
    msg["From"]    = MAIL_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())

# Genereaza un cod de 6 cifre si il trimite pe email
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        return {"message": "Dacă emailul există în sistem, vei primi codul de resetare."}

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).delete()

    code    = str(secrets.randbelow(900000) + 100000)
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(PasswordResetToken(user_id=user.id, token=code, expires_at=expires))
    db.commit()

    try:
        _send_reset_email(user.email, user.name, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la trimiterea emailului: {str(e)}")

    return {"message": "Codul de resetare a fost trimis pe email."}

# Reseteaza parola folosind codul de 6 cifre
@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email invalid.")

    now = datetime.now(timezone.utc)
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.token == req.code.strip(),
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat.")

    password = req.new_password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Parola trebuie să aibă minim 8 caractere.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Parola trebuie să conțină cel puțin o literă mare.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Parola trebuie să conțină cel puțin o cifră.")

    user.password_hash = hash_password(password)
    record.used = True
    db.commit()

    return {"message": "Parola a fost resetată cu succes."}