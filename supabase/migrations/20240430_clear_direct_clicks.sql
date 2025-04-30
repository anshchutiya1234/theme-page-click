-- First drop the function if it exists
DROP FUNCTION IF EXISTS clear_direct_clicks();

-- Create the function to clear direct clicks
CREATE OR REPLACE FUNCTION clear_direct_clicks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.clicks WHERE type = 'direct';
  RAISE NOTICE 'All direct clicks have been cleared';
END;
$$ LANGUAGE plpgsql;

-- Now call the function
SELECT clear_direct_clicks(); 