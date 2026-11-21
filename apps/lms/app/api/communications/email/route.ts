import {
  handleCommunicationEmailGet,
  handleCommunicationEmailPatch,
  handleCommunicationEmailPost,
} from '@/lib/email/communication-email-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const response = await handleCommunicationEmailGet(request);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const POST = (request: Request) => handleCommunicationEmailPost(request);
export const PATCH = (request: Request) => handleCommunicationEmailPatch(request);
