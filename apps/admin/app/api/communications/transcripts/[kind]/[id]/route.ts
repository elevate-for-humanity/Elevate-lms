// pre-auth-registry: exempt - transcribePhoneMessage checks actor, preview, system, and record ownership.
export {transcribePhoneMessage as POST} from '@/lib/phone/transcript-api';
export const dynamic='force-dynamic';
export const maxDuration=60;
