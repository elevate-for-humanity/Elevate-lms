import { createClient } from 'npm:@supabase/supabase-js@2';
import * as Ed25519Multikey from 'npm:@digitalbazaar/ed25519-multikey@1.3.0';
import { DataIntegrityProof } from 'npm:@digitalbazaar/data-integrity@2.5.0';
import { cryptosuite as eddsaRdfc2022Cryptosuite } from 'npm:@digitalbazaar/eddsa-rdfc-2022-cryptosuite@1.3.0';
import jsigs from 'npm:jsonld-signatures@11.6.0';

const {
  purposes: { AssertionProofPurpose },
} = jsigs;

const CONTROLLER = 'https://www.elevateforhumanity.org/api/credentials/issuer';
const PUBLIC_KEY_MULTIBASE = 'z6Mkv1GgBRPfM9AUTk8ZUhYoTgouk4Zd53RbGJjtE9KQhgQr';
const KEY_ID = `${CONTROLLER}#${PUBLIC_KEY_MULTIBASE}`;
const ALLOWED_REMOTE_HOSTS = new Set([
  'www.w3.org',
  'w3id.org',
  'purl.imsglobal.org',
  'standards.1edtech.org',
]);

const publicKey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: KEY_ID,
  type: 'Multikey',
  controller: CONTROLLER,
  publicKeyMultibase: PUBLIC_KEY_MULTIBASE,
};

const controllerDocument = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1',
  ],
  id: CONTROLLER,
  verificationMethod: [publicKey],
  assertionMethod: [publicKey],
};

async function documentLoader(url: string) {
  if (url === CONTROLLER) {
    return { contextUrl: null, document: controllerDocument, documentUrl: url };
  }
  if (url === KEY_ID) {
    return { contextUrl: null, document: publicKey, documentUrl: url };
  }

  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !ALLOWED_REMOTE_HOSTS.has(parsed.hostname)) {
    throw new Error(`Remote JSON-LD document host is not allowlisted: ${parsed.hostname}`);
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/ld+json, application/json' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Unable to load JSON-LD document ${url}: ${response.status}`);
  }

  return {
    contextUrl: null,
    document: await response.json(),
    documentUrl: response.url || url,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!serviceRoleKey || supplied !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Service role required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const text = await req.text();
    if (text.length > 262144) {
      return new Response(JSON.stringify({ error: 'Credential payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const credential = JSON.parse(text)?.credential;
    if (!credential || typeof credential !== 'object') {
      throw new Error('credential object is required');
    }
    if (credential?.issuer?.id !== CONTROLLER) {
      throw new Error('Credential issuer does not match the Elevate signing controller');
    }
    if (!Array.isArray(credential?.type) || !credential.type.includes('OpenBadgeCredential')) {
      throw new Error('Only OpenBadgeCredential documents may be signed');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service configuration missing');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: secretKeyMultibase, error } = await supabase.rpc(
      'get_open_badges_signing_key',
    );
    if (error || !secretKeyMultibase) {
      throw new Error(error?.message || 'Signing key unavailable');
    }

    const keyPair = await Ed25519Multikey.from({
      '@context': 'https://w3id.org/security/multikey/v1',
      type: 'Multikey',
      controller: CONTROLLER,
      id: KEY_ID,
      publicKeyMultibase: PUBLIC_KEY_MULTIBASE,
      secretKeyMultibase,
    });

    const suite = new DataIntegrityProof({
      signer: keyPair.signer(),
      cryptosuite: eddsaRdfc2022Cryptosuite,
    });

    const signed = await jsigs.sign(credential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader,
    });

    return new Response(JSON.stringify(signed), {
      status: 200,
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Open Badges signing failure', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Signing failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
