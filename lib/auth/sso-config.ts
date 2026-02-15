// SSO Configuration for SAML, OAuth, LDAP

type SAMLConfig = typeof samlConfig;
type GoogleOAuthConfig = typeof googleOAuthConfig;
type AzureADConfig = typeof azureADConfig;
type LDAPConfig = typeof ldapConfig;

export interface SSOConfig {
  provider: 'saml' | 'oauth' | 'ldap' | 'azure_ad' | 'google';
  enabled: boolean;
  config: SAMLConfig | GoogleOAuthConfig | AzureADConfig | LDAPConfig;
}

// SAML Configuration
export const samlConfig = {
  entryPoint: process.env.SAML_ENTRY_POINT || '',
  issuer: process.env.SAML_ISSUER || 'elevate-lms',
  callbackUrl:
    process.env.SAML_CALLBACK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/saml/callback`,
  cert: process.env.SAML_CERT || '',
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  wantAssertionsSigned: true,
  wantAuthnResponseSigned: true,
  signatureAlgorithm: 'sha256',
};

// Google OAuth Configuration
export const googleOAuthConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  scope: ['profile', 'email'],
};

// Azure AD Configuration
export const azureADConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/azure/callback`,
  allowHttpForRedirectUrl: process.env.NODE_ENV === 'development',
  responseType: 'code',
  responseMode: 'form_post',
  scope: ['profile', 'email', 'openid'],
};

// LDAP Configuration
export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  bindDN: process.env.LDAP_BIND_DN || '',
  bindCredentials: process.env.LDAP_BIND_PASSWORD || '',
  searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=com',
  searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
  searchAttributes: ['uid', 'mail', 'givenName', 'sn', 'cn'],
};

// Get SSO providers for tenant
export async function getTenantSSOProviders(
  tenantId: string
): Promise<SSOConfig[]> {
  // This would fetch from database
  // For now, return configured providers
  const providers: SSOConfig[] = [];

  if (process.env.SAML_ENABLED === 'true') {
    providers.push({
      provider: 'saml',
      enabled: true,
      config: samlConfig,
    });
  }

  if (process.env.GOOGLE_OAUTH_ENABLED === 'true') {
    providers.push({
      provider: 'google',
      enabled: true,
      config: googleOAuthConfig,
    });
  }

  if (process.env.AZURE_AD_ENABLED === 'true') {
    providers.push({
      provider: 'azure_ad',
      enabled: true,
      config: azureADConfig,
    });
  }

  if (process.env.LDAP_ENABLED === 'true') {
    providers.push({
      provider: 'ldap',
      enabled: true,
      config: ldapConfig,
    });
  }

  return providers;
}
