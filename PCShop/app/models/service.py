from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.database import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id         = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id       = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    product_name     = Column(String(200), nullable=False)
    descriere        = Column(Text, nullable=False)
    pickup_address   = Column(JSONB, default={})
    contact_telefon  = Column(String(20), nullable=False)
    contact_email    = Column(String(150), nullable=True)
    status           = Column(String(30), default="in_asteptare")   # in_asteptare | in_service | rezolvat | respins
    priority         = Column(String(20), default="normal")          # normal | ridicat | urgent
    nr_ticket        = Column(String(20), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
