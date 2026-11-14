-- Preserve historical pg_net responses before recreating this non-relocatable extension.
CREATE SCHEMA IF NOT EXISTS audit_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA audit_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA audit_private TO service_role;

CREATE TABLE IF NOT EXISTS audit_private.pg_net_http_response_archive (
  archived_at timestamptz NOT NULL DEFAULT now(),
  id bigint,
  status_code integer,
  content_type text,
  headers jsonb,
  content text,
  timed_out boolean,
  error_msg text,
  created timestamptz NOT NULL
);

INSERT INTO audit_private.pg_net_http_response_archive
  (id,status_code,content_type,headers,content,timed_out,error_msg,created)
SELECT id,status_code,content_type,headers,content,timed_out,error_msg,created
FROM net._http_response;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM net.http_request_queue LIMIT 1) THEN
    RAISE EXCEPTION 'pg_net migration blocked: pending HTTP requests exist';
  END IF;
END $$;

DROP EXTENSION pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
