-- Create enum for order status stages
CREATE TYPE public.order_status AS ENUM ('pattern_cutting', 'assembly', 'sewing_seams', 'finishing', 'completed');

-- Create enum for gender
CREATE TYPE public.gender AS ENUM ('men', 'women');

-- Create tailor profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create stitch categories table
CREATE TABLE public.stitch_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gender public.gender NOT NULL,
  name TEXT NOT NULL,
  measurement_fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create orders table with token and order tracking
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  token_number SERIAL,
  gender public.gender NOT NULL,
  stitch_category TEXT NOT NULL,
  measurements JSONB NOT NULL DEFAULT '{}',
  work_description TEXT,
  due_date DATE NOT NULL,
  charges DECIMAL(10,2),
  status public.order_status NOT NULL DEFAULT 'pattern_cutting',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitch_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Stitch categories policies
CREATE POLICY "Tailors can view their own categories"
  ON public.stitch_categories FOR SELECT
  USING (auth.uid() = tailor_id);

CREATE POLICY "Tailors can insert their own categories"
  ON public.stitch_categories FOR INSERT
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "Tailors can update their own categories"
  ON public.stitch_categories FOR UPDATE
  USING (auth.uid() = tailor_id);

CREATE POLICY "Tailors can delete their own categories"
  ON public.stitch_categories FOR DELETE
  USING (auth.uid() = tailor_id);

-- Customers policies
CREATE POLICY "Tailors can view their own customers"
  ON public.customers FOR SELECT
  USING (auth.uid() = tailor_id);

CREATE POLICY "Tailors can insert their own customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "Tailors can update their own customers"
  ON public.customers FOR UPDATE
  USING (auth.uid() = tailor_id);

-- Orders policies
CREATE POLICY "Tailors can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = tailor_id);

CREATE POLICY "Tailors can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "Tailors can update their own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = tailor_id);

-- Public policy for order tracking (anyone can view by order_id)
CREATE POLICY "Anyone can view orders by order_id"
  ON public.orders FOR SELECT
  USING (true);

-- Create function to generate unique order ID
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_id := 'TB' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEW.token_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order_id
CREATE TRIGGER trigger_generate_order_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stitch categories for system (will be copied to new tailors)
-- These are template categories, tailors will get their own copies