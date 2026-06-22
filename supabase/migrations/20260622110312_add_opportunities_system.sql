-- Opportunities marketplace

CREATE TABLE IF NOT EXISTS opportunities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  club          text NOT NULL,
  club_abbr     text,
  sport         text NOT NULL DEFAULT 'Football',
  position      text NOT NULL,
  type          text NOT NULL DEFAULT 'Trial',
  location      text NOT NULL,
  level         text,
  salary_min    numeric,
  salary_max    numeric,
  currency      text DEFAULT 'USD',
  description   text,
  requirements  jsonb DEFAULT '{}',
  deadline      date,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_active_opportunities" ON opportunities FOR SELECT
  TO authenticated USING (status = 'active');

CREATE POLICY "insert_own_opportunities" ON opportunities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "update_own_opportunities" ON opportunities FOR UPDATE
  TO authenticated USING (auth.uid() = posted_by) WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "delete_own_opportunities" ON opportunities FOR DELETE
  TO authenticated USING (auth.uid() = posted_by);

-- AI match scores (populated by backend; default score for display)
CREATE TABLE IF NOT EXISTS opportunity_matches (
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  athlete_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score    integer NOT NULL DEFAULT 70,
  reasons        jsonb DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, athlete_id)
);

ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_matches" ON opportunity_matches FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);

CREATE POLICY "insert_own_matches" ON opportunity_matches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "update_own_matches" ON opportunity_matches FOR UPDATE
  TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "delete_own_matches" ON opportunity_matches FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  athlete_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'applied',
  message        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, athlete_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);

CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Saves / bookmarks
CREATE TABLE IF NOT EXISTS opportunity_saves (
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  athlete_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, athlete_id)
);

ALTER TABLE opportunity_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_saves" ON opportunity_saves FOR SELECT
  TO authenticated USING (auth.uid() = athlete_id);

CREATE POLICY "insert_own_saves" ON opportunity_saves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "delete_own_saves" ON opportunity_saves FOR DELETE
  TO authenticated USING (auth.uid() = athlete_id);

-- Auto-update updated_at on applications
CREATE OR REPLACE FUNCTION update_application_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_updated
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_application_timestamp();

-- Seed sample opportunities
INSERT INTO opportunities (club, club_abbr, sport, position, type, location, level, salary_min, salary_max, currency, description, requirements, deadline, status)
VALUES
  ('Al Nassr FC',     'AN',  'Football',    'Central Midfielder',     'Contract', 'Riyadh, Saudi Arabia', 'Saudi Pro League',       1200000, 2000000,  'USD', 'Al Nassr FC are looking for a dynamic central midfielder to strengthen their midfield engine. The ideal candidate has excellent vision, strong passing range, and proven experience at professional level.',
   '{"age_min":20,"age_max":32,"positions":["CM","CDM","CAM"],"attributes":["Passing","Vision","Stamina"],"nationality":"Open"}', '2026-08-01', 'active'),
  ('Al Hilal SFC',    'AH',  'Football',    'Attacking Midfielder',   'Contract', 'Riyadh, Saudi Arabia', 'Saudi Pro League',       800000,  1500000,  'USD', 'Al Hilal are seeking a creative attacking midfielder capable of unlocking defences with key passes and goals.',
   '{"age_min":18,"age_max":30,"positions":["CAM","AM"],"attributes":["Creativity","Dribbling","Shooting"],"nationality":"Open"}', '2026-07-20', 'active'),
  ('Manchester City FC','MC','Football',    'Winger',                 'Contract', 'Manchester, England',  'Premier League',         2000000, 3500000,  'GBP', 'Manchester City are looking for a pacey, technically gifted winger who can operate on both flanks and contribute with goals and assists.',
   '{"age_min":18,"age_max":28,"positions":["LW","RW","LM","RM"],"attributes":["Pace","Dribbling","Crossing"],"nationality":"Open"}', '2026-07-15', 'active'),
  ('Barcelona Academy','BAR','Football',   'Central Midfielder',      'Academy',  'Barcelona, Spain',     'La Masia / B Team',      0,       0,        'EUR', 'La Masia is inviting applications from talented midfielders aged 16–21 for its B-team squad. This is an elite development pathway.',
   '{"age_min":16,"age_max":21,"positions":["CM","CDM"],"attributes":["Technical","Intelligence"],"nationality":"Open"}', '2026-09-01', 'active'),
  ('PSG Academy',     'PSG', 'Football',    'Striker',                'Trial',    'Paris, France',        'Ligue 1 B-Team',         0,       0,        'EUR', 'Paris Saint-Germain invite strikers for a 2-week assessment trial. Top performers may be offered an academy contract.',
   '{"age_min":17,"age_max":23,"positions":["ST","CF"],"attributes":["Finishing","Movement","Strength"],"nationality":"Open"}', '2026-07-30', 'active'),
  ('Juventus FC',     'JUV', 'Football',    'Box-to-Box Midfielder',  'Loan',     'Turin, Italy',         'Serie A',                1500000, 2200000,  'EUR', 'Juventus are looking for a box-to-box midfielder on a season loan. Candidates must have prior top-division experience.',
   '{"age_min":20,"age_max":29,"positions":["CM","B2B"],"attributes":["Work Rate","Tackling","Passing"],"nationality":"Open"}', '2026-07-10', 'active'),
  ('UAE Youth Academy','UAE','Football',   'Goalkeeper',              'Academy',  'Abu Dhabi, UAE',       'UAE 1st Division',       0,       0,        'AED', 'UAE Football Association is accepting applications from young goalkeepers for the national youth academy programme.',
   '{"age_min":14,"age_max":19,"positions":["GK"],"attributes":["Reflexes","Command","Distribution"],"nationality":"Emirati preferred"}', '2026-08-15', 'active'),
  ('Dubai Basketball','DBC','Basketball',  'Point Guard',             'Contract', 'Dubai, UAE',           'UAE Basketball League',  80000,   150000,   'AED', 'Dubai Basketball Club are looking for a composed, court-reading point guard for the upcoming season.',
   '{"age_min":19,"age_max":35,"positions":["PG"],"attributes":["Ball Handling","Vision","Defense"],"nationality":"Open"}', '2026-08-20', 'active'),
  ('Emirates Athletics','EA','Athletics',  'Sprinter (100m/200m)',    'Trial',    'Dubai, UAE',           'National League',        0,       0,        'AED', 'Emirates Athletics Federation invites sprinters to trial for national-level squad selection.',
   '{"age_min":16,"age_max":30,"positions":["Sprinter"],"attributes":["Speed","Explosiveness","Technique"],"nationality":"UAE"}', '2026-07-25', 'active'),
  ('Abu Dhabi Cricket','ADC','Cricket',    'All-Rounder',             'Contract', 'Abu Dhabi, UAE',       'T20 League',             60000,   120000,   'AED', 'Abu Dhabi cricket club seeks a versatile all-rounder for T20 and 50-over formats.',
   '{"age_min":18,"age_max":35,"positions":["All-Rounder"],"attributes":["Batting","Bowling","Fielding"],"nationality":"Open"}', '2026-09-10', 'active')
ON CONFLICT DO NOTHING;
