-- Create short_urls table
CREATE TABLE IF NOT EXISTS public.short_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  short_code VARCHAR(10) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_short_code ON public.short_urls(short_code);

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
    
    BEGIN
      INSERT INTO public.short_urls (short_code) VALUES (result)
      ON CONFLICT DO NOTHING;
      IF FOUND THEN
        success := true;
      END IF;
    EXCEPTION WHEN unique_violation THEN
      -- Just try again
    END;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 