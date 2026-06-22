-- Sportify Academy integration tables

-- Extend profiles with Sportify linking fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sportify_linked      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sportify_athlete_id  text,
  ADD COLUMN IF NOT EXISTS sportify_dob         date,
  ADD COLUMN IF NOT EXISTS sportify_is_minor    boolean NOT NULL DEFAULT false;

-- Consent audit trail
CREATE TABLE IF NOT EXISTS sportify_consents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consenting_party text NOT NULL DEFAULT 'athlete', -- 'athlete' | 'guardian'
  scope            text NOT NULL DEFAULT 'test_results,talent_assessment',
  granted_at       timestamptz,
  revoked_at       timestamptz,
  guardian_name    text,
  guardian_email   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id)
);

ALTER TABLE sportify_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_consent" ON sportify_consents FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_consent" ON sportify_consents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_consent" ON sportify_consents FOR UPDATE
  TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_consent" ON sportify_consents FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Test results & talent assessments
CREATE TABLE IF NOT EXISTS sportify_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_type         text NOT NULL DEFAULT 'physical', -- 'physical' | 'talent'
  method            text NOT NULL DEFAULT 'camera',   -- 'camera' | 'in_person'
  metrics           jsonb NOT NULL DEFAULT '{}',
  recommended_sports jsonb DEFAULT '[]',
  tested_at         timestamptz NOT NULL,
  academy_location  text,
  verification_ref  text,
  source            text NOT NULL DEFAULT 'Sportify Academy',
  last_synced_at    timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sportify_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_results" ON sportify_results FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_results" ON sportify_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_results" ON sportify_results FOR UPDATE
  TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_results" ON sportify_results FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Academy appointments
CREATE TABLE IF NOT EXISTS appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_location text NOT NULL,
  test_type        text NOT NULL,
  preferred_times  jsonb NOT NULL DEFAULT '[]',
  scheduled_at     timestamptz,
  status           text NOT NULL DEFAULT 'requested', -- 'requested'|'confirmed'|'completed'|'cancelled'
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_appointments" ON appointments FOR UPDATE
  TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_appointments" ON appointments FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Auto-update updated_at on appointments
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_appointment_updated
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_appointment_timestamp();

-- Seed demo results for testing (no real athlete_id — uses a placeholder that won't match RLS for other users)
-- Real data is imported via sync-sportify edge function or test flow
