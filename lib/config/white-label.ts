/**
 * White Label Configuration
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 * 
 * Allows organizations to brand Elevate curriculum as their own.
 */

export interface WhiteLabelConfig {
  /** Organization name displayed throughout the platform */
  organizationName: string;
  
  /** Organization logo URL (header, login, etc.) */
  logoUrl: string;
  
  /** Favicon URL */
  faviconUrl: string;
  
  /** Primary brand color */
  primaryColor: string;
  
  /** Secondary brand color */
  secondaryColor: string;
  
  /** Accent color for highlights */
  accentColor: string;
  
  /** Primary text color */
  textColor: string;
  
  /** Background color */
  backgroundColor: string;
  
  /** Contact email for support */
  supportEmail: string;
  
  /** Website URL */
  websiteUrl: string;
  
  /** Privacy policy URL */
  privacyUrl: string;
  
  /** Terms of service URL */
  termsUrl: string;
  
  /** Footer text/copyright */
  footerText: string;
  
  /** Whether to show "Powered by Elevate" */
  showPoweredBy: boolean;
  
  /** Powered by text (if shown) */
  poweredByText: string;
  
  /** Social media links */
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  
  /** Custom CSS to inject */
  customCss?: string;
  
  /** Custom domain */
  domain?: string;
  
  /** Accreditation body to display */
  accreditationBody?: string;
  
  /** Program-specific overrides */
  programs?: Record<string, ProgramOverride>;
}

export interface ProgramOverride {
  title?: string;
  description?: string;
  heroImage?: string;
  instructorName?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

/** Default Elevate configuration */
export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  organizationName: 'Elevate for Humanity',
  logoUrl: '/images/elevate-logo.svg',
  faviconUrl: '/favicon.ico',
  primaryColor: '#0ea5e9',
  secondaryColor: '#06b6d4',
  accentColor: '#f59e0b',
  textColor: '#1e293b',
  backgroundColor: '#ffffff',
  supportEmail: 'support@elevate.example',
  websiteUrl: 'https://elevate.example',
  privacyUrl: '/privacy',
  termsUrl: '/terms',
  footerText: '© 2026 Elevate for Humanity. All Rights Reserved.',
  showPoweredBy: true,
  poweredByText: 'Powered by Elevate Course Factory',
};

/** Load white label config based on domain or org ID */
export async function getWhiteLabelConfig(
  domainOrOrgId?: string
): Promise<WhiteLabelConfig> {
  // In production, this would fetch from database
  // For now, return default
  if (!domainOrOrgId) {
    return DEFAULT_WHITE_LABEL;
  }
  
  // Mock: Return configured org or default
  // In production: fetch from white_label_configs table
  const configs: Record<string, WhiteLabelConfig> = {
    // Example: White label for a workforce board
    'workforce-board': {
      organizationName: 'County Workforce Board',
      logoUrl: '/images/workforce-board-logo.svg',
      faviconUrl: '/favicon.ico',
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      accentColor: '#fbbf24',
      textColor: '#1e293b',
      backgroundColor: '#f8fafc',
      supportEmail: 'training@workforce-board.example',
      websiteUrl: 'https://workforce-board.example',
      privacyUrl: '/privacy',
      termsUrl: '/terms',
      footerText: '© 2026 County Workforce Board',
      showPoweredBy: true,
      poweredByText: 'Powered by Elevate',
    },
    
    // Example: White label for a salon association
    'barber-association': {
      organizationName: 'State Barber Association',
      logoUrl: '/images/barber-association-logo.svg',
      faviconUrl: '/favicon.ico',
      primaryColor: '#ea580c',
      secondaryColor: '#f97316',
      accentColor: '#fbbf24',
      textColor: '#1e293b',
      backgroundColor: '#fffbeb',
      supportEmail: 'training@barber-association.example',
      websiteUrl: 'https://barber-association.example',
      privacyUrl: '/privacy',
      termsUrl: '/terms',
      footerText: '© 2026 State Barber Association',
      showPoweredBy: true,
      poweredByText: 'Powered by Elevate Course Factory',
      accreditationBody: 'Approved by State Barber Board',
      programs: {
        'barber-apprenticeship': {
          title: 'State Barber Apprenticeship Program',
          description: 'Complete 2,000 hours to earn your Indiana Barber License',
          instructorName: 'Master Barber Instructor',
        },
      },
    },
  };
  
  return configs[domainOrOrgId] || DEFAULT_WHITE_LABEL;
}

/** Apply white label styles to document */
export function applyWhiteLabelStyles(config: WhiteLabelConfig): string {
  const poweredBy = config.showPoweredBy
    ? `<span class="powered-by">${config.poweredByText}</span>`
    : '';
  
  return `
    :root {
      --wl-primary: ${config.primaryColor};
      --wl-secondary: ${config.secondaryColor};
      --wl-accent: ${config.accentColor};
      --wl-text: ${config.textColor};
      --wl-bg: ${config.backgroundColor};
    }
    
    .wl-organization-name { color: var(--wl-primary); }
    .wl-powered-by { color: var(--wl-text); opacity: 0.7; }
    
    ${config.customCss || ''}
  `;
}

/** Generate PDF export with white label */
export interface PDFExportConfig {
  whiteLabel: WhiteLabelConfig;
  documentTitle: string;
  programName: string;
  includeFooter: boolean;
  includePageNumbers: boolean;
}

export function getPDFExportConfig(
  config: WhiteLabelConfig,
  programName: string
): PDFExportConfig {
  return {
    whiteLabel: config,
    documentTitle: `${config.organizationName} - ${programName}`,
    programName,
    includeFooter: true,
    includePageNumbers: true,
  };
}
