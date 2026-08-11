CREATE TABLE public.game_rooms (
  id text PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  sender text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.game_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rooms TO authenticated;
GRANT ALL ON public.game_rooms TO service_role;

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create game rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game rooms" ON public.game_rooms FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

INSERT INTO public.game_rooms (id, state) VALUES ('main', '{}'::jsonb);