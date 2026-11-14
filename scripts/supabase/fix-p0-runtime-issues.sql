-- ============================================================
-- P0 RUNTIME ISSUES FIX - Run in Supabase SQL Editor
-- Fixes FK constraints and missing columns
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Fix 1: product_images FK constraint
-- Error: Could not find a relationship between 'products' and 'product_images'
-- ────────────────────────────────────────────────────────────

-- First check if the FK already exists
DO $$
BEGIN
  -- Try to add the FK (will fail silently if exists due to IF NOT EXISTS behavior on constraint)
  ALTER TABLE public.product_images 
    ADD CONSTRAINT product_images_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint product_images_product_id_fkey already exists';
END $$;

-- If FK already exists but there's a FK error, we need to check the relationship
-- Run this to verify:
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_name LIKE '%product%' AND table_name = 'product_images';

-- ────────────────────────────────────────────────────────────
-- Fix 2: ai_assistant_conversations user_id column
-- Error: Could not find the 'user_id' column of 'ai_assistant_conversations'
-- ────────────────────────────────────────────────────────────

-- Check if user_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_assistant_conversations' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.ai_assistant_conversations 
      ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column to ai_assistant_conversations';
  ELSE
    RAISE NOTICE 'user_id column already exists in ai_assistant_conversations';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'user_id column already exists';
END $$;

-- ────────────────────────────────────────────────────────────
-- Fix 3: positions table permissions
-- Error: permission denied for table positions
-- ────────────────────────────────────────────────────────────

-- Grant SELECT permission to authenticated users on positions
GRANT SELECT ON public.positions TO authenticated;

-- Also ensure the table is accessible (may need service_role for writes)
GRANT ALL ON public.positions TO service_role;

-- Verify tables exist and have proper permissions
-- SELECT table_name, privilege_type FROM information_schema.table_privileges 
-- WHERE table_name IN ('product_images', 'ai_assistant_conversations', 'positions')
-- AND grantee = 'authenticated';

-- ────────────────────────────────────────────────────────────
-- Verification queries (uncomment to run)
-- ────────────────────────────────────────────────────────────

-- Check product_images FK
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
-- AND tc.table_name = 'product_images';

-- Check ai_assistant_conversations columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'ai_assistant_conversations';

-- Check positions permissions
-- SELECT grantee, privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_name = 'positions';
