"""
Rulare: python run_migration.py
Adauga coloanele noi pentru moderare review-uri.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app.database import engine

SQL = """
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_anonymous     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS author_name      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
"""

with engine.connect() as conn:
    conn.execute(__import__('sqlalchemy').text(SQL))
    conn.commit()
    print("Migrare aplicata cu succes!")
