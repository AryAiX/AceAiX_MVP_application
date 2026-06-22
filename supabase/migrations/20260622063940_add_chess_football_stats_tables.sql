-- ── chess_stats ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chess_stats (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Rapid
  rapid_current      INT,
  rapid_peak         INT,
  rapid_wins         INT NOT NULL DEFAULT 0,
  rapid_losses       INT NOT NULL DEFAULT 0,
  rapid_draws        INT NOT NULL DEFAULT 0,
  -- Blitz
  blitz_current      INT,
  blitz_peak         INT,
  blitz_wins         INT NOT NULL DEFAULT 0,
  blitz_losses       INT NOT NULL DEFAULT 0,
  blitz_draws        INT NOT NULL DEFAULT 0,
  -- Bullet
  bullet_current     INT,
  bullet_peak        INT,
  bullet_wins        INT NOT NULL DEFAULT 0,
  bullet_losses      INT NOT NULL DEFAULT 0,
  bullet_draws       INT NOT NULL DEFAULT 0,
  -- Classical
  classical_current  INT,
  classical_peak     INT,
  classical_wins     INT NOT NULL DEFAULT 0,
  classical_losses   INT NOT NULL DEFAULT 0,
  classical_draws    INT NOT NULL DEFAULT 0,
  -- FIDE / title
  fide_rating        INT,
  title              TEXT,
  -- Rich blobs
  rating_history     JSONB NOT NULL DEFAULT '{}',
  recent_games       JSONB NOT NULL DEFAULT '[]',
  -- Meta
  source             TEXT NOT NULL DEFAULT 'self_reported',
  last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (athlete_id)
);
ALTER TABLE chess_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_chess" ON chess_stats FOR SELECT TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_chess" ON chess_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_chess" ON chess_stats FOR UPDATE TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_chess" ON chess_stats FOR DELETE TO authenticated USING (auth.uid() = athlete_id);

-- ── football_stats ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS football_stats (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season             TEXT NOT NULL,
  team               TEXT,
  league             TEXT,
  apps               INT NOT NULL DEFAULT 0,
  goals              INT NOT NULL DEFAULT 0,
  assists            INT NOT NULL DEFAULT 0,
  minutes            INT NOT NULL DEFAULT 0,
  rating             DECIMAL(4,2),
  shots_total        INT NOT NULL DEFAULT 0,
  shots_on           INT NOT NULL DEFAULT 0,
  passes_accuracy    DECIMAL(5,2),
  dribbles_success   INT NOT NULL DEFAULT 0,
  tackles            INT NOT NULL DEFAULT 0,
  yellow_cards       INT NOT NULL DEFAULT 0,
  red_cards          INT NOT NULL DEFAULT 0,
  attributes         JSONB NOT NULL DEFAULT '{}',
  source             TEXT NOT NULL DEFAULT 'self_reported',
  last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (athlete_id, season)
);
ALTER TABLE football_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_football" ON football_stats FOR SELECT TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_football" ON football_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_football" ON football_stats FOR UPDATE TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_football" ON football_stats FOR DELETE TO authenticated USING (auth.uid() = athlete_id);

-- ── Extend profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS football_api_player_id TEXT;
