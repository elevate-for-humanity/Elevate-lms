import { pathToFileURL } from 'node:url';

const PROJECT = 'cuxzzpsyufcewtmicszk';
const AUTH_CONFIG_URL = `https://api.supabase.com/v1/projects/${PROJECT}/config/auth`;
const present = (value) => typeof value === 'string' && Boolean(value.trim());
const booleanOrUnknown = (value) => (typeof value === 'boolean' ? value : null);
const masked = (value) => present(value) && /^[*•]+$/.test(value.trim());

/** Configuration URLs may contain credentials or tokens. Report origin/path only. */
export function sanitizeAuthUrl(value) {
  if (!present(value)) return null;
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function summarizeAuthConfig(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('invalid_auth_config_response');
  }
  const patterns =
    typeof body.uri_allow_list === 'string'
      ? body.uri_allow_list.split(/[,\n]/).map(sanitizeAuthUrl).filter(Boolean)
      : [];
  const hasTemplateField = Object.hasOwn(body, 'mailer_templates_magic_link_content');
  const template = body.mailer_templates_magic_link_content;
  const customTemplate = present(template);
  const templateWithoutComments = customTemplate
    ? template.replace(/\{\{-?\s*\/\*[\s\S]*?\*\/\s*-?\}\}/g, '')
    : '';
  const confirmationUrl = customTemplate
    ? /\{\{[^}]*\.ConfirmationURL\b[^}]*\}\}/.test(templateWithoutComments)
    : null;
  const port = Number(body.smtp_port);
  return {
    source: 'supabase-managed-auth',
    readOnly: true,
    // Preserve the existing Google-provider audit fields without printing values.
    enabled: body.external_google_enabled === true,
    clientIdPresent: present(body.external_google_client_id),
    clientSecretPresent: present(body.external_google_secret),
    clientSecretMasked: masked(body.external_google_secret),
    valuesExposed: false,
    signupEnabled: typeof body.disable_signup === 'boolean' ? !body.disable_signup : null,
    emailEnabled: booleanOrUnknown(body.external_email_enabled),
    mailerAutoconfirm: booleanOrUnknown(body.mailer_autoconfirm),
    secureEmailChangeEnabled: booleanOrUnknown(body.mailer_secure_email_change_enabled),
    captchaEnabled: booleanOrUnknown(body.security_captcha_enabled),
    sendEmailHookEnabled: booleanOrUnknown(body.hook_send_email_enabled),
    siteUrl: sanitizeAuthUrl(body.site_url),
    redirectPatterns: [...new Set(patterns)],
    redirectPatternsReported: typeof body.uri_allow_list === 'string',
    smtp: {
      hostPresent: present(body.smtp_host),
      userPresent: present(body.smtp_user),
      passwordPresent: present(body.smtp_pass),
      passwordMasked: masked(body.smtp_pass),
      senderEmailPresent: present(body.smtp_admin_email),
      senderNamePresent: present(body.smtp_sender_name),
      portConfigured: Number.isInteger(port) && port > 0 && port <= 65535,
      deliveryVerified: false,
    },
    magicLink: {
      enabled:
        typeof body.external_email_magic_link_disabled === 'boolean'
          ? !body.external_email_magic_link_disabled
          : null,
      templateMode: !hasTemplateField
        ? 'not_reported'
        : customTemplate
          ? 'custom'
          : 'provider_default',
      templateIncludesConfirmationUrl: confirmationUrl,
      liveLoginVerified: false,
    },
  };
}

const failure = (readError, httpStatus) => ({
  source: 'supabase-managed-auth',
  readOnly: true,
  valuesExposed: false,
  readError,
  ...(typeof httpStatus === 'number' ? { httpStatus } : {}),
});

/** Read only. Never return response bodies, credential values, templates, or raw errors. */
export async function auditSupabaseAuthReadiness({ env = process.env, request = fetch } = {}) {
  const candidates = [
    ...new Set(
      [env.SUPABASE_ACCESS_TOKEN, env.SUPABASE_MANAGEMENT_API_KEY, env.SUPABASE_TOKEN]
        .filter(present)
        .map((value) => value.trim()),
    ),
  ];
  if (!candidates.length) return failure('management_token_unavailable');
  const readConfig = (token) =>
    request(AUTH_CONFIG_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
  let response;
  try {
    for (const token of candidates) {
      response = await readConfig(token);
      if (response.status !== 401) break;
    }
    // Existing production recovery tooling uses this encrypted-runtime fallback
    // only after an Actions management credential is rejected. The RPC is a read.
    if (response.status === 401 && present(env.SUPABASE_SERVICE_ROLE_KEY)) {
      const secretResponse = await request(
        `https://${PROJECT}.supabase.co/rest/v1/rpc/get_platform_secret`,
        {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_key: 'SUPABASE_ACCESS_TOKEN' }),
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        },
      );
      const token = secretResponse.ok ? await secretResponse.json() : null;
      if (present(token) && !candidates.includes(token.trim())) {
        response = await readConfig(token.trim());
      }
    }
    if (!response.ok) return failure('management_read_rejected', response.status);
    return summarizeAuthConfig(await response.json());
  } catch {
    return failure('management_read_unavailable');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await auditSupabaseAuthReadiness();
  console.log(JSON.stringify(report));
  if (report.readError) process.exitCode = 1;
}
