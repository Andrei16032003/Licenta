from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(80), nullable=False, unique=True)
    slug        = Column(String(80), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    image_url   = Column(Text, nullable=True)
    sort_order  = Column(Integer, default=0)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id     = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name            = Column(String(200), nullable=False)
    slug            = Column(String(220), nullable=False, unique=True)
    brand           = Column(String(80), nullable=True)
    model           = Column(String(100), nullable=True)
    description     = Column(Text, nullable=True)
    price           = Column(Numeric(10, 2), nullable=False)
    old_price       = Column(Numeric(10, 2), nullable=True)
    stock           = Column(Integer, default=0)
    sku             = Column(String(80), unique=True, nullable=True)
    specs           = Column(JSONB, default={})
    warranty_months = Column(Integer, default=24)
    discount_expires_at = Column(Date, nullable=True)
    is_active       = Column(Boolean, default=True)
    is_featured     = Column(Boolean, default=False)
    views_count     = Column(Integer, default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    images   = relationship("ProductImage", back_populates="product")

class ProductImage(Base):
    __tablename__ = "product_images"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    url        = Column(Text, nullable=False)
    alt_text   = Column(String(150), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="images")