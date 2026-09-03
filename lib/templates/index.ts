/**
 * Template System for AI-Generated Sites
 *
 * Each template includes:
 * - Layout structure
 * - Font pairing
 * - Color schemes
 * - Component styles
 * - Industry fit
 */

export type TemplateId =
  | 'modern' // Clean, minimal, tech-forward
  | 'professional' // Corporate, trustworthy
  | 'bold' // High contrast, energetic
  | 'warm' // Friendly, approachable
  | 'academic' // Traditional, scholarly
  | 'industrial'; // Rugged, trade-focused

export type FontPairing = {
  heading: string;
  body: string;
  accent: string;
  googleFontsUrl: string;
};

export type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
};

export type LayoutStyle = {
  heroStyle: 'centered' | 'split' | 'fullwidth' | 'minimal' | 'video';
  navStyle: 'transparent' | 'solid' | 'floating' | 'minimal';
  cardStyle: 'elevated' | 'bordered' | 'flat' | 'gradient';
  buttonStyle: 'rounded' | 'pill' | 'square' | 'outline';
  spacing: 'compact' | 'normal' | 'spacious';
};

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  thumbnail: string;
  fonts: FontPairing;
  colorSchemes: {
    default: ColorScheme;
    alt1: ColorScheme;
    alt2: ColorScheme;
  };
  layout: LayoutStyle;
  bestFor: string[];
  industries: string[];
}

// ============================================
// FONT PAIRINGS
// ============================================

export const FONT_PAIRINGS: Record<string, FontPairing> = {
  modern: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'JetBrains Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap',
  },
  professional: {
    heading: 'Playfair Display',
    body: 'Source Sans Pro',
    accent: 'Source Sans Pro',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Source+Sans+Pro:wght@400;600;700&display=swap',
  },
  bold: {
    heading: 'Bebas Neue',
    body: 'Open Sans',
    accent: 'Open Sans',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap',
  },
  warm: {
    heading: 'Nunito',
    body: 'Nunito',
    accent: 'Nunito',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',
  },
  academic: {
    heading: 'Merriweather',
    body: 'Lato',
    accent: 'Lato',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Lato:wght@400;700&display=swap',
  },
  industrial: {
    heading: 'Oswald',
    body: 'Roboto',
    accent: 'Roboto Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@500&display=swap',
  },
};

// ============================================
// TEMPLATES
// ============================================

