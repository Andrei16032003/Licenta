from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name             = Column(String(150), nullable=False)
    email            = Column(String(255), nullable=False)
    subject          = Column(String(300), nullable=False)
    message          = Column(Text, nullable=False)
    is_resolved      = Column(Boolean, default=False, nullable=False)
    resolved_by_name = Column(String(150), nullable=True)
    resolved_at      = Column(DateTime(timezone=True), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
