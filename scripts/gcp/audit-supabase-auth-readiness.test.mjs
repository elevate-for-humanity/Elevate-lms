import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  auditSupabaseAuthReadiness,
  sanitizeAuthUrl,
  summarizeAuthConfig,
} from './audit-supabase-auth-readiness.mjs';

const configUrl = 'https://api.supabase.com/v1/projects/cuxzzpsyufcewtmicszk/config/auth';
const secretUrl = 'https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/get_platform_secret';
const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
const fixture = {
  disable_signup: false,
  external_email_enabled: true,
  external_email_magic_link_disabled: false,
  security_captcha_enabled: false,
  security_captcha_secret: 'private-captcha-secret',
  mailer_autoconfirm: true,
  external_google_enabled: true,
  external_google_client_id: 'private-google-id',
  external_google_secret: 'private-google-secret',
  smtp_host: 'private-smtp-host',
  smtp_user: 'private-smtp-user',
  smtp_pass: 'private-smtp-password',
  smtp_admin_email: 'private-sender@example.invalid',
  smtp_sender_name: 'private-sender-name',
  smtp_port: '587',
  hook_send_email_enabled: false,
  hook_send_email_secret: 'private-hook-secret',
  site_url:
    'https://url-user:url-password@www.elevateforhumanity.org/start?token=query-secret#fragment-secret',
  uri_allow_list:
    'https://lms.elevateforhumanity.org/auth/callback?secret=callback-secret,https://*.elevateforhumanity.org/**#glob-secret',
  mailer_templates_magic_link_content:
    '<a href="{{ .ConfirmationURL }}">private-template-content {{ .Token }}</a>',
};

test('reports only selected configuration and removes credentials, queries and fragments', () => {
  const report = summarizeAuthConfig(fixture);
  assert.equal(report.signupEnabled, true);
  assert.equal(report.emailEnabled, true);
  assert.equal(report.mailerAutoconfirm, true);
  assert.equal(report.captchaEnabled, false);
  assert.equal(report.magicLink.enabled, true);
  assert.equal(report.sendEmailHookEnabled, false);
  assert.equal(report.siteUrl, 'https://www.elevateforhumanity.org/start');
  assert.deepEqual(report.redirectPatterns, [
    'https://lms.elevateforhumanity.org/auth/callback',
    'https://*.elevateforhumanity.org/**',
  ]);
  assert.equal(report.magicLink.templateIncludesConfirmationUrl, true);
  assert.equal(report.smtp.passwordPresent, true);
  assert.equal(report.smtp.deliveryVerified, false);
  assert.equal(report.magicLink.liveLoginVerified, false);
  const output = JSON.stringify(report);
  for (const secret of [
    'private-',
    'url-user',
    'url-password',
    'query-secret',
    'fragment-secret',
    'callback-secret',
    'glob-secret',
    '{{',
    '.Token',
  ])
    assert.equal(output.includes(secret), false, secret);
  assert.equal(report.enabled, true);
  assert.equal(report.clientIdPresent, true);
  assert.equal(report.clientSecretPresent, true);
  assert.equal(report.valuesExposed, false);
});

test('rejects invalid/non-HTTP URLs and retains safe wildcard origin/path patterns', () => {
  for (const value of [
    null,
    {},
    '',
    'javascript:alert(1)',
    'file:///secret',
    '/relative',
    'not a url',
  ]) {
    assert.equal(sanitizeAuthUrl(value), null);
  }
  assert.equal(
    sanitizeAuthUrl('https://user:password@*.example.invalid:443/**?token=secret#fragment'),
    'https://*.example.invalid/**',
  );
  assert.equal(
    sanitizeAuthUrl('http://localhost:3000/auth/callback#secret'),
    'http://localhost:3000/auth/callback',
  );
});

test('does not present missing template/configuration values as successful verification', () => {
  const unknown = summarizeAuthConfig({});
  assert.equal(unknown.signupEnabled, null);
  assert.equal(unknown.emailEnabled, null);
  assert.equal(unknown.mailerAutoconfirm, null);
  assert.equal(unknown.captchaEnabled, null);
  assert.equal(unknown.magicLink.enabled, null);
  assert.equal(
    summarizeAuthConfig({ external_email_magic_link_disabled: true }).magicLink.enabled,
    false,
  );
  assert.equal(summarizeAuthConfig({ security_captcha_enabled: true }).captchaEnabled, true);
  assert.equal(unknown.redirectPatternsReported, false);
  assert.equal(unknown.magicLink.templateMode, 'not_reported');
  assert.equal(unknown.magicLink.templateIncludesConfirmationUrl, null);
  assert.equal(
    summarizeAuthConfig({ mailer_templates_magic_link_content: null }).magicLink.templateMode,
    'provider_default',
  );
  assert.equal(
    summarizeAuthConfig({ mailer_templates_magic_link_content: '{{ .Token }}' }).magicLink
      .templateIncludesConfirmationUrl,
    false,
  );
  assert.equal(
    summarizeAuthConfig({
      mailer_templates_magic_link_content: '{{/* .ConfirmationURL */}} {{ .Token }}',
    }).magicLink.templateIncludesConfirmationUrl,
    false,
  );
  assert.equal(
    summarizeAuthConfig({ mailer_templates_magic_link_content: '{{- .ConfirmationURL | html -}}' })
      .magicLink.templateIncludesConfirmationUrl,
    true,
  );
  assert.equal(summarizeAuthConfig({ smtp_pass: '******' }).smtp.passwordMasked, true);
});

