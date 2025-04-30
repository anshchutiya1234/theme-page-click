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

-- Enable Row Level Security
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own short URLs"
  ON public.short_urls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own short URLs"
  ON public.short_urls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view short URLs for redirection"
  ON public.short_urls
  FOR SELECT
  TO anon
  USING (true);

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
      -- Check if the code already exists
      PERFORM 1 FROM public.short_urls WHERE short_code = result;
      IF NOT FOUND THEN
        success := true;
      END IF;
    EXCEPTION WHEN unique_violation THEN
      -- Just try again
    END;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 