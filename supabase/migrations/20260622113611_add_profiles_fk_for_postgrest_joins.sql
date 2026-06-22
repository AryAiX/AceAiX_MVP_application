
-- Add FK relationships to profiles so PostgREST can resolve !inner joins
-- The existing FKs reference auth.users; we add parallel FKs to profiles

ALTER TABLE stories
  ADD CONSTRAINT stories_author_profile_fkey
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_profile_fkey
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments
  ADD CONSTRAINT post_comments_author_profile_fkey
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes
  ADD CONSTRAINT post_likes_user_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE post_saves
  ADD CONSTRAINT post_saves_user_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