test('uses a read-only GET for the fixed project and reports no management credential', async () => {
  const calls = [];
  const result = await auditSupabaseAuthReadiness({
    env: { SUPABASE_ACCESS_TOKEN: 'private-management-token' },
    request: async (url, options) => {
      calls.push([url, options]);
      return response(fixture);
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], configUrl);
  assert.equal(calls[0][1].method, 'GET');
  assert.equal(calls[0][1].redirect, 'error');
  assert.equal(JSON.stringify(result).includes('private-management-token'), false);
  assert.equal(result.readError, undefined);
});

test('tries existing alternate Actions credentials only after authentication rejection', async () => {
  const tokens = [];
  const result = await auditSupabaseAuthReadiness({
    env: {
      SUPABASE_ACCESS_TOKEN: 'expired',
      SUPABASE_MANAGEMENT_API_KEY: 'expired',
      SUPABASE_TOKEN: 'valid',
    },
    request: async (url, options) => {
      assert.equal(url, configUrl);
      tokens.push(options.headers.Authorization);
      return options.headers.Authorization === 'Bearer valid'
        ? response(fixture)
        : response({}, 401);
    },
  });
  assert.deepEqual(tokens, ['Bearer expired', 'Bearer valid']);
  assert.equal(result.readError, undefined);
});

test('uses the existing encrypted-runtime read fallback without printing its returned token', async () => {
  const calls = [];
  const result = await auditSupabaseAuthReadiness({
    env: { SUPABASE_ACCESS_TOKEN: 'expired', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key' },
    request: async (url, options) => {
      calls.push([url, options]);
      if (url === secretUrl) {
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.body), { p_key: 'SUPABASE_ACCESS_TOKEN' });
        return response('private-runtime-token');
      }
      assert.equal(url, configUrl);
      assert.equal(options.method, 'GET');
      return options.headers.Authorization === 'Bearer private-runtime-token'
        ? response(fixture)
        : response({}, 401);
    },
  });
  assert.deepEqual(
    calls.map(([url]) => url),
    [configUrl, secretUrl, configUrl],
  );
  assert(calls.every(([, options]) => options.redirect === 'error'));
  assert.equal(result.readError, undefined);
  assert.equal(JSON.stringify(result).includes('private-'), false);
});

test('does not use credential fallback after a permission denial or rate limit', async () => {
  for (const status of [403, 429]) {
    let calls = 0;
    const result = await auditSupabaseAuthReadiness({
      env: {
        SUPABASE_ACCESS_TOKEN: 'one',
        SUPABASE_TOKEN: 'two',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      },
      request: async () => {
        calls++;
        return response({ secret: 'must-not-print' }, status);
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.readError, 'management_read_rejected');
    assert.equal(result.httpStatus, status);
    assert.equal(JSON.stringify(result).includes('must-not-print'), false);
  }
});

test('fails without management credentials instead of invoking a privileged fallback', async () => {
  let called = false;
  const result = await auditSupabaseAuthReadiness({
    env: { SUPABASE_SERVICE_ROLE_KEY: 'service' },
    request: async () => {
      called = true;
      throw new Error('unexpected');
    },
  });
  assert.equal(called, false);
  assert.equal(result.readError, 'management_token_unavailable');
});

test('sanitizes network/response failures and does not mistake invalid JSON shape for config', async () => {
  for (const request of [
    async () => {
      throw new Error('private-network-error token=secret');
    },
    async () => response(['private-invalid-body']),
    async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('private-json-body');
      },
    }),
  ]) {
    const result = await auditSupabaseAuthReadiness({
      env: { SUPABASE_ACCESS_TOKEN: 'secret' },
      request,
    });
    assert.equal(result.readError, 'management_read_unavailable');
    assert.equal(JSON.stringify(result).includes('private'), false);
  }
});

test('existing audit workflow retains its main-only production path and OAuth audit', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/audit-google-oauth-locations.yml', import.meta.url),
    'utf8',
  );
  assert.match(
    workflow,
    /if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /run: node scripts\/gcp\/audit-google-oauth-locations\.mjs/);
  assert.match(workflow, /run: node scripts\/gcp\/audit-supabase-auth-readiness\.mjs/);
  assert.match(workflow, /scripts\/gcp\/audit-supabase-auth-readiness\.test\.mjs/);
  assert.doesNotMatch(workflow, /--method PATCH|config push|mailer_autoconfirm: false/);
});
