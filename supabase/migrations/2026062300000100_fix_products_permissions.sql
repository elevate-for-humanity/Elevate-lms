-- Fix products table permissions for public reads
-- Addresses: permission denied for table products

-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to active products
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT
  USING (is_active = true);

-- Policy for authenticated users to read all products
DROP POLICY IF EXISTS "Authenticated read all products" ON public.products;
CREATE POLICY "Authenticated read all products" ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role to have full access
DROP POLICY IF EXISTS "Service role full access" ON public.products;
CREATE POLICY "Service role full access" ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
