// pre-auth-registry: exempt - phoneActorResponse verifies active extension ownership; handlers scope every room to its invited participants.
export { GET, POST, PATCH } from '@/lib/communications/direct-video-api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
