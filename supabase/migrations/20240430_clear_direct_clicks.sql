-- Create a function to clear direct clicks
CREATE OR REPLACE FUNCTION clear_direct_clicks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.clicks WHERE type = 'direct';
  RAISE NOTICE 'All direct clicks have been cleared';
END;
$$ LANGUAGE plpgsql;

-- Call the function to clear clicks
SELECT clear_direct_clicks(); 