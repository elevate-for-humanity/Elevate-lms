export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Executes rollback_sql via the service role and marks rolled_back_at; see ../../../snapshot.
export { POST } from '../../../snapshot/[id]/rollback/route';
