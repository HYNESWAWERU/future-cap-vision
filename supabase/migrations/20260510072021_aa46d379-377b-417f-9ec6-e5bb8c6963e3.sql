-- Accountability partners (max 2 per session)
CREATE TABLE public.accountability_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Partner',
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_token UUID NOT NULL DEFAULT gen_random_uuid(),
  notify_profit BOOLEAN NOT NULL DEFAULT true,
  notify_loss BOOLEAN NOT NULL DEFAULT true,
  notify_weekly BOOLEAN NOT NULL DEFAULT false,
  notify_milestones BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_accountability_partners_session ON public.accountability_partners(session_id);
CREATE UNIQUE INDEX idx_accountability_partners_session_email ON public.accountability_partners(session_id, lower(email));

ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read partners" ON public.accountability_partners FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert partners" ON public.accountability_partners FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can update partners" ON public.accountability_partners FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete partners" ON public.accountability_partners FOR DELETE TO anon USING (true);

-- Enforce max 2 partners per session
CREATE OR REPLACE FUNCTION public.enforce_partner_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.accountability_partners WHERE session_id = NEW.session_id) >= 2 THEN
    RAISE EXCEPTION 'Maximum 2 accountability partners per session';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_partner_limit
BEFORE INSERT ON public.accountability_partners
FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_limit();

-- Alert log to prevent duplicate sends per day
CREATE TABLE public.partner_alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'profit_target' | 'loss_limit'
  alert_date DATE NOT NULL DEFAULT current_date,
  pct NUMERIC,
  pnl NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, alert_type, alert_date)
);

CREATE INDEX idx_partner_alerts_session ON public.partner_alerts_log(session_id, alert_date);

ALTER TABLE public.partner_alerts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read alerts log" ON public.partner_alerts_log FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert alerts log" ON public.partner_alerts_log FOR INSERT TO anon WITH CHECK (true);