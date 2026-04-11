-- Rulati aceste comenzi in baza de date PostgreSQL
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(20) DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_fee NUMERIC(10,2) DEFAULT 0;
