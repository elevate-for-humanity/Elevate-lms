-- Harden the second audited set of sensitive operational tables.
-- Scoped owner/staff/admin policies already exist on each table; this removes
-- only the global authenticated read paths that bypass those restrictions.

DROP POLICY IF EXISTS "auth_read_assignment_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "auth_read_attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can read audit failures" ON public.audit_failures;
DROP POLICY IF EXISTS "auth_read_compliance_evidence" ON public.compliance_evidence;
DROP POLICY IF EXISTS "auth_read_complaints" ON public.complaints;
DROP POLICY IF EXISTS "auth_read_critical_audit_logs" ON public.critical_audit_logs;
DROP POLICY IF EXISTS "auth_read_cross_tenant_access" ON public.cross_tenant_access;
DROP POLICY IF EXISTS "auth_read_customer_service_tickets" ON public.customer_service_tickets;
