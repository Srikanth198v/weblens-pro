CREATE TABLE public.ask_usage (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ask_usage TO authenticated;
GRANT ALL ON public.ask_usage TO service_role;

ALTER TABLE public.ask_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ask usage"
ON public.ask_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_ask_usage_updated_at
BEFORE UPDATE ON public.ask_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_ask_usage()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT used FROM public.ask_usage WHERE user_id = auth.uid()), 0)
  WHERE auth.uid() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.consume_ask_question(_limit INTEGER)
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

  INSERT INTO public.ask_usage (user_id, used)
  VALUES (_uid, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET used = public.ask_usage.used + 1
    WHERE public.ask_usage.used < _limit
  RETURNING used INTO _used;

  IF _used IS NULL THEN
    RETURN -1;
  END IF;

  RETURN _used;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ask_usage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ask_question(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ask_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ask_question(INTEGER) TO authenticated;