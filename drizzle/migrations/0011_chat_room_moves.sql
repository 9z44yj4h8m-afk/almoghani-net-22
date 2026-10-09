CREATE TABLE public.chat_room_moves (
  name text PRIMARY KEY,
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  moved_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_room_moves TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_room_moves TO authenticated;
GRANT ALL ON public.chat_room_moves TO service_role;
ALTER TABLE public.chat_room_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads room moves" ON public.chat_room_moves FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage room moves" ON public.chat_room_moves FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));