export const TEMPLATES: Record<TemplateId, Template> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines, minimal design, perfect for tech-forward organizations',
    thumbnail: '/templates/modern-thumb.jpg',
    fonts: FONT_PAIRINGS.modern,
    colorSchemes: {
      default: {
        primary: '#0f172a',
        secondary: '#3b82f6',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
      },
      alt1: {
        primary: '#18181b',
        secondary: '#8b5cf6',
        accent: '#a855f7',
        background: '#fafafa',
        surface: '#f4f4f5',
        text: '#18181b',
        textMuted: '#71717a',
      },
      alt2: {
        primary: '#022c22',
        secondary: '#10b981',
        accent: '#34d399',
        background: '#ffffff',
        surface: '#f0fdf4',
        text: '#022c22',
        textMuted: '#6b7280',
      },
    },
    layout: {
      heroStyle: 'minimal',
      navStyle: 'floating',
      cardStyle: 'elevated',
      buttonStyle: 'rounded',
      spacing: 'spacious',
    },
    bestFor: ['Tech companies', 'Startups', 'Digital agencies'],
    industries: ['Technology', 'Finance', 'Healthcare'],
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Trustworthy and established, ideal for institutions and enterprises',
    thumbnail: '/templates/professional-thumb.jpg',
    fonts: FONT_PAIRINGS.professional,
    colorSchemes: {
      default: {
        primary: '#1e3a5f',
        secondary: '#2563eb',
        accent: '#dc2626',
        background: '#ffffff',
        surface: '#f1f5f9',
        text: '#1e293b',
        textMuted: '#64748b',
      },
      alt1: {
        primary: '#14532d',
        secondary: '#15803d',
        accent: '#ca8a04',
        background: '#ffffff',
        surface: '#f7fee7',
        text: '#14532d',
        textMuted: '#4b5563',
      },
      alt2: {
        primary: '#4c1d95',
        secondary: '#7c3aed',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#faf5ff',
        text: '#1f2937',
        textMuted: '#6b7280',
      },
    },
    layout: {
      heroStyle: 'split',
      navStyle: 'solid',
      cardStyle: 'bordered',
      buttonStyle: 'square',
      spacing: 'normal',
    },
    bestFor: ['Universities', 'Government', 'Large enterprises'],
    industries: ['Education', 'Government', 'Finance', 'Healthcare'],
  },

  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'High-energy design with strong contrasts, great for youth programs',
    thumbnail: '/templates/bold-thumb.jpg',
    fonts: FONT_PAIRINGS.bold,
    colorSchemes: {
      default: {
        primary: '#000000',
        secondary: '#ef4444',
        accent: '#fbbf24',
        background: '#ffffff',
        surface: '#fef2f2',
        text: '#000000',
        textMuted: '#525252',
      },
      alt1: {
        primary: '#1e1b4b',
        secondary: '#4f46e5',
        accent: '#f97316',
        background: '#ffffff',
        surface: '#eef2ff',
        text: '#1e1b4b',
        textMuted: '#6366f1',
      },
      alt2: {
        primary: '#0c4a6e',
        secondary: '#0ea5e9',
        accent: '#22c55e',
        background: '#ffffff',
        surface: '#f0f9ff',
        text: '#0c4a6e',
        textMuted: '#64748b',
      },
    },
    layout: {
      heroStyle: 'fullwidth',
      navStyle: 'transparent',
      cardStyle: 'gradient',
      buttonStyle: 'pill',
      spacing: 'compact',
    },
    bestFor: ['Youth programs', 'Sports training', 'Creative industries'],
    industries: ['Entertainment', 'Sports', 'Hospitality'],
  },

  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Friendly and approachable, perfect for community organizations',
    thumbnail: '/templates/warm-thumb.jpg',
    fonts: FONT_PAIRINGS.warm,
    colorSchemes: {
      default: {
        primary: '#7c2d12',
        secondary: '#ea580c',
        accent: '#16a34a',
        background: '#fffbeb',
        surface: '#fef3c7',
        text: '#451a03',
        textMuted: '#78716c',
      },
      alt1: {
        primary: '#831843',
        secondary: '#db2777',
        accent: '#0d9488',
        background: '#fdf2f8',
        surface: '#fce7f3',
        text: '#500724',
        textMuted: '#9f1239',
      },
      alt2: {
        primary: '#365314',
        secondary: '#65a30d',
        accent: '#d97706',
        background: '#fefce8',
        surface: '#ecfccb',
        text: '#1a2e05',
        textMuted: '#4d7c0f',
      },
    },
    layout: {
      heroStyle: 'centered',
      navStyle: 'solid',
      cardStyle: 'elevated',
      buttonStyle: 'rounded',
      spacing: 'spacious',
    },
    bestFor: ['Nonprofits', 'Community colleges', 'Social services'],
    industries: ['Nonprofit', 'Education', 'Healthcare', 'Social Services'],
  },

  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional and scholarly, suited for educational institutions',
    thumbnail: '/templates/academic-thumb.jpg',
    fonts: FONT_PAIRINGS.academic,
    colorSchemes: {
      default: {
        primary: '#1e3a5f',
        secondary: '#1d4ed8',
        accent: '#b91c1c',
        background: '#fffef5',
        surface: '#fefce8',
        text: '#1c1917',
        textMuted: '#57534e',
      },
      alt1: {
        primary: '#14532d',
        secondary: '#166534',
        accent: '#b45309',
        background: '#fefdf5',
        surface: '#f7fee7',
        text: '#14532d',
        textMuted: '#4b5563',
      },
      alt2: {
        primary: '#4a1d96',
        secondary: '#6d28d9',
        accent: '#0891b2',
        background: '#faf5ff',
        surface: '#f3e8ff',
        text: '#2e1065',
        textMuted: '#7c3aed',
      },
    },
    layout: {
      heroStyle: 'split',
      navStyle: 'solid',
      cardStyle: 'bordered',
      buttonStyle: 'square',
      spacing: 'normal',
    },
    bestFor: ['Universities', 'Research institutions', 'Professional certifications'],
    industries: ['Education', 'Research', 'Professional Services'],
  },

  industrial: {
    id: 'industrial',
    name: 'Industrial',
    description: 'Rugged and practical, built for trade and vocational training',
    thumbnail: '/templates/industrial-thumb.jpg',
    fonts: FONT_PAIRINGS.industrial,
    colorSchemes: {
      default: {
        primary: '#1c1917',
        secondary: '#f97316',
        accent: '#eab308',
        background: '#fafaf9',
        surface: '#e7e5e4',
        text: '#1c1917',
        textMuted: '#57534e',
      },
      alt1: {
        primary: '#18181b',
        secondary: '#dc2626',
        accent: '#facc15',
        background: '#fafafa',
        surface: '#e4e4e7',
        text: '#18181b',
        textMuted: '#52525b',
      },
      alt2: {
        primary: '#0f172a',
        secondary: '#0284c7',
        accent: '#f59e0b',
        background: '#f8fafc',
        surface: '#e2e8f0',
        text: '#0f172a',
        textMuted: '#475569',
      },
    },
    layout: {
      heroStyle: 'fullwidth',
      navStyle: 'solid',
      cardStyle: 'flat',
      buttonStyle: 'square',
      spacing: 'compact',
    },
    bestFor: ['Trade schools', 'Apprenticeship programs', 'Manufacturing training'],
    industries: ['Manufacturing', 'Construction', 'Transportation', 'Energy'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get template recommendation based on industry and org type
 */
export function getRecommendedTemplate(industry: string, orgType: string): TemplateId {
  const industryLower = industry.toLowerCase();
  const orgTypeLower = orgType.toLowerCase();

  // Industry-based recommendations
  if (['technology', 'tech', 'software', 'it'].some((t) => industryLower.includes(t))) {
    return 'modern';
  }
  if (
    ['manufacturing', 'construction', 'hvac', 'electrical', 'plumbing', 'welding'].some((t) =>
      industryLower.includes(t),
    )
  ) {
    return 'industrial';
  }
  if (['healthcare', 'medical', 'nursing'].some((t) => industryLower.includes(t))) {
    return 'professional';
  }
  if (['education', 'university', 'college'].some((t) => industryLower.includes(t))) {
    return 'academic';
  }
  if (['nonprofit', 'community', 'social'].some((t) => industryLower.includes(t))) {
    return 'warm';
  }
  if (['sports', 'fitness', 'entertainment', 'youth'].some((t) => industryLower.includes(t))) {
    return 'bold';
  }

  // Org type fallbacks
  if (orgTypeLower.includes('workforce_board') || orgTypeLower.includes('government')) {
    return 'professional';
  }
  if (orgTypeLower.includes('nonprofit')) {
    return 'warm';
  }
  if (orgTypeLower.includes('apprenticeship')) {
    return 'industrial';
  }

  return 'modern'; // Default
}

/**
 * Get all templates as array
 */
export function getAllTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

/**
 * Get templates filtered by industry
 */
export function getTemplatesForIndustry(industry: string): Template[] {
  const industryLower = industry.toLowerCase();
  return Object.values(TEMPLATES).filter((t) =>
    t.industries.some((i) => i.toLowerCase().includes(industryLower)),
  );
}

/**
 * Generate CSS variables from color scheme
 */
export function generateCSSVariables(colors: ColorScheme): string {
  return `
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-text: ${colors.text};
    --color-text-muted: ${colors.textMuted};
  `;
}

/**
 * Generate Tailwind config overrides
 */
export function generateTailwindConfig(
  template: Template,
  colorScheme: 'default' | 'alt1' | 'alt2' = 'default',
) {
  const colors = template.colorSchemes[colorScheme];
  return {
    theme: {
      extend: {
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
        },
        fontFamily: {
          heading: [template.fonts.heading, 'sans-serif'],
          body: [template.fonts.body, 'sans-serif'],
          accent: [template.fonts.accent, 'monospace'],
        },
      },
    },
  };
}
