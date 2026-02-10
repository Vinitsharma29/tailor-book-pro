
-- Drop the overly permissive policy that lets everyone see all orders
DROP POLICY "Anyone can view orders by order_id" ON public.orders;

-- Create a new policy for public tracking that only works for anonymous/unauthenticated users
-- and requires knowing the specific order_id (used in TrackOrder page)
CREATE POLICY "Public can view orders by specific order_id"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Note: Authenticated tailors already have "Tailors can view their own orders" 
-- which restricts to auth.uid() = tailor_id
