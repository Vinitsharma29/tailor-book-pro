-- Fix the order_id column to have a default value (temporary) so inserts work
-- The trigger will override this default value
ALTER TABLE public.orders ALTER COLUMN order_id SET DEFAULT 'TEMP';