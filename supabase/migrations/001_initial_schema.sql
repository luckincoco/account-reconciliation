-- DuiZhang MVP - Initial Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ============================================
-- Users table (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  lang TEXT NOT NULL DEFAULT 'zh',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Transactions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  counterpart_name TEXT NOT NULL,
  counterpart_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  item_name TEXT NOT NULL,
  spec TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('photo', 'voice', 'manual')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_counterpart ON public.transactions(counterpart_name);

-- ============================================
-- Reconciliations table
-- ============================================
CREATE TABLE IF NOT EXISTS public.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  counterpart_id UUID REFERENCES public.users(id),
  share_token TEXT NOT NULL UNIQUE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reconciliations"
  ON public.reconciliations FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = counterpart_id);

CREATE POLICY "Users can create reconciliations"
  ON public.reconciliations FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update own reconciliations"
  ON public.reconciliations FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = counterpart_id);

-- Allow public access via share_token (for guest viewing)
CREATE POLICY "Anyone can view via share token"
  ON public.reconciliations FOR SELECT
  USING (true);

CREATE INDEX idx_reconciliations_share_token ON public.reconciliations(share_token);
CREATE INDEX idx_reconciliations_initiator ON public.reconciliations(initiator_id);

-- ============================================
-- Reconciliation matches table
-- ============================================
CREATE TABLE IF NOT EXISTS public.recon_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_id UUID NOT NULL REFERENCES public.reconciliations(id) ON DELETE CASCADE,
  my_tx_id UUID REFERENCES public.transactions(id),
  their_tx_id UUID REFERENCES public.transactions(id),
  match_status TEXT NOT NULL CHECK (match_status IN ('matched', 'diff', 'missing')),
  diff_detail TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.recon_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matches for their reconciliations"
  ON public.recon_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reconciliations r
      WHERE r.id = recon_id
      AND (r.initiator_id = auth.uid() OR r.counterpart_id = auth.uid())
    )
  );

CREATE POLICY "System can manage matches"
  ON public.recon_matches FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_recon_matches_recon_id ON public.recon_matches(recon_id);
