
ALTER TABLE public.budget_lines ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.shield_tx ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.shield_tx ADD COLUMN IF NOT EXISTS month_key text;
ALTER TABLE public.debt_adjustments ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.debt_adjustments ADD COLUMN IF NOT EXISTS month_key text;
