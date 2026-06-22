-- posts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  false,
  104857600,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "posts_storage_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'posts');

CREATE POLICY "posts_storage_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "posts_storage_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
