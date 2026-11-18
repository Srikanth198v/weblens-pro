DROP POLICY IF EXISTS "Anyone may record a product event" ON public.product_events;
CREATE POLICY "Anyone may record an allowed product event"
ON public.product_events FOR INSERT TO anon, authenticated
WITH CHECK (
  event IN ('analysis_started','analysis_completed','analysis_failed','ask_opened','ask_answered','report_saved','report_shared','signup_completed')
  AND (anon_id IS NULL OR anon_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  AND (path IS NULL OR (char_length(path) <= 200 AND path LIKE '/%'))
);