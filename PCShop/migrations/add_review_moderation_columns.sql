-- Migrare: adauga coloane moderare review-uri
-- Ruleaza o singura data pe baza de date existenta

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_anonymous     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS author_name      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Seteaza review-urile existente (deja aprobate) ca aprobate in continuare
-- Cele noi vor fi is_approved = FALSE implicit (gestionat din model)
-- Nu schimbam is_approved pentru cele existente ca sa nu rupem datele curente
