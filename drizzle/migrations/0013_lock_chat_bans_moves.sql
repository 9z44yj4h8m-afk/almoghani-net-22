DROP POLICY IF EXISTS "Anyone reads chat bans" ON public.chat_bans;
DROP POLICY IF EXISTS "Anyone reads room moves" ON public.chat_room_moves;
CREATE OR REPLACE FUNCTION public.get_chat_ban(_name text)
RETURNS TABLE(name text, kind text, until timestamptz, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.name::text, b.kind::text, b.until::timestamptz, b.reason::text FROM public.chat_bans b
  WHERE lower(trim(b.name)) = lower(trim(_name)) LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.get_room_move(_name text)
RETURNS TABLE(room_id text, moved_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.room_id::text, m.moved_at::timestamptz FROM public.chat_room_moves m WHERE m.name = trim(_name) LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_chat_ban(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_move(text) TO anon, authenticated;