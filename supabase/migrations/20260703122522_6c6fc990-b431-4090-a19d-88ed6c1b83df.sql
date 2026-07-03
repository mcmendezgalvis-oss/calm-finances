
-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'free',
  premium_until timestamptz,
  currency text NOT NULL DEFAULT 'EUR',
  language text NOT NULL DEFAULT 'es',
  migrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========== MONTHS ===========
CREATE TABLE public.months (
  id text NOT NULL, -- month_key e.g. "2025-07"
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  snapshot jsonb,
  surplus_carry_forward_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.months TO authenticated;
GRANT ALL ON public.months TO service_role;
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own months" ON public.months FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== BUDGET LINES ===========
CREATE TABLE public.budget_lines (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  "group" text NOT NULL,
  name text NOT NULL,
  planned numeric NOT NULL DEFAULT 0,
  real numeric NOT NULL DEFAULT 0,
  linked_shield_id text,
  linked_debt_id text,
  permanent boolean,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, month_key) REFERENCES public.months(user_id, id) ON DELETE CASCADE
);
CREATE INDEX budget_lines_month_idx ON public.budget_lines(user_id, month_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_lines TO authenticated;
GRANT ALL ON public.budget_lines TO service_role;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lines" ON public.budget_lines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== SHIELDS ===========
CREATE TABLE public.shields (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL,
  goal numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shields TO authenticated;
GRANT ALL ON public.shields TO service_role;
ALTER TABLE public.shields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shields" ON public.shields FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== SHIELD TX ===========
CREATE TABLE public.shield_tx (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shield_id text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  amount numeric NOT NULL,
  note text,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, shield_id) REFERENCES public.shields(user_id, id) ON DELETE CASCADE
);
CREATE INDEX shield_tx_shield_idx ON public.shield_tx(user_id, shield_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shield_tx TO authenticated;
GRANT ALL ON public.shield_tx TO service_role;
ALTER TABLE public.shield_tx ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shield tx" ON public.shield_tx FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== DEBTS ===========
CREATE TABLE public.debts (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  initial_balance numeric NOT NULL DEFAULT 0,
  minimum_payment numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT ALL ON public.debts TO service_role;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own debts" ON public.debts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== DEBT ADJUSTMENTS ===========
CREATE TABLE public.debt_adjustments (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  delta numeric NOT NULL,
  note text,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, debt_id) REFERENCES public.debts(user_id, id) ON DELETE CASCADE
);
CREATE INDEX debt_adjustments_debt_idx ON public.debt_adjustments(user_id, debt_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_adjustments TO authenticated;
GRANT ALL ON public.debt_adjustments TO service_role;
ALTER TABLE public.debt_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own debt adj" ON public.debt_adjustments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== TROPHIES ===========
CREATE TABLE public.trophies (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  context_id text,
  month_key text,
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trophies TO authenticated;
GRANT ALL ON public.trophies TO service_role;
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trophies" ON public.trophies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== AUTO-CREATE PROFILE ON SIGNUP ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'EUR')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
