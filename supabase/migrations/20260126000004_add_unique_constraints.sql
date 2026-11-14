-- Add unique constraints to prevent duplicate seed data
-- First deduplicate any existing rows, then create indexes

-- Deduplicate crm_contacts by email (keep oldest)
DELETE FROM crm_contacts a USING crm_contacts b
WHERE a.id > b.id AND a.email IS NOT NULL AND a.email = b.email;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_email_unique ON crm_contacts(email);

-- Deduplicate testimonials by (name, program_slug)
DELETE FROM testimonials a USING testimonials b
WHERE a.id > b.id AND a.name = b.name AND a.program_slug IS NOT DISTINCT FROM b.program_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_name_program ON testimonials(name, program_slug);

-- Deduplicate team_members by (name, title)
DELETE FROM team_members a USING team_members b
WHERE a.id > b.id AND a.name = b.name AND a.title = b.title;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_name_title ON team_members(name, title);

-- Deduplicate success_stories by (name, program_completed)
DELETE FROM success_stories a USING success_stories b
WHERE a.id > b.id AND a.name = b.name AND a.program_completed IS NOT DISTINCT FROM b.program_completed;

CREATE UNIQUE INDEX IF NOT EXISTS idx_success_stories_name_program ON success_stories(name, program_completed);

-- Deduplicate locations by (name, location_type)
DELETE FROM locations a USING locations b
WHERE a.id > b.id AND a.name = b.name AND a.location_type IS NOT DISTINCT FROM b.location_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_name_type ON locations(name, location_type);

-- Deduplicate faqs by question
DELETE FROM faqs a USING faqs b
WHERE a.id > b.id AND a.question = b.question;

CREATE UNIQUE INDEX IF NOT EXISTS idx_faqs_question_unique ON faqs(question);

-- campaigns: already has idx_campaigns_name_unique from previous migration
-- partners: contact_email already has UNIQUE from table creation
-- grant_opportunities: external_id already has unique index from previous migration
