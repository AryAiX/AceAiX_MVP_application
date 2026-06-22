CREATE TABLE athlete_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Other',
  event_date date NOT NULL,
  event_time text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text,
  color text NOT NULL DEFAULT '#2E8BFF',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE athlete_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_athlete_events" ON athlete_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "insert_own_athlete_events" ON athlete_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_athlete_events" ON athlete_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_athlete_events" ON athlete_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
