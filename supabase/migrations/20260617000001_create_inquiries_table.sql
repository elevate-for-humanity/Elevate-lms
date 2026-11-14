-- Create inquiries table for contact form submissions
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow authenticated reads
CREATE POLICY "Allow authenticated reads" ON public.inquiries
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.inquiries TO anon, authenticated;
