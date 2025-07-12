-- Auth trigger to create user profile on signup
-- This trigger automatically creates a user record in public.users when someone signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    username,
    email,
    instagram_username,
    partner_code,
    referred_by,
    is_admin
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'instagram_username', ''),
    generate_unique_partner_code(),
    NEW.raw_user_meta_data->>'referred_by',
    FALSE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.clicks TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.short_urls TO anon, authenticated;
GRANT ALL ON public.withdrawals TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_unique_partner_code() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_short_code() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_withdrawal_eligibility(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_click(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_direct_clicks() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_referral_and_add_bonus(UUID, TEXT, UUID) TO anon, authenticated; 