from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base


class FilterOption(Base):
    __tablename__ = "filter_options"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    filter_key = Column(String(50), nullable=False)
    filter_label = Column(String(80), nullable=False)
    filter_values = Column(ARRAY(String), nullable=False, default=[])
    sort_order = Column(Integer, default=0)
