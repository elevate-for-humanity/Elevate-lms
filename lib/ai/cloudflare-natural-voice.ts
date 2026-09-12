const DEFAULT_CLOUDFLARE_TTS_MODEL = '@cf/deepgram/aura-1';
const MAX_CHUNK_CHARACTERS = 1900;

function splitNarration(text: string): string[] {
  const chunks: string[] = [];
  let remaining = text.replace(/\s+/g, ' ').trim();
  while (remaining.length > MAX_CHUNK_CHARACTERS) {
    const window = remaining.slice(0, MAX_CHUNK_CHARACTERS + 1);
    const sentenceBreak = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('? '),
      window.lastIndexOf('! '),
    );
    const wordBreak = window.lastIndexOf(' ');
    const splitAt =
      sentenceBreak >= Math.floor(MAX_CHUNK_CHARACTERS * 0.5)
        ? sentenceBreak + 1
        : wordBreak > 0
          ? wordBreak
          : MAX_CHUNK_CHARACTERS;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function decodeBase64Audio(encoded: string): Uint8Array {
  const binary = atob(encoded.replace(/^data:audio\/[^;]+;base64,/, ''));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function generateChunk(text: string): Promise<Uint8Array> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim();
  if (!accountId || !token) throw new Error('Cloudflare Workers AI voice is not configured');

  const model = process.env.CLOUDFLARE_TTS_MODEL?.trim() || DEFAULT_CLOUDFLARE_TTS_MODEL;
  if (!model.startsWith('@cf/')) throw new Error('Invalid Cloudflare TTS model');
  const speaker = process.env.CLOUDFLARE_TTS_SPEAKER?.trim() || 'orion';
  const gatewayId = process.env.AI_GATEWAY_ID?.trim() || 'default';
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'cf-aig-gateway-id': gatewayId,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg, application/json',
      },
      body: JSON.stringify({ text, speaker, encoding: 'mp3' }),
      signal: AbortSignal.timeout(120_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Cloudflare Workers AI returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`,
    );
  }
  if ((response.headers.get('content-type') || '').toLowerCase().startsWith('audio/')) {
    const audio = new Uint8Array(await response.arrayBuffer());
    if (!audio.length) throw new Error('Cloudflare Workers AI returned empty audio');
    return audio;
  }
  const payload = await response.json().catch(() => null);
  const encoded = payload?.result?.audio ?? payload?.audio ?? payload?.result;
  if (typeof encoded !== 'string' || !encoded) {
    throw new Error('Cloudflare Workers AI returned no audio');
  }
  return decodeBase64Audio(encoded);
}

export async function generateCloudflareNaturalVoice(text: string): Promise<ArrayBuffer> {
  const segments: Uint8Array[] = [];
  for (const chunk of splitNarration(text)) segments.push(await generateChunk(chunk));
  const size = segments.reduce((total, segment) => total + segment.length, 0);
  const audio = new Uint8Array(size);
  let offset = 0;
  for (const segment of segments) {
    audio.set(segment, offset);
    offset += segment.length;
  }
  return audio.buffer;
}
