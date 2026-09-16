-- Seed Lisbon-area surf locations for instructor profile selection.
-- Idempotent: unique index on location.name makes re-runs no-ops.
INSERT INTO "location" ("name", "region") VALUES
  ('Costa da Caparica', 'Setúbal'),
  ('Carcavelos', 'Lisboa'),
  ('Guincho', 'Lisboa'),
  ('Ericeira', 'Lisboa'),
  ('Costa da Caparica Norte', 'Setúbal'),
  ('Sesimbra', 'Setúbal'),
  ('Peniche', 'Leiria'),
  ('Nazaré', 'Leiria')
ON CONFLICT ("name") DO NOTHING;
