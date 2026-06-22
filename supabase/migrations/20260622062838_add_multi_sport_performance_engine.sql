-- ── Sports config ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports_config (
  sport        TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  archetype    TEXT NOT NULL CHECK (archetype IN ('team_match','rated_ladder','timed_measured','judged_scored','handicap_niche','combat')),
  metric_definitions JSONB NOT NULL DEFAULT '[]'
);

-- Seed 5 sports covering all required archetypes
INSERT INTO sports_config (sport, display_name, archetype, metric_definitions) VALUES
('volleyball','Volleyball','team_match','[
  {"key":"kills","label":"Kills","unit":"","type":"number","higherIsBetter":true},
  {"key":"blocks","label":"Blocks","unit":"","type":"number","higherIsBetter":true},
  {"key":"digs","label":"Digs","unit":"","type":"number","higherIsBetter":true},
  {"key":"aces","label":"Aces","unit":"","type":"number","higherIsBetter":true},
  {"key":"assists","label":"Assists","unit":"","type":"number","higherIsBetter":true},
  {"key":"points","label":"Points","unit":"","type":"number","higherIsBetter":true},
  {"key":"sets_played","label":"Sets Played","unit":"","type":"number","higherIsBetter":false},
  {"key":"attack_pct","label":"Attack %","unit":"%","type":"percent","higherIsBetter":true}
]'::jsonb),
('basketball','Basketball','team_match','[
  {"key":"points","label":"Points","unit":"ppg","type":"number","higherIsBetter":true},
  {"key":"rebounds","label":"Rebounds","unit":"rpg","type":"number","higherIsBetter":true},
  {"key":"assists","label":"Assists","unit":"apg","type":"number","higherIsBetter":true},
  {"key":"steals","label":"Steals","unit":"spg","type":"number","higherIsBetter":true},
  {"key":"blocks","label":"Blocks","unit":"bpg","type":"number","higherIsBetter":true},
  {"key":"fg_pct","label":"FG%","unit":"%","type":"percent","higherIsBetter":true},
  {"key":"three_pct","label":"3PT%","unit":"%","type":"percent","higherIsBetter":true},
  {"key":"minutes","label":"Minutes","unit":"mpg","type":"number","higherIsBetter":false}
]'::jsonb),
('swimming','Swimming','timed_measured','[
  {"key":"50m_free","label":"50m Freestyle","unit":"s","type":"time","higherIsBetter":false},
  {"key":"100m_free","label":"100m Freestyle","unit":"s","type":"time","higherIsBetter":false},
  {"key":"200m_free","label":"200m Freestyle","unit":"s","type":"time","higherIsBetter":false},
  {"key":"100m_fly","label":"100m Butterfly","unit":"s","type":"time","higherIsBetter":false},
  {"key":"100m_back","label":"100m Backstroke","unit":"s","type":"time","higherIsBetter":false},
  {"key":"100m_breast","label":"100m Breaststroke","unit":"s","type":"time","higherIsBetter":false},
  {"key":"200m_im","label":"200m IM","unit":"s","type":"time","higherIsBetter":false}
]'::jsonb),
('polo','Polo','handicap_niche','[
  {"key":"handicap","label":"Handicap","unit":"goals","type":"number","higherIsBetter":true},
  {"key":"tournaments_played","label":"Tournaments","unit":"","type":"number","higherIsBetter":false},
  {"key":"goals_scored","label":"Goals Scored","unit":"","type":"number","higherIsBetter":true},
  {"key":"season","label":"Season","unit":"","type":"text","higherIsBetter":false}
]'::jsonb),
('chess','Chess','rated_ladder','[
  {"key":"rapid_rating","label":"Rapid","unit":"","type":"rating","higherIsBetter":true},
  {"key":"blitz_rating","label":"Blitz","unit":"","type":"rating","higherIsBetter":true},
  {"key":"bullet_rating","label":"Bullet","unit":"","type":"rating","higherIsBetter":true},
  {"key":"classical_rating","label":"Classical","unit":"","type":"rating","higherIsBetter":true},
  {"key":"fide_rating","label":"FIDE","unit":"","type":"rating","higherIsBetter":true},
  {"key":"wins","label":"Wins","unit":"","type":"number","higherIsBetter":true},
  {"key":"losses","label":"Losses","unit":"","type":"number","higherIsBetter":false},
  {"key":"draws","label":"Draws","unit":"","type":"number","higherIsBetter":false},
  {"key":"title","label":"Title","unit":"","type":"text","higherIsBetter":false},
  {"key":"peak_rating","label":"Peak Rating","unit":"","type":"rating","higherIsBetter":true}
]'::jsonb)
ON CONFLICT (sport) DO NOTHING;

-- ── Performance records ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport           TEXT NOT NULL,
  season_or_period TEXT,
  stats           JSONB NOT NULL DEFAULT '{}',
  source          TEXT NOT NULL DEFAULT 'self_reported',
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (athlete_id, sport, season_or_period)
);

ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_perf" ON performance_records FOR SELECT TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "insert_own_perf" ON performance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "update_own_perf" ON performance_records FOR UPDATE TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "delete_own_perf" ON performance_records FOR DELETE TO authenticated USING (auth.uid() = athlete_id);

-- ── Extend profiles with external identifiers ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS chesscom_username TEXT,
  ADD COLUMN IF NOT EXISTS lichess_username TEXT,
  ADD COLUMN IF NOT EXISTS external_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_player_id TEXT;
