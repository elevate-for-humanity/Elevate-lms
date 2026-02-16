-- Cron Jobs Configuration
-- Sets up automated queue processing for Edge Functions
-- Copyright (c) 2025 Elevate for Humanity

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function to get service role key
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.settings.service_role_key', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get project URL
CREATE OR REPLACE FUNCTION get_project_url()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.settings.project_url', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Email Queue Processing (Every 5 minutes)
-- Processes pending emails in the queue
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := get_project_url() || '/functions/v1/email-dispatch?action=process-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || get_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Webhook Queue Processing (Every 2 minutes)
-- Processes pending webhooks in the queue
SELECT cron.schedule(
  'process-webhook-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := get_project_url() || '/functions/v1/webhook-dispatch?action=process-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || get_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Webhook Retry Failed (Every hour)
-- Retries failed webhook deliveries
SELECT cron.schedule(
  'retry-failed-webhooks',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := get_project_url() || '/functions/v1/webhook-dispatch?action=retry-failed',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || get_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- AI Grading Queue Processing (Every 10 minutes)
-- Processes pending AI grading requests
SELECT cron.schedule(
  'process-grading-queue',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := get_project_url() || '/functions/v1/grade-ai?action=process-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || get_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cleanup Old Logs (Daily at 2 AM)
-- Removes logs older than 90 days
SELECT cron.schedule(
  'cleanup-old-logs',
  '0 2 * * *',
  $$
  DELETE FROM email_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

-- Cleanup Completed Queue Items (Daily at 3 AM)
-- Removes completed queue items older than 7 days
SELECT cron.schedule(
  'cleanup-completed-queues',
  '0 3 * * *',
  $$
  DELETE FROM email_queue WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '7 days';
  DELETE FROM webhook_queue WHERE status = 'completed' AND processed_at < NOW() - INTERVAL '7 days';
  $$
);

-- View all scheduled jobs
COMMENT ON EXTENSION pg_cron IS 'Cron jobs for automated queue processing';

-- To view all cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 100;
