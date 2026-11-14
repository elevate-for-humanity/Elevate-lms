// Compatibility route uses the canonical authenticated voicemail recording handler.
export const runtime='nodejs';
export const dynamic='force-dynamic';
export {GET} from '../../../voicemail/[id]/recording/route';
