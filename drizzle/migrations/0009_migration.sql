CREATE TABLE public.chat_bans (
  name text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'mute',
  until timestamptz,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_bans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chat_bans TO authenticated;
GRANT ALL ON public.chat_bans TO service_role;
ALTER TABLE public.chat_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads chat bans" ON public.chat_bans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage chat bans" ON public.chat_bans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.chat_block_banned() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM chat_bans b WHERE lower(trim(b.name)) = lower(trim(NEW.display_name)) AND (b.until IS NULL OR b.until > now())) THEN
    RAISE EXCEPTION 'chat_banned';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_block_banned BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_block_banned();