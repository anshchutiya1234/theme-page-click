-- Complete database schema for Arciuz Dashboard
-- This file recreates all tables, functions, and policies needed for the application

-- =============================================
-- TABLES
-- =============================================

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  instagram_username TEXT NOT NULL,
  partner_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES public.users(partner_code) ON DELETE SET NULL
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS public.clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('direct', 'bonus')),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_broadcast BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create short_urls table
CREATE TABLE IF NOT EXISTS public.short_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  click_count INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_partner_code ON public.users(partner_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON public.clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_type ON public.clicks(type);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_short_urls_short_code ON public.short_urls(short_code);
CREATE INDEX IF NOT EXISTS idx_short_urls_user_id ON public.short_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate a unique partner code
CREATE OR REPLACE FUNCTION generate_unique_partner_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  success BOOLEAN := false;
BEGIN
  WHILE NOT success LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if the code already exists
    PERFORM 1 FROM public.users WHERE partner_code = result;
    IF NOT FOUND THEN
      success := true;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique short code
CREATE OR REPLACE FUNCTION generate_unique_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  success BOOLEAN := false;
BEGIN
  WHILE NOT success LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if the code already exists
    PERFORM 1 FROM public.short_urls WHERE short_code = result;
    IF NOT FOUND THEN
      success := true;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  direct_clicks INTEGER,
  bonus_clicks INTEGER,
  total_earnings DECIMAL,
  sub_partners_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.clicks WHERE clicks.user_id = get_user_stats.user_id AND type = 'direct'), 0) as direct_clicks,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.clicks WHERE clicks.user_id = get_user_stats.user_id AND type = 'bonus'), 0) as bonus_clicks,
    COALESCE((SELECT (COUNT(*) * 0.10)::DECIMAL FROM public.clicks WHERE clicks.user_id = get_user_stats.user_id), 0) as total_earnings,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.users WHERE users.referred_by = (SELECT partner_code FROM public.users WHERE users.id = get_user_stats.user_id)), 0) as sub_partners_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check withdrawal eligibility
CREATE OR REPLACE FUNCTION check_withdrawal_eligibility(user_id UUID)
RETURNS TABLE (
  is_eligible BOOLEAN,
  days_since_signup INTEGER,
  total_clicks INTEGER
) AS $$
DECLARE
  signup_date TIMESTAMPTZ;
  days_elapsed INTEGER;
  click_count INTEGER;
BEGIN
  -- Get user signup date
  SELECT joined_at INTO signup_date FROM public.users WHERE id = user_id;
  
  -- Calculate days since signup
  days_elapsed := EXTRACT(DAY FROM NOW() - signup_date)::INTEGER;
  
  -- Get total clicks
  SELECT COUNT(*)::INTEGER INTO click_count FROM public.clicks WHERE clicks.user_id = check_withdrawal_eligibility.user_id;
  
  RETURN QUERY
  SELECT 
    (days_elapsed >= 30 AND click_count >= 100) as is_eligible,
    days_elapsed as days_since_signup,
    click_count as total_clicks;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread messages count
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count 
  FROM public.messages 
  WHERE receiver_id = user_id AND is_read = FALSE;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to register a click
CREATE OR REPLACE FUNCTION register_click(referrer_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_user_id UUID;
  click_registered BOOLEAN := FALSE;
BEGIN
  -- Find the user with this referrer code
  SELECT id INTO referrer_user_id 
  FROM public.users 
  WHERE partner_code = referrer_code;
  
  -- If user exists, register the click
  IF referrer_user_id IS NOT NULL THEN
    INSERT INTO public.clicks (user_id, type, ip_address, user_agent)
    VALUES (referrer_user_id, 'direct', '0.0.0.0', 'API_CALL');
    
    click_registered := TRUE;
  END IF;
  
  RETURN click_registered;
END;
$$ LANGUAGE plpgsql;

-- Function to clear direct clicks (admin function)
CREATE OR REPLACE FUNCTION clear_direct_clicks()
RETURNS VOID AS $$
BEGIN
  -- Only allow admin users to clear clicks
  IF is_admin() THEN
    DELETE FROM public.clicks WHERE type = 'direct';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral and add bonus clicks
CREATE OR REPLACE FUNCTION update_referral_and_add_bonus(
  user_id_param UUID,
  referrer_code_param TEXT,
  referrer_id_param UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update the user's referral
  UPDATE public.users 
  SET referred_by = referrer_code_param
  WHERE id = user_id_param;
  
  -- Add 500 bonus clicks for the referrer
  INSERT INTO public.clicks (user_id, source_user_id, type, ip_address, user_agent)
  SELECT referrer_id_param, user_id_param, 'bonus', '127.0.0.1', 'REFERRAL_BONUS'
  FROM generate_series(1, 500);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all users"
  ON public.users FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update all users"
  ON public.users FOR UPDATE
  USING (is_admin());

CREATE POLICY "Users can view other users' public info"
  ON public.users FOR SELECT
  USING (true);

-- Clicks policies
CREATE POLICY "Users can view their own clicks"
  ON public.clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clicks"
  ON public.clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all clicks"
  ON public.clicks FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage all clicks"
  ON public.clicks FOR ALL
  USING (is_admin());

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Admin can view all messages"
  ON public.messages FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can send messages to anyone"
  ON public.messages FOR INSERT
  WITH CHECK (is_admin());

-- Short URLs policies
CREATE POLICY "Users can view their own short URLs"
  ON public.short_urls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short URLs"
  ON public.short_urls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view short URLs for redirection"
  ON public.short_urls FOR SELECT
  USING (true);

CREATE POLICY "Admin can view all short URLs"
  ON public.short_urls FOR SELECT
  USING (is_admin());

-- Withdrawals policies
CREATE POLICY "Users can view their own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
  ON public.withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update all withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (is_admin());

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to auto-generate partner code on user creation
CREATE OR REPLACE FUNCTION auto_generate_partner_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_code IS NULL OR NEW.partner_code = '' THEN
    NEW.partner_code := generate_unique_partner_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_partner_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_partner_code();

-- Trigger to auto-generate short code on short URL creation
CREATE OR REPLACE FUNCTION auto_generate_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    NEW.short_code := generate_unique_short_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_short_code
  BEFORE INSERT ON public.short_urls
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_short_code(); 