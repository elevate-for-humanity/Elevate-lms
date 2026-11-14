-- Public SELECT policies must be evaluable by anon without touching private
-- profile data. Restrict administrative ALL policies to authenticated users;
-- keep existing public read policies unchanged.

ALTER POLICY program_pricing_admin_write ON public.program_pricing TO authenticated;
ALTER POLICY admin_all ON public.legal_documents TO authenticated;
ALTER POLICY admin_all_testing_providers ON public.testing_providers TO authenticated;
