from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Retur(Base):
    __tablename__ = "retururi"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id         = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id       = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    product_name     = Column(String(200), nullable=False)
    motiv            = Column(String(100), nullable=False)
    motiv_detalii    = Column(Text, nullable=True)
    stare_produs     = Column(String(30), nullable=False)   # sigilat | functional | nefunctional
    pickup_address   = Column(JSONB, default={})            # adresa ridicare curier
    refund_method    = Column(String(20), nullable=False)   # card | iban
    iban             = Column(String(34), nullable=True)    # doar daca refund_method = iban
    titular_cont     = Column(String(150), nullable=True)
    status           = Column(String(30), default="in_asteptare")
    priority         = Column(String(20), default="normal")          # normal | ridicat | urgent
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
