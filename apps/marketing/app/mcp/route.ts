import { applyRateLimit } from '@/lib/api/withRateLimit';
import { handleElevateMcpMessage } from '@/lib/chatgpt/elevate-suite-mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedOrigins = new Set(['https://chatgpt.com', 'https://chat.openai.com', 'https://platform.openai.com']);
function headers(request: Request) {
  const origin = request.headers.get('origin');
  return { 'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://chatgpt.com', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Protocol-Version', Vary: 'Origin' };
}
export async function OPTIONS(request: Request) { return new Response(null, { status: 204, headers: headers(request) }); }
export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;
  try {
    const payload = await request.json();
    const output = Array.isArray(payload) ? payload.map(handleElevateMcpMessage).filter(Boolean) : handleElevateMcpMessage(payload);
    if (output === null || (Array.isArray(output) && output.length === 0)) return new Response(null, { status: 202, headers: headers(request) });
    return Response.json(output, { headers: headers(request) });
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: headers(request) });
  }
}
