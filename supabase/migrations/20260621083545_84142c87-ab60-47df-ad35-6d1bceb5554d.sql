
-- Competitions table
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Competition',
  creator_session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read competitions" ON public.competitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create competitions" ON public.competitions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update competitions" ON public.competitions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete competitions" ON public.competitions FOR DELETE TO anon, authenticated USING (true);

-- Competition entries
CREATE TABLE public.competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT 'Trader',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, session_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_entries TO anon, authenticated;
GRANT ALL ON public.competition_entries TO service_role;

ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read competition entries" ON public.competition_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert competition entries" ON public.competition_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update competition entries" ON public.competition_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete competition entries" ON public.competition_entries FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_competition_entries_competition ON public.competition_entries(competition_id);
CREATE INDEX idx_competition_entries_session ON public.competition_entries(session_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_entries;
