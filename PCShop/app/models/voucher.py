from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Voucher(Base):
    __tablename__ = "vouchers"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code              = Column(String(50), unique=True, nullable=False)
    type              = Column(String(20), nullable=False)   # percent | fixed | free_shipping
    value             = Column(Numeric(10, 2), nullable=True)  # % sau lei; null pt free_shipping
    description       = Column(String(255), nullable=True)
    min_order_amount  = Column(Numeric(10, 2), nullable=True)  # comanda minima
    category_id       = Column(Integer, ForeignKey("categories.id"), nullable=True)  # null = toate
    user_id           = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)       # null = toti
    usage_limit       = Column(Integer, nullable=True)          # null = nelimitat
    used_count        = Column(Integer, default=0)
    is_active         = Column(Boolean, default=True)
    expires_at        = Column(DateTime(timezone=True), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
