export const dynamic = 'force-static';
export const revalidate = 3600;

// PWA-scoped entry point for course management.
// Renders the same admin courses page inside the /pwa/admin scope
// so it is accessible when the admin app is installed as a PWA.
export { default } from '@/app/admin/courses/page';
