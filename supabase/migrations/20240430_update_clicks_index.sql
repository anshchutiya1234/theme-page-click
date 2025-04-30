-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_unique_visitor_clicks;

-- Create new index with date constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_visitor_clicks 
ON public.clicks (user_id, short_code, visitor_id, created_at::date) 
WHERE is_unique = true; 