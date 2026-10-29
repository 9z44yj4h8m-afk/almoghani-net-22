CREATE TABLE public.channel_health (
  url text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  fail_count integer NOT NULL DEFAULT 0,
  alerted boolean NOT NULL DEFAULT false,
  last_status text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.channel_health TO service_role;
ALTER TABLE public.channel_health ENABLE ROW LEVEL SECURITY;