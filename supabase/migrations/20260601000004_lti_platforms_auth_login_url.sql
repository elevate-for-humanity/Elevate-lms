-- Add auth_login_url to lti_platforms.
-- Required by /api/lti/login to redirect to the platform's OIDC authorization endpoint.
-- Also adds jwks_uri if not already present (needed by /api/lti/launch for JWKS verification).

alter table public.lti_platforms
  add column if not exists auth_login_url text,
  add column if not exists jwks_uri        text;

comment on column public.lti_platforms.auth_login_url is
  'Platform OIDC authorization endpoint — e.g. https://canvas.example.com/api/lti/authorize_redirect';

comment on column public.lti_platforms.jwks_uri is
  'Platform JWKS endpoint for JWT signature verification — e.g. https://canvas.example.com/api/lti/security/jwks';
