import { withApiAudit } from '@/lib/audit/withApiAudit';
import { handleCareerCourseStripeWebhook } from '@/lib/payments/career-course-webhook';

export const dynamic = 'force-dynamic';

export const POST = withApiAudit(
  '/api/webhooks/stripe/career-courses',
  handleCareerCourseStripeWebhook,
  {
    actor_type: 'webhook',
    skip_body: true,
    critical: true,
  },
);
