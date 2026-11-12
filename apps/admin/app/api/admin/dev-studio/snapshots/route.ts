export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Canonical plural path; handlers (apiRequireDevStudio + requireAdminClient) live in ../snapshot.
export { GET, POST } from '../snapshot/route';
