ALTER TABLE public.saved_reports
  ADD COLUMN IF NOT EXISTS share_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_shared_report(_share_id uuid)
RETURNS TABLE (
  id uuid,
  url text,
  site_name text,
  overall_score integer,
  report_data jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.url, r.site_name, r.overall_score, r.report_data, r.created_at
  FROM public.saved_reports r
  WHERE r.share_id = _share_id
    AND r.share_enabled = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_report(uuid) TO anon, authenticated;