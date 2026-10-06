CREATE TABLE public.chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 display_name text NOT NULL DEFAULT '',
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
 created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads chat" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members post own chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.suspended));
CREATE POLICY "Owner or admin deletes chat" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX chat_messages_created_idx ON public.chat_messages (created_at DESC);

CREATE OR REPLACE FUNCTION public.chat_set_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 NEW.user_id := auth.uid();
 NEW.created_at := now();
 NEW.display_name := left(coalesce((SELECT nullif(display_name,'') FROM public.profiles WHERE user_id = auth.uid()), 'عضو'), 40);
 IF EXISTS (SELECT 1 FROM public.chat_messages WHERE user_id = auth.uid() AND created_at > now() - interval '3 seconds') THEN RAISE EXCEPTION 'slow down'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER chat_set_name BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_set_name();

CREATE TABLE public.chat_reactions (emoji text PRIMARY KEY, count bigint NOT NULL DEFAULT 0);
GRANT SELECT ON public.chat_reactions TO anon, authenticated;
GRANT ALL ON public.chat_reactions TO service_role;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reactions" ON public.chat_reactions FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.add_chat_reaction(p_emoji text) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v bigint;
BEGIN
 IF p_emoji NOT IN ('👏','🔥','💙','✨') THEN RAISE EXCEPTION 'invalid'; END IF;
 INSERT INTO public.chat_reactions(emoji,count) VALUES (p_emoji,1) ON CONFLICT (emoji) DO UPDATE SET count = chat_reactions.count + 1 RETURNING count INTO v;
 RETURN v;
END; $$;
GRANT EXECUTE ON FUNCTION public.add_chat_reaction(text) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;