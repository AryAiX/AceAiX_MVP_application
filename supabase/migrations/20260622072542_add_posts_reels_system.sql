-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'post', -- 'post' | 'reel'
  caption text,
  media jsonb NOT NULL DEFAULT '[]', -- [{url, type:'photo'|'video', width, height, signed_url}]
  tags jsonb NOT NULL DEFAULT '[]',  -- [{type:'sport'|'attribute'|'location'|'open_to_trials', value}]
  audience text NOT NULL DEFAULT 'followers', -- 'public' | 'followers' | 'connections'
  is_featured boolean NOT NULL DEFAULT false,
  view_count int NOT NULL DEFAULT 0,
  like_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  save_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts(type);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_own" ON posts FOR SELECT
  TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts_select_others" ON posts FOR SELECT
  TO authenticated USING (auth.uid() != author_id AND created_at IS NOT NULL);
CREATE POLICY "posts_insert" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS post_likes_user_idx ON post_likes(user_id);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_likes_select" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- post_saves
CREATE TABLE IF NOT EXISTS post_saves (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_saves_select" ON post_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "post_saves_insert" ON post_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_saves_delete" ON post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- post_views (reel view tracking)
CREATE TABLE IF NOT EXISTS post_views (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS post_views_post_idx ON post_views(post_id);
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_views_select" ON post_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_views_insert" ON post_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

-- post_comments
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  like_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON post_comments(parent_id);
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON post_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update" ON post_comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete" ON post_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- comment_likes
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trigger to maintain like_count on posts
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_post_like_count ON post_likes;
CREATE TRIGGER trg_post_like_count AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Trigger to maintain comment_count on posts
CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_post_comment_count ON post_comments;
CREATE TRIGGER trg_post_comment_count AFTER INSERT OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Trigger to maintain save_count on posts
CREATE OR REPLACE FUNCTION update_post_save_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_post_save_count ON post_saves;
CREATE TRIGGER trg_post_save_count AFTER INSERT OR DELETE ON post_saves FOR EACH ROW EXECUTE FUNCTION update_post_save_count();
