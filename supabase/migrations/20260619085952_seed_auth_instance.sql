-- GoTrue requires exactly one row in auth.instances to process any auth operation.
-- Without it, every login/signup returns "database error querying schema".
INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '{}',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
