-- stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo', -- 'photo' | 'video'
  caption text,
  overlays jsonb DEFAULT '[]',
  audience text NOT NULL DEFAULT 'connections', -- 'connections' | 'followers' | 'public'
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS stories_author_idx ON stories(author_id);
CREATE INDEX IF NOT EXISTS stories_expires_idx ON stories(expires_at);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Author can see their own stories regardless of expiry
CREATE POLICY "select_own_stories" ON stories FOR SELECT
  TO authenticated USING (auth.uid() = author_id);

-- Anyone authenticated can see non-expired stories for feed
-- (audience filtering handled in application layer)
CREATE POLICY "select_others_stories" ON stories FOR SELECT
  TO authenticated USING (auth.uid() != author_id AND expires_at > now());

CREATE POLICY "insert_own_stories" ON stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "update_own_stories" ON stories FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "delete_own_stories" ON stories FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Service role for cleanup
CREATE POLICY "service_role_all_stories" ON stories FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- story_views table
CREATE TABLE IF NOT EXISTS story_views (
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS story_views_story_idx ON story_views(story_id);
CREATE INDEX IF NOT EXISTS story_views_viewer_idx ON story_views(viewer_id);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_story_views" ON story_views FOR SELECT
  TO authenticated USING (
    viewer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_id AND s.author_id = auth.uid())
  );

CREATE POLICY "insert_story_views" ON story_views FOR INSERT
  TO authenticated WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "delete_story_views" ON story_views FOR DELETE
  TO authenticated USING (viewer_id = auth.uid());
