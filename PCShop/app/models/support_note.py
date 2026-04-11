from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class SupportNote(Base):
    __tablename__ = "support_notes"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(20), nullable=False)   # order | service | retur
    entity_id   = Column(UUID(as_uuid=True), nullable=False)
    staff_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    staff_name  = Column(String(150), nullable=False)
    note_text   = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
