-- Replace email with the apprentice test email you used in Stripe checkout.
select
  student_email,
  student_name,
  program_slug,
  status,
  created_at
from milady_provisioning_queue
where student_email = 'test-apprentice@example.com'
order by created_at desc;
