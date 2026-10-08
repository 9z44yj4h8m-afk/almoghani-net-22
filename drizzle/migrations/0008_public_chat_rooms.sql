CREATE TABLE public.chat_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 40),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_rooms TO anon, authenticated;
GRANT DELETE ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads public chat rooms" ON public.chat_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins remove rooms" ON public.chat_rooms FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.chat_messages ADD COLUMN room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
CREATE INDEX chat_messages_room_created_idx ON public.chat_messages(room_id, created_at DESC);
CREATE FUNCTION public.create_chat_room(p_name text) RETURNS public.chat_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.chat_rooms; clean_name text := btrim(p_name);
BEGIN
 IF clean_name IS NULL OR char_length(clean_name) NOT BETWEEN 2 AND 40 THEN RAISE EXCEPTION 'invalid_room_name'; END IF;
 IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND suspended) THEN RAISE EXCEPTION 'not_allowed'; END IF;
 PERFORM pg_advisory_xact_lock(7319264);
 IF (SELECT count(*) FROM public.chat_rooms) >= 100 THEN RAISE EXCEPTION 'room_limit'; END IF;
 IF EXISTS (SELECT 1 FROM public.chat_rooms WHERE created_at > now() - interval '5 seconds') THEN RAISE EXCEPTION 'room_slow'; END IF;
 INSERT INTO public.chat_rooms(name,created_by) VALUES(clean_name,auth.uid()) RETURNING * INTO result;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_chat_room(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_chat_room(text) TO anon, authenticated;
COMMENT ON TABLE public.chat_rooms IS 'Public nickname chat rooms; creation is bounded and serialized through create_chat_room.';