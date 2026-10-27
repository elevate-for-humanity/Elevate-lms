import {
  handleCommunicationEmailGet,
  handleCommunicationEmailPatch,
  handleCommunicationEmailPost,
} from '@/lib/email/communication-email-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const GET = (request: Request) => handleCommunicationEmailGet(request);
export const POST = (request: Request) => handleCommunicationEmailPost(request);
export const PATCH = (request: Request) => handleCommunicationEmailPatch(request);
