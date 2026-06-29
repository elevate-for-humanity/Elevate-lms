'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface EnvEntry {
  key: string;
  value: string;
  is_secret: boolean;
  updated_at?: string;
}

interface ServiceGroup {
  label: string;
  keys: string[];
}

// ── Service groups ────────────────────────────────────────────────────────────

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    label: 'Supabase',
    keys: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_URL',
      'SUPABASE_PROJECT_REF',
      'DATABASE_URL',
      'POSTGRES_URL',
      'POSTGRES_PASSWORD',
    ],
  },
  {
    label: 'Email — Resend',
    keys: [
      'RESEND_API_KEY',
      'RESEND_WEBHOOK_SECRET',
      'EMAIL_FROM',
      'EMAIL_REPLY_TO',
      'EMAIL_PROVIDER',
    ],
  },
  {
    label: 'Email — SendGrid',
    keys: ['SENDGRID_API_KEY', 'SENDGRID_KEY', 'SENDGRID_FROM'],
  },
  {
    label: 'Email — SMTP',
    keys: [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_PASSWORD',
      'SMTP_FROM',
      'MAIL_FROM',
      'MAIL_TO_ADMIN',
    ],
  },
  {
    label: 'Stripe',
    keys: [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_RESTRICTED_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_WEBHOOK_SECRET_BARBER',
      'STRIPE_WEBHOOK_SECRET_BOOTH',
      'STRIPE_WEBHOOK_SECRET_CAREER_COURSES',
      'STRIPE_WEBHOOK_SECRET_DONATIONS',
      'STRIPE_WEBHOOK_SECRET_LICENSE',
      'STRIPE_WEBHOOK_SECRET_LICENSES',
      'STRIPE_WEBHOOK_SECRET_STORE',
      'STRIPE_WEBHOOK_SECRET_TAX',
      'STRIPE_TESTING_WEBHOOK_SECRET',
      'STRIPE_IDENTITY_WEBHOOK_SECRET',
      'STRIPE_PMC_BARBER_TEST',
      'STRIPE_PRICES_JSON',
      'STRIPE_PRICE_CR_ENTERPRISE',
      'STRIPE_PRICE_CR_GUIDE',
      'STRIPE_REFRESH_URL',
      'STRIPE_RETURN_URL',
    ],
  },
  {
    // Primary AI providers — devstudio, AI assistant, and onboarding flows use these.
    // GROQ_API_KEY is the primary (free tier available). GEMINI_API_KEY is the fallback.
    // At least one must be set for natural-language commands to work.
    label: 'AI Providers (required for AI features)',
    keys: [
      'GROQ_API_KEY',
      'GEMINI_API_KEY',
      'AI_PROVIDER',
    ],
  },
  {
    label: 'OpenAI',
    keys: ['OPENAI_API_KEY', 'AI_IMAGE_PROVIDER'],
  },
  {
    label: 'Azure OpenAI',
    keys: [
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_DEPLOYMENT',
      'AZURE_OPENAI_API_VERSION',
      'AZURE_DALLE_DEPLOYMENT',
    ],
  },
  {
    label: 'Google',
    keys: [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'GOOGLE_CLOUD_API_KEY',
      'GOOGLE_MAPS_API_KEY',
      'GOOGLE_TAG_MANAGER_ID',
      'GOOGLE_SITE_VERIFICATION',
      'NEXT_PUBLIC_GA_MEASUREMENT_ID',
      'GOOGLE_OAUTH_ENABLED',
      'VITE_GOOGLE_ANALYTICS_ID',
    ],
  },
  {
    label: 'Twilio',
    keys: [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE',
      'TWILIO_PHONE_NUMBER',
      'TWILIO_SID',
    ],
  },
  {
    label: 'Cloudflare R2',
    keys: [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_ENDPOINT',
      'CLOUDFLARE_R2_PUBLIC_URL',
      'CLOUDFLARE_STREAM_API_TOKEN',
      'R2_ACCESS_KEY',
      'R2_SECRET_KEY',
      'R2_BUCKET',
      'R2_ENDPOINT',
      'NEXT_PUBLIC_R2_URL',
    ],
  },
  {
    label: 'Northflank',
    keys: [
      'NORTHFLANK_API_TOKEN',
      'NORTHFLANK_TEAM_ID',
      'NORTHFLANK_PROJECT_ID',
      'NORTHFLANK_LMS_SERVICE_ID',
      'NORTHFLANK_ADMIN_SERVICE_ID',
      'NORTHFLANK_SECRET_GROUP_ID',
      'NORTHFLANK_DEPLOYMENT_PLAN',
      'NORTHFLANK_BUILD_PLAN',
    ],
  },
  {
    label: 'GitHub',
    keys: [
      'GITHUB_TOKEN',
      'GITHUB_OAUTH_CLIENT_ID',
      'GITHUB_OAUTH_CLIENT_SECRET',
      'NEXT_PUBLIC_GITHUB_ENABLED',
    ],
  },
  {
    label: 'Upstash Redis',
    keys: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_URL'],
  },
  {
    label: 'Video — D-ID',
    keys: ['DID_API_KEY'],
  },
  {
    label: 'Video — HeyGen / Synthesia',
    keys: ['SYNTHESIA_API_KEY', 'HEYGEN_API_KEY'],
  },
  {
    label: 'Video — Runway / Suno',
    keys: ['RUNWAY_API_KEY', 'SUNO_API_KEY'],
  },
  {
    label: 'ElevenLabs',
    keys: ['ELEVENLABS_API_KEY', 'NEXT_PUBLIC_ELEVENLABS_API_KEY'],
  },
  {
    label: 'Image Generation',
    keys: [
      'STABILITY_API_KEY',
      'STABILITY_API_HOST',
      'PEXELS_API_KEY',
      'PIXABAY_API_KEY',
      'UNSPLASH_ACCESS_KEY',
      'DURABLE_API_KEY',
    ],
  },
  {
    label: 'Social Media',
    keys: [
      'FACEBOOK_ACCESS_TOKEN',
      'FACEBOOK_CLIENT_ID',
      'FACEBOOK_CLIENT_SECRET',
      'FACEBOOK_PAGE_ID',
      'FACEBOOK_PAGE_1_ID',
      'FACEBOOK_PAGE_1_TOKEN',
      'FACEBOOK_PAGE_2_ID',
      'FACEBOOK_PAGE_2_TOKEN',
      'NEXT_PUBLIC_FACEBOOK_APP_ID',
      'NEXT_PUBLIC_FACEBOOK_PIXEL_ID',
      'INSTAGRAM_ACCESS_TOKEN',
      'INSTAGRAM_BUSINESS_ACCOUNT_ID',
      'LINKEDIN_ACCESS_TOKEN',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'LINKEDIN_COMPANY_ID',
      'LINKEDIN_ORGANIZATION_ID',
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'TWITTER_BEARER_TOKEN',
      'YOUTUBE_API_KEY',
      'YOUTUBE_ACCESS_TOKEN',
      'YOUTUBE_CHANNEL_ID',
    ],
  },
  {
    label: 'HubSpot',
    keys: [
      'HUBSPOT_API_KEY',
      'HUBSPOT_PORTAL_ID',
      'HUBSPOT_FORM_GUID',
      'HUBSPOT_PRIVATE_APP_TOKEN',
    ],
  },
  {
    label: 'Salesforce',
    keys: [
      'SALESFORCE_CLIENT_ID',
      'SALESFORCE_CLIENT_SECRET',
      'SALESFORCE_INSTANCE_URL',
      'SALESFORCE_LOGIN_URL',
      'SALESFORCE_USERNAME',
      'SALESFORCE_PASSWORD',
      'SALESFORCE_SECURITY_TOKEN',
      'SALESFORCE_API_KEY',
    ],
  },
  {
    label: 'Zoom',
    keys: [
      'ZOOM_ACCOUNT_ID',
      'ZOOM_CLIENT_ID',
      'ZOOM_CLIENT_SECRET',
      'ZOOM_ACCESS_TOKEN',
      'ZOOM_USER_ID',
    ],
  },
  {
    label: 'Mailchimp',
    keys: ['MAILCHIMP_API_KEY', 'MAILCHIMP_AUDIENCE_ID', 'MAILCHIMP_SERVER_PREFIX'],
  },
  {
    label: 'Sentry',
    keys: [
      'SENTRY_DSN',
      'SENTRY_AUTH_TOKEN',
      'SENTRY_ORG',
      'SENTRY_PROJECT',
      'NEXT_PUBLIC_SENTRY_DSN',
    ],
  },
  {
    label: 'Sezzle / Affirm',
    keys: [
      'SEZZLE_PUBLIC_KEY',
      'SEZZLE_PRIVATE_KEY',
      'SEZZLE_ENVIRONMENT',
      'SEZZLE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_SEZZLE_PUBLIC_KEY',
      'NEXT_PUBLIC_SEZZLE_MERCHANT_ID',
      'NEXT_PUBLIC_SEZZLE_ENVIRONMENT',
      'AFFIRM_PUBLIC_KEY',
      'AFFIRM_PRIVATE_KEY',
      'AFFIRM_PRIVATE_API_KEY',
      'AFFIRM_API_URL',
      'AFFIRM_BASE_URL',
      'AFFIRM_ENVIRONMENT',
      'AFFIRM_WEBHOOK_SECRET',
      'NEXT_PUBLIC_AFFIRM_PUBLIC_KEY',
    ],
  },
  {
    label: 'IRS / Tax (MeF)',
    keys: [
      'IRS_EFIN',
      'IRS_SOFTWARE_ID',
      'IRS_ENVIRONMENT',
      'IRS_CERT_PATH',
      'IRS_KEY_PATH',
      'IRS_CA_PATH',
      'IRS_CERT_PASSPHRASE',
      'IRS_MONITOR_EMAIL_RECIPIENTS',
      'IRS_MONITOR_WEBHOOK_URL',
      'IRS_MONITOR_WEBHOOK_TYPE',
      'EPS_API_KEY',
      'EPS_API_URL',
      'EPS_ACCOUNT_NUMBER',
      'EPS_EFILE_PASSWORD',
      'EPS_SERIAL_NUMBER',
    ],
  },
  {
    label: 'WIOA / Workforce',
    keys: [
      'WIOA_REPORTING_API_KEY',
      'WIOA_REPORTING_URL',
      'INDIANA_DWD_API_KEY',
      'INDIANA_DWD_API_URL',
      'JRI_API_KEY',
      'JRI_API_BASE_URL',
      'JRI_ORGANIZATION_ID',
    ],
  },
  {
    label: 'RAPIDS / Apprenticeship',
    keys: [
      'RAPIDS_REGISTRATION_ID',
      'NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER',
      'NEXT_PUBLIC_RAPIDS_SPONSOR_NAME',
      'NEXT_PUBLIC_RTI_PROVIDER_ID',
    ],
  },
  {
    label: 'Credentialing',
    keys: [
      'NHA_ACCOUNT_NUMBER',
      'NHA_PORTAL_URL',
      'CREDLY_API_KEY',
      'CREDLY_ORGANIZATION_ID',
      'CERTIPORT_API_KEY',
      'CERTIPORT_API_SECRET',
      'CERTIPORT_API_BASE_URL',
      'CERTIPORT_ORGANIZATION_ID',
      'CAREERSAFE_API_KEY',
      'CAREERSAFE_API_SECRET',
      'CAREERSAFE_API_BASE_URL',
      'CAREERSAFE_ORGANIZATION_ID',

      'NDS_API_KEY',
      'NDS_API_SECRET',
      'NDS_API_BASE_URL',
      'NDS_ORGANIZATION_ID',
      'NRF_API_KEY',
      'NRF_API_SECRET',
      'NRF_API_BASE_URL',
      'NRF_ORGANIZATION_ID',
      'HSI_API_KEY',
      'HSI_API_SECRET',
      'HSI_API_BASE_URL',
      'HSI_ORGANIZATION_ID',
    ],
  },
  {
    label: 'Grants',
    keys: ['GRANTS_GOV_API_KEY', 'SAM_GOV_API_KEY', 'SSA_API_KEY'],
  },
  {
    label: 'Push Notifications',
    keys: [
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    ],
  },
  {
    label: 'Auth / SSO',
    keys: [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'AZURE_AD_ENABLED',
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET',
      'AZURE_TENANT_ID',
      'SAML_ENABLED',
      'SAML_ENTRY_POINT',
      'SAML_ISSUER',
      'SAML_CERT',
      'SAML_CALLBACK_URL',
      'LDAP_ENABLED',
      'LDAP_URL',
      'LDAP_BIND_DN',
      'LDAP_BIND_PASSWORD',
      'LDAP_SEARCH_BASE',
      'LDAP_SEARCH_FILTER',
      'WORKOS_API_KEY',
      'GOOGLE_OAUTH_ENABLED',
    ],
  },
  {
    label: 'Security',
    keys: [
      'SSN_ENCRYPTION_KEY',
      'SSN_SALT',
      'IP_HASH_SALT',
      'LOG_SALT',
      'AUDIT_SECRET',
      'CRON_SECRET',
      'INTERNAL_CRON_SECRET',
      'INTERNAL_CRON_TOKEN',
      'INTERNAL_API_KEY',
      'INTERNAL_API_TOKEN',
      'DEPLOY_TOKEN_KEY',
      'TURNSTILE_SECRET_KEY',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'NEXT_PUBLIC_HCAPTCHA_SITE_KEY',
      'SECURITY_EMAIL',
      'SECURITY_PHONE',
      'SECURITY_WEBHOOK_URL',
      'SIEM_API_KEY',
      'SIEM_ENDPOINT',
      'SLACK_SECURITY_WEBHOOK',
      'SLACK_ALERT_WEBHOOK',
      'SLACK_WEBHOOK_URL',
    ],
  },
  {
    label: 'Admin',
    keys: [
      'ADMIN_EMAIL',
      'ADMIN_ALERT_EMAIL',
      'ALERT_EMAIL',
      'ALERT_EMAIL_TO',
      'ADMIN_API_KEY',
      'ADMIN_API_SECRET',
      'ADMIN_TEST_EMAIL_TOKEN',
      'ADMIN_IP_ALLOWLIST',
      'ADMIN_SMS_GATEWAY',
      'LICENSE_SECRET',
      'LICENSING_MODE',
      'LICENSE_NOTIFICATION_EMAIL',
      'ENABLE_ADMIN_DEVTOOLS',
      'ENABLE_AUDIT_LOGGING',
      'ENABLE_TEST_LOGGING',
    ],
  },
  {
    label: 'Organization Identity',
    keys: [
      'NEXT_PUBLIC_ORG_NAME',
      'NEXT_PUBLIC_ORG_LEGAL_NAME',
      'NEXT_PUBLIC_SUPPORT_EMAIL',
      'NEXT_PUBLIC_SUPPORT_PHONE',
      'NEXT_PUBLIC_EMAIL_FROM_NAME',
      'NEXT_PUBLIC_EMAIL_FROM_ADDRESS',
      'NEXT_PUBLIC_CERT_HOLDER',
      'NEXT_PUBLIC_CANONICAL_DOMAIN',
    ],
  },
  {
    label: 'Site / App',
    keys: [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_URL',
      'NODE_ENV',
      'APP_VERSION',
      'BUILD_ID',
      'ROBOTS_NOINDEX',
      'DEMO_MODE',
      'DEMO_ALLOW_IN_PROD',
      'DEMO_TENANT_SLUG',
      'NEXT_PUBLIC_CDN_DOMAIN',
      'NEXT_PUBLIC_SCORM_CDN_URL',
      'NEXT_PUBLIC_VIMEO_BASE_URL',
      'NEXT_PUBLIC_STUDIO_API_URL',
      'NEXT_PUBLIC_CONTAINER_API_URL',
      'NEXT_PUBLIC_COLLABORATION_WS_URL',
      'TERMINAL_WS_URL',
      'LOG_ENDPOINT',
    ],
  },
  {
    label: 'Calendly / Scheduling',
    keys: ['NEXT_PUBLIC_CALENDLY_URL', 'NEXT_PUBLIC_CALENDLY_30MIN', 'CALENDLY_WEBHOOK_SECRET'],
  },
  {
    label: 'Zendesk / Support',
    keys: [
      'ZENDESK_API_TOKEN',
      'ZENDESK_EMAIL',
      'ZENDESK_SUBDOMAIN',
      'NEXT_PUBLIC_ZENDESK_KEY',
      'NEXT_PUBLIC_INTERCOM_APP_ID',
      'NEXT_PUBLIC_TAWK_PROPERTY_ID',
      'NEXT_PUBLIC_TAWK_WIDGET_ID',
      'NEXT_PUBLIC_TIDIO_KEY',
    ],
  },
  {
    label: 'Zapier / Webhooks',
    keys: [
      'ZAPIER_WEBHOOK_URL',
      'TEAMS_WEBHOOK_URL',
      'PARTNER_WEBHOOK_SECRET',
      'PROVISIONING_WEBHOOK_SECRET',
      'JOTFORM_API_KEY',
      'JOTFORM_FORM_ID',
      'JOTFORM_WEBHOOK_SECRET',
    ],
  },
  {
    label: 'Mapbox / Location',
    keys: ['MAPBOX_ACCESS_TOKEN', 'GOOGLE_MAPS_API_KEY'],
  },
  {
    label: 'SCORM / xAPI',
    keys: [
      'SCORM_APP_ID',
      'SCORM_SECRET_KEY',
      'XAPI_USERNAME',
      'XAPI_PASSWORD',
      'NEXT_PUBLIC_XAPI_ENDPOINT',
      'LTI_PUBLIC_KEY_N',
      'LTI_TOOL_URL',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function EnvManagerClient() {
  const [settings, setSettings] = useState<Record<string, EnvEntry>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/env-vars');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load');
        return;
      }
      const map: Record<string, EnvEntry> = {};
      for (const row of data.settings ?? []) map[row.key] = row;
      setSettings(map);
    } catch {
      setError('Network error loading settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const entries = Object.entries(edits)
      .filter(([, v]) => v !== '')
      .map(([key, value]) => ({ key, value }));
    if (!entries.length) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Save failed');
        return;
      }
      setEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch {
      setError('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  const toggleReveal = (key: string) => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));

  const dirtyCount = Object.values(edits).filter((v) => v !== '').length;

  const filteredGroups = SERVICE_GROUPS.map((g) => ({
    ...g,
    keys: g.keys.filter((k) => !search || k.toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.keys.length > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integration Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            API keys, tokens, and service credentials. Secrets are masked after saving.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* Status banners */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-4 text-sm">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search settings…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading settings…</div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(group.label)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800 text-sm">{group.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{group.keys.length} keys</span>
                  {expanded[group.label] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {expanded[group.label] && (
                <div className="divide-y divide-slate-100">
                  {group.keys.map((key) => {
                    const entry = settings[key];
                    const editVal = edits[key] ?? '';
                    const displayVal = entry?.value ?? '';
                    const isDirty = editVal !== '';
                    const isSecret = entry?.is_secret ?? true;
                    const show = revealed[key];

                    return (
                      <div
                        key={key}
                        className={`px-4 py-3 ${isDirty ? 'bg-amber-50' : 'bg-white'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <code className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {key}
                              </code>
                              {isSecret && (
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  secret
                                </span>
                              )}
                              {isDirty && (
                                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                  unsaved
                                </span>
                              )}
                              {entry?.updated_at && (
                                <span className="text-xs text-slate-400">
                                  updated {new Date(entry.updated_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type={isSecret && !show ? 'password' : 'text'}
                                value={editVal || (show ? displayVal : '')}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder={displayVal || `Enter ${key}`}
                                className="flex-1 text-sm font-mono border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                              />
                              {isSecret && (
                                <button
                                  onClick={() => toggleReveal(key)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                  title={show ? 'Hide' : 'Reveal'}
                                >
                                  {show ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
