-- Launch surf zones for instructor profile selection, by district.
-- Keep in sync with scripts/seed.ts. Idempotent: the unique index on
-- location.name turns re-runs into region corrections.
INSERT INTO "location" ("name", "region") VALUES
  ('Nazaré', 'Leiria'),
  ('Peniche', 'Leiria'),
  ('Ericeira', 'Lisboa'),
  ('Guincho', 'Lisboa'),
  ('Cascais', 'Lisboa'),
  ('Carcavelos', 'Lisboa'),
  ('Costa da Caparica', 'Setúbal'),
  ('Costa da Caparica Norte', 'Setúbal'),
  ('Sesimbra', 'Setúbal')
ON CONFLICT ("name") DO UPDATE SET "region" = EXCLUDED."region";
