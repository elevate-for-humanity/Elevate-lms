-- Transactional audit coupling for compliance-critical routes.
--
-- Problem: The JS client performs mutation + audit as two separate requests.
-- If the audit write fails after the mutation succeeds, we have an
-- un-audited state change — unacceptable for DOL/WIOA compliance.
--
-- Solution: A PostgreSQL function that executes both the business mutation
-- and the audit INSERT in a single implicit transaction. If either fails,
-- both roll back.
--
-- The function accepts structured parameters (not raw SQL) and uses
-- format(%I) for identifier quoting to prevent injection.

CREATE OR REPLACE FUNCTION audited_mutation(
  p_table       text,          -- target table name
  p_operation   text,          -- 'insert', 'update', 'upsert', 'delete'
  p_row_data    jsonb,         -- columns to insert/update (key-value pairs)
  p_filter      jsonb DEFAULT NULL, -- WHERE conditions for update/delete (key-value, AND'd)
  p_conflict_on text[] DEFAULT NULL, -- columns for upsert ON CONFLICT
  -- Audit payload
  p_audit_action    text,
  p_audit_actor_id  uuid DEFAULT NULL,
  p_audit_target_type text DEFAULT NULL,
  p_audit_target_id   text DEFAULT NULL,
  p_audit_metadata    jsonb DEFAULT '{}'::jsonb,
  p_audit_ip          inet DEFAULT NULL,
  p_audit_user_agent  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
  _sql text;
  _set_parts text[];
  _where_parts text[];
  _columns text[];
  _values text[];
  _conflict_cols text;
  _key text;
  _val jsonb;
BEGIN
  -- Validate inputs
  IF p_table IS NULL OR p_table = '' THEN
    RAISE EXCEPTION 'audited_mutation: p_table is required';
  END IF;
  IF p_operation IS NULL OR p_operation NOT IN ('insert', 'update', 'upsert', 'delete') THEN
    RAISE EXCEPTION 'audited_mutation: p_operation must be insert, update, upsert, or delete';
  END IF;
  IF p_audit_action IS NULL OR p_audit_action = '' THEN
    RAISE EXCEPTION 'audited_mutation: p_audit_action is required';
  END IF;

  -- Restrict to known tables to prevent abuse
  IF p_table NOT IN (
    -- Enrollment / application tables
    'enrollments', 'student_enrollments', 'program_enrollments',
    'applications', 'onboarding_progress',
    -- Apprenticeship / RAPIDS
    'apprenticeships', 'rapids_tracking', 'rapids_registrations',
    -- Hours tracking
    'ojt_hours', 'ojt_hours_log', 'ojt_reimbursements',
    'apprenticeship_hours', 'training_hours', 'student_hours',
    'apprentice_hours_log', 'progress_entries', 'apprentice_progress',
    'transfer_hour_requests',
    -- Compliance / verification
    'compliance_items', 'compliance_reviews', 'compliance_evidence',
    'verification_documents', 'id_verifications',
    'certification_submissions', 'documents',
    -- WIOA
    'wioa_applications', 'individual_employment_plans', 'supportive_services',
    -- Payments / commerce
    'payment_logs', 'payments', 'donations', 'licenses',
    'license_events', 'drug_testing_orders',
    'stripe_webhook_events', 'career_course_purchases',
    'promo_code_uses', 'career_courses', 'orders',
    -- Partner / shop
    'partner_audit_log', 'shop_documents', 'shop_onboarding',
    'shop_required_docs_status',
    -- Profiles
    'profiles', 'user_profiles',
    -- Notifications
    'notifications'
  ) THEN
    RAISE EXCEPTION 'audited_mutation: table % is not in the allowlist', p_table;
  END IF;

  -- Build and execute the mutation
  CASE p_operation
    WHEN 'insert' THEN
      -- Build column/value lists from JSONB
      SELECT
        array_agg(format('%I', key)),
        array_agg(
          CASE
            WHEN value = 'null'::jsonb THEN 'NULL'
            WHEN jsonb_typeof(value) = 'string' THEN format('%L', value #>> '{}')
            WHEN jsonb_typeof(value) IN ('number', 'boolean') THEN value::text
            ELSE format('%L', value::text)
          END
        )
      INTO _columns, _values
      FROM jsonb_each(p_row_data);

      _sql := format(
        'INSERT INTO %I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)',
        p_table,
        array_to_string(_columns, ', '),
        array_to_string(_values, ', '),
        p_table
      );

      EXECUTE _sql INTO _result;

    WHEN 'upsert' THEN
      SELECT
        array_agg(format('%I', key)),
        array_agg(
          CASE
            WHEN value = 'null'::jsonb THEN 'NULL'
            WHEN jsonb_typeof(value) = 'string' THEN format('%L', value #>> '{}')
            WHEN jsonb_typeof(value) IN ('number', 'boolean') THEN value::text
            ELSE format('%L', value::text)
          END
        )
      INTO _columns, _values
      FROM jsonb_each(p_row_data);

      -- Build conflict column list
      IF p_conflict_on IS NOT NULL AND array_length(p_conflict_on, 1) > 0 THEN
        SELECT string_agg(format('%I', col), ', ')
        INTO _conflict_cols
        FROM unnest(p_conflict_on) AS col;
      ELSE
        _conflict_cols := 'id';
      END IF;

      -- Build SET clause for ON CONFLICT (exclude conflict columns)
      SELECT array_agg(format('%I = EXCLUDED.%I', key, key))
      INTO _set_parts
      FROM jsonb_each(p_row_data)
      WHERE key != ALL(COALESCE(p_conflict_on, ARRAY['id']));

      _sql := format(
        'INSERT INTO %I (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s RETURNING to_jsonb(%I.*)',
        p_table,
        array_to_string(_columns, ', '),
        array_to_string(_values, ', '),
        _conflict_cols,
        array_to_string(_set_parts, ', '),
        p_table
      );

      EXECUTE _sql INTO _result;

    WHEN 'update' THEN
      IF p_filter IS NULL OR p_filter = '{}'::jsonb THEN
        RAISE EXCEPTION 'audited_mutation: p_filter is required for update';
      END IF;

      -- Build SET clause
      SELECT array_agg(
        format('%I = %s', key,
          CASE
            WHEN value = 'null'::jsonb THEN 'NULL'
            WHEN jsonb_typeof(value) = 'string' THEN format('%L', value #>> '{}')
            WHEN jsonb_typeof(value) IN ('number', 'boolean') THEN value::text
            ELSE format('%L', value::text)
          END
        )
      )
      INTO _set_parts
      FROM jsonb_each(p_row_data);

      -- Build WHERE clause
      SELECT array_agg(
        format('%I = %s', key,
          CASE
            WHEN value = 'null'::jsonb THEN 'NULL'
            WHEN jsonb_typeof(value) = 'string' THEN format('%L', value #>> '{}')
            WHEN jsonb_typeof(value) IN ('number', 'boolean') THEN value::text
            ELSE format('%L', value::text)
          END
        )
      )
      INTO _where_parts
      FROM jsonb_each(p_filter);

      _sql := format(
        'UPDATE %I SET %s WHERE %s RETURNING to_jsonb(%I.*)',
        p_table,
        array_to_string(_set_parts, ', '),
        array_to_string(_where_parts, ' AND '),
        p_table
      );

      EXECUTE _sql INTO _result;

    WHEN 'delete' THEN
      IF p_filter IS NULL OR p_filter = '{}'::jsonb THEN
        RAISE EXCEPTION 'audited_mutation: p_filter is required for delete';
      END IF;

      SELECT array_agg(
        format('%I = %s', key,
          CASE
            WHEN value = 'null'::jsonb THEN 'NULL'
            WHEN jsonb_typeof(value) = 'string' THEN format('%L', value #>> '{}')
            WHEN jsonb_typeof(value) IN ('number', 'boolean') THEN value::text
            ELSE format('%L', value::text)
          END
        )
      )
      INTO _where_parts
      FROM jsonb_each(p_filter);

      _sql := format(
        'DELETE FROM %I WHERE %s RETURNING to_jsonb(%I.*)',
        p_table,
        array_to_string(_where_parts, ' AND '),
        p_table
      );

      EXECUTE _sql INTO _result;
  END CASE;

  -- If no row was affected, raise so the transaction rolls back
  IF _result IS NULL THEN
    RAISE EXCEPTION 'audited_mutation: no rows affected (table=%, op=%, filter=%)',
      p_table, p_operation, p_filter;
  END IF;

  -- Write the audit record in the same transaction
  INSERT INTO audit_logs (
    action, actor_id, target_type, target_id,
    metadata, ip_address, user_agent
  ) VALUES (
    p_audit_action,
    p_audit_actor_id,
    COALESCE(p_audit_target_type, p_table),
    COALESCE(p_audit_target_id, _result->>'id'),
    p_audit_metadata || jsonb_build_object(
      'transactional', true,
      'operation', p_operation,
      'table', p_table
    ),
    p_audit_ip,
    p_audit_user_agent
  );

  RETURN _result;
END;
$$;

-- Grant execute to service_role only (admin client)
REVOKE ALL ON FUNCTION audited_mutation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audited_mutation TO service_role;

COMMENT ON FUNCTION audited_mutation IS
  'Executes a table mutation and audit log insert in a single transaction. '
  'If either fails, both roll back. Used by compliance-critical API routes.';
