-- Allow anyone to read shop_name and phone_number from profiles (needed for order tracking)
CREATE POLICY "Anyone can view tailor profiles for tracking"
  ON public.profiles
  FOR SELECT
  USING (true);
