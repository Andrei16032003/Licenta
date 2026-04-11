from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id           = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    address_id        = Column(UUID(as_uuid=True), ForeignKey("user_addresses.id"), nullable=True)
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("user_payment_methods.id"), nullable=True)
    coupon_id         = Column(UUID(as_uuid=True), nullable=True)
    subtotal          = Column(Numeric(10, 2), nullable=False)
    discount_amount   = Column(Numeric(10, 2), default=0)
    shipping_cost     = Column(Numeric(10, 2), default=0)
    total_price       = Column(Numeric(10, 2), nullable=False)
    payment_method_type = Column(String(20), default="cod")   # cod | card | transfer
    cod_fee           = Column(Numeric(10, 2), default=0)
    invoice_number    = Column(String(50), nullable=True)
    status            = Column(String(20), default="pending")
    payment_status    = Column(String(20), default="unpaid")
    tracking_number   = Column(String(100), nullable=True)
    notes             = Column(Text, nullable=True)
    shipping_snapshot = Column(JSONB, default={})
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id         = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id       = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity         = Column(Integer, nullable=False)
    unit_price       = Column(Numeric(10, 2), nullable=False)
    product_snapshot = Column(JSONB, default={})

    order = relationship("Order", back_populates="items")

class CartItem(Base):
    __tablename__ = "cart_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, default=1)
    added_at   = Column(DateTime(timezone=True), server_default=func.now())