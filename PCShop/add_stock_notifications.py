"""
Rulare: python add_stock_notifications.py
Creeaza tabela stock_notifications pentru functia "Anunta-ma cand e disponibil".
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app.database import engine
import sqlalchemy as sa

SQL = """
CREATE TABLE IF NOT EXISTS stock_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    email       VARCHAR(200) NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_stock_notif_product ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notif_email   ON stock_notifications(email);
"""

with engine.connect() as conn:
    conn.execute(sa.text(SQL))
    conn.commit()
    print("Tabela stock_notifications creata cu succes!")
