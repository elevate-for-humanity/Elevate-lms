-- Add funding_type column to programs table
alter table programs add column if not exists funding_type text check (funding_type in ('state', 'federal', 'private'));

-- Add index for faster queries
create index if not exists idx_programs_funding_type on programs(funding_type);

-- Update existing programs (optional - set based on your knowledge)
-- Example: update programs set funding_type = 'state' where slug in ('cna-hha', 'welding-aws');
