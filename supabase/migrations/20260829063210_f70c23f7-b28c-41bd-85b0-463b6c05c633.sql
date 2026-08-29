CREATE OR REPLACE FUNCTION public.refund_ask_question()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _used INTEGER;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.ask_usage
    SET used = GREATEST(0, used - 1)
    WHERE user_id = _uid
  RETURNING used INTO _used;

  RETURN COALESCE(_used, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_ask_question() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_ask_question() TO authenticated;