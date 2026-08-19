-- Remove anonymous/signed-in access to legacy SECURITY DEFINER RPCs that have no current public caller.
REVOKE ALL ON FUNCTION public.sfc_get_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sfc_get_status(text) TO service_role;
REVOKE ALL ON FUNCTION public.get_tenant_by_domain(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain(text) TO service_role;
ALTER TABLE public.ai_operator_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_publish_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_studio_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_state_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeship_wage_obligations ENABLE ROW LEVEL SECURITY;
