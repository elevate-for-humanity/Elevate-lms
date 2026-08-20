-- Supabase recommends installing pgvector in the extensions schema.
-- pgvector is relocatable; moving the extension updates dependent type/function OIDs
-- without dropping embedding columns or indexes.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;