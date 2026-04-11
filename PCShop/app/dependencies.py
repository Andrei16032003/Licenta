from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM

bearer_scheme = HTTPBearer()

# Roluri cu acces la panoul de administrare
STAFF_ROLES = {"admin", "manager", "achizitii", "marketing", "suport"}

# Extrage token-ul JWT din header Authorization si returneaza utilizatorul activ din DB
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalid")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalid sau expirat")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilizator inexistent sau inactiv")
    return user

# Verifica ca utilizatorul curent are rolul de admin; arunca 403 Forbidden altfel
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acces permis doar administratorilor")
    return current_user

# Fabrica de dependente: accepta o lista de roluri permise
def require_role(*roles: str):
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Acces refuzat pentru rolul tau")
        return current_user
    return _check

# Orice angajat (admin sau rol specializat) poate accesa
def require_staff(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acces permis doar personalului")
    return current_user
