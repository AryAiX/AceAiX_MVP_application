-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies
CREATE POLICY "stories_storage_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'stories');

CREATE POLICY "stories_storage_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "stories_storage_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
