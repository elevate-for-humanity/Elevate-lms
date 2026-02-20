-- Move extensions out of public schema per Supabase Security Advisor.
-- pg_net does not support SET SCHEMA (Supabase platform limitation).
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION fuzzystrmatch SET SCHEMA extensions;
