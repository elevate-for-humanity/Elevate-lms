revoke execute on function public.calculate_course_progress(uuid,uuid) from public, anon;
revoke execute on function public.can_access_lesson(uuid,uuid) from public, anon;
revoke execute on function public.check_enrollment_access(uuid,text) from public, anon;
revoke execute on function public.check_module_unlock(uuid,uuid,uuid) from public, anon;
revoke execute on function public.check_onboarding_complete(uuid) from public, anon;
revoke execute on function public.check_onboarding_completion(uuid,text) from public, anon;
revoke execute on function public.evaluate_exam_readiness(uuid,uuid) from public, anon;
revoke execute on function public.is_program_completion_eligible(uuid,uuid) from public, anon;
revoke execute on function public.verify_enrollment_complete(uuid) from public, anon;

grant execute on function public.calculate_course_progress(uuid,uuid) to authenticated;
grant execute on function public.can_access_lesson(uuid,uuid) to authenticated;
grant execute on function public.check_enrollment_access(uuid,text) to authenticated;
grant execute on function public.check_module_unlock(uuid,uuid,uuid) to authenticated;
grant execute on function public.check_onboarding_complete(uuid) to authenticated;
grant execute on function public.check_onboarding_completion(uuid,text) to authenticated;
grant execute on function public.evaluate_exam_readiness(uuid,uuid) to authenticated;
grant execute on function public.is_program_completion_eligible(uuid,uuid) to authenticated;
grant execute on function public.verify_enrollment_complete(uuid) to authenticated;
