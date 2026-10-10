CREATE TABLE public.campaign_draw_media (
 campaign_id uuid PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
 youtube_id text,
 video_path text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT single_draw_video CHECK ((youtube_id IS NULL) OR (video_path IS NULL)),
 CONSTRAINT valid_youtube_id CHECK (youtube_id IS NULL OR youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
 CONSTRAINT valid_draw_video_path CHECK (video_path IS NULL OR video_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp4|webm)$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_draw_media TO authenticated;
GRANT ALL ON public.campaign_draw_media TO service_role;
ALTER TABLE public.campaign_draw_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage draw media" ON public.campaign_draw_media FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins upload draw videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'draw-videos' AND public.is_admin());
CREATE POLICY "Admins read draw videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'draw-videos' AND public.is_admin());
CREATE POLICY "Admins delete draw videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'draw-videos' AND public.is_admin());