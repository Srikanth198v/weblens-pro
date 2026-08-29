CREATE TABLE public.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN (
    'analysis_started','analysis_completed','analysis_failed',
    'ask_opened','ask_answered','report_saved','report_shared','signup_completed'
  )),
  anon_id text CHECK (anon_id IS NULL OR char_length(anon_id) <= 64),
  path text CHECK (path IS NULL OR char_length(path) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_events_event_created_idx ON public.product_events (event, created_at DESC);

GRANT INSERT ON public.product_events TO anon;
GRANT INSERT ON public.product_events TO authenticated;
GRANT ALL ON public.product_events TO service_role;

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may record a product event"
  ON public.product_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);