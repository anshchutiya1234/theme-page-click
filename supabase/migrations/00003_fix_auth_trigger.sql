-- Fix for auth trigger - handles edge cases and potential errors
-- This migration fixes the user creation trigger to prevent signup errors

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
  user_instagram TEXT;
  user_partner_code TEXT;
  user_referred_by TEXT;
BEGIN
  -- Safely extract metadata with fallbacks
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  user_instagram := COALESCE(NEW.raw_user_meta_data->>'instagram_username', '');
  user_referred_by := NEW.raw_user_meta_data->>'referred_by';
  
  -- Generate a safe username
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
  
  -- Generate unique partner code
  user_partner_code := generate_unique_partner_code();
  
  -- Validate referred_by exists if provided
  IF user_referred_by IS NOT NULL AND user_referred_by != '' THEN
    -- Check if the referrer exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE partner_code = user_referred_by) THEN
      -- If referrer doesn't exist, set to null
      user_referred_by := NULL;
    END IF;
  END IF;
  
  -- Insert new user record
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
    user_name,
    user_username,
    COALESCE(NEW.email, ''),
    user_instagram,
    user_partner_code,
    user_referred_by,
    FALSE
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and continue (don't fail auth)
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix the foreign key constraint to be more flexible
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_referred_by;
ALTER TABLE public.users ADD CONSTRAINT fk_users_referred_by 
  FOREIGN KEY (referred_by) REFERENCES public.users(partner_code) 
  ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED; 