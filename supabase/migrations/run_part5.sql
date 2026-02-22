-- Part 5 of 6: Create tables

CREATE TABLE IF NOT EXISTS tenant_billing (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terminal_command_log (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_access_keys (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_modules (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_date date,
  completed_at timestamptz,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  module_id uuid,
  progress text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_purchases (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_videos (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  reply_count integer DEFAULT 0,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transcript_search_log (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tts_usage_log (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tuition_options (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tuition_payments (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tuition_subscriptions (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutorials (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  featured text,
  jpg text,
  steps text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS updates (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  date timestamptz,
  description text,
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_access (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_activity_logs (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_app_subscriptions (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gov text,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_certifications (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_type_id uuid,
  earned_date timestamptz,
  elevateforhumanity text,
  profiles jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_compliance_status (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_consents (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text,
  signed_at timestamptz DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_credentials (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_entitlements (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_feedback (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer,
  "comment" text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_licenses (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  license_key text,
  license_type text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "key" text,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_saved_grants (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_websites (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_actions (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_notes (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_playback_events (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_views (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS website_pages (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS welcome_packet_items (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_enrollments (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workforce_referrals (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_categories (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity text,
  date timestamptz,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  location text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshops (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "all" text,
  capacity text,
  content text,
  date timestamptz,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  jpg text,
  location text,
  png text,
  price numeric DEFAULT 0,
  webp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

