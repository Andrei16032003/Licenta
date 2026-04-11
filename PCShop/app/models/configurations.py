from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Configuration(Base):
    __tablename__ = "configurations"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name          = Column(String(150), default="Configuratia mea")
    components    = Column(JSONB, default={})
    is_compatible = Column(Boolean, default=False)
    warnings      = Column(JSONB, default=[])
    total_price   = Column(Numeric(10, 2), default=0)
    is_public     = Column(Boolean, default=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())