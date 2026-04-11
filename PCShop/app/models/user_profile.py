from sqlalchemy import Column, String, Boolean, DateTime, Integer, SmallInteger, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class UserAddress(Base):
    __tablename__ = "user_addresses"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    label       = Column(String(50), default="Acasa")
    full_name   = Column(String(100), nullable=False)
    phone       = Column(String(20), nullable=True)
    country     = Column(String(60), default="Romania")
    county      = Column(String(80), nullable=False)
    city        = Column(String(80), nullable=False)
    street      = Column(Text, nullable=False)
    postal_code = Column(String(20), nullable=True)
    is_default  = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class UserPaymentMethod(Base):
    __tablename__ = "user_payment_methods"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider       = Column(String(30), default="stripe")
    token          = Column(String(255), nullable=False)
    card_last4     = Column(String(4), nullable=True)
    card_brand     = Column(String(20), nullable=True)
    card_exp_month = Column(SmallInteger, nullable=True)
    card_exp_year  = Column(SmallInteger, nullable=True)
    is_default     = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

class Wishlist(Base):
    __tablename__ = "wishlist"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    added_at   = Column(DateTime(timezone=True), server_default=func.now())

class Review(Base):
    __tablename__ = "reviews"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id       = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    order_id         = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    rating           = Column(SmallInteger, nullable=False)
    title            = Column(String(150), nullable=True)
    comment          = Column(Text, nullable=True)
    is_anonymous     = Column(Boolean, default=False)
    author_name      = Column(String(100), nullable=True)
    is_verified      = Column(Boolean, default=False)
    is_approved      = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    helpful_count    = Column(Integer, default=0)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type       = Column(String(50), nullable=False)
    title      = Column(String(150), nullable=False)
    message    = Column(Text, nullable=True)
    link       = Column(Text, nullable=True)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())