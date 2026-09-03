/**
 * Production-Ready Template Designs
 *
 * Each template is a complete, polished design system
 */

export interface TemplateDesign {
  id: string;
  name: string;
  description: string;
  preview: string; // Preview image URL

  // Typography
  fonts: {
    heading: string;
    body: string;
    accent?: string;
    googleFontsUrl: string;
  };

  // Colors
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    textOnPrimary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };

  // Styling
  style: {
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
    buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient';
    cardStyle: 'flat' | 'elevated' | 'bordered' | 'glass';
    headerStyle: 'solid' | 'transparent' | 'blur';
    heroStyle: 'centered' | 'split' | 'fullscreen' | 'minimal' | 'angled';
    spacing: 'compact' | 'comfortable' | 'spacious';
  };

  // Best for
  industries: string[];
  orgTypes: string[];
}

export const TEMPLATE_DESIGNS: TemplateDesign[] = [
  // ============================================
  // 1. MODERN TECH
  // ============================================
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    description:
      'Clean, minimal design with subtle gradients. Perfect for tech-forward training providers.',
    preview: '/templates/modern-tech.jpg',
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      accent: 'JetBrains Mono',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap',
    },
    colors: {
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceAlt: '#f1f5f9',
      text: '#0f172a',
      textMuted: '#64748b',
      textOnPrimary: '#ffffff',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    style: {
      borderRadius: 'lg',
      shadows: 'subtle',
      buttonStyle: 'solid',
      cardStyle: 'elevated',
      headerStyle: 'blur',
      heroStyle: 'minimal',
      spacing: 'spacious',
    },
    industries: ['Technology', 'Software', 'IT', 'Digital Marketing'],
    orgTypes: ['Training Provider', 'Employer', 'Educational Institution'],
  },

  // ============================================
  // 2. PROFESSIONAL CORPORATE
  // ============================================
  {
    id: 'professional',
    name: 'Professional',
    description: 'Trustworthy and established. Ideal for workforce boards and government programs.',
    preview: '/templates/professional.jpg',
    fonts: {
      heading: 'Playfair Display',
      body: 'Source Sans 3',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap',
    },
    colors: {
      primary: '#1e3a5f',
      primaryDark: '#0f2744',
      secondary: '#2563eb',
      accent: '#dc2626',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceAlt: '#f1f5f9',
      text: '#1e293b',
      textMuted: '#64748b',
      textOnPrimary: '#ffffff',
      border: '#e2e8f0',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    style: {
      borderRadius: 'sm',
      shadows: 'medium',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      headerStyle: 'solid',
      heroStyle: 'split',
      spacing: 'comfortable',
    },
    industries: ['Government', 'Finance', 'Healthcare', 'Legal'],
    orgTypes: ['Workforce Board', 'Nonprofit', 'Educational Institution'],
  },

  // ============================================
  // 3. BOLD ENERGY
  // ============================================
  {
    id: 'bold-energy',
    name: 'Bold Energy',
    description:
      'High-contrast, energetic design. Great for youth programs and creative industries.',
    preview: '/templates/bold-energy.jpg',
    fonts: {
      heading: 'Space Grotesk',
      body: 'DM Sans',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap',
    },
    colors: {
      primary: '#000000',
      primaryDark: '#000000',
      secondary: '#ff3366',
      accent: '#ffcc00',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f5f5f5',
      text: '#000000',
      textMuted: '#666666',
      textOnPrimary: '#ffffff',
      border: '#e5e5e5',
      success: '#00cc66',
      warning: '#ffcc00',
      error: '#ff3366',
    },
    style: {
      borderRadius: 'none',
      shadows: 'dramatic',
      buttonStyle: 'solid',
      cardStyle: 'flat',
      headerStyle: 'transparent',
      heroStyle: 'fullscreen',
      spacing: 'compact',
    },
    industries: ['Creative', 'Entertainment', 'Sports', 'Fashion'],
    orgTypes: ['Training Provider', 'Employer'],
  },

  // ============================================
  // 4. WARM COMMUNITY
  // ============================================
  {
    id: 'warm-community',
    name: 'Warm Community',
    description: 'Friendly and approachable. Perfect for nonprofits and community organizations.',
    preview: '/templates/warm-community.jpg',
    fonts: {
      heading: 'Nunito',
      body: 'Nunito',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap',
    },
    colors: {
      primary: '#ea580c',
      primaryDark: '#c2410c',
      secondary: '#16a34a',
      accent: '#0891b2',
      background: '#fffbeb',
      surface: '#fef3c7',
      surfaceAlt: '#fde68a',
      text: '#451a03',
      textMuted: '#92400e',
      textOnPrimary: '#ffffff',
      border: '#fcd34d',
      success: '#16a34a',
      warning: '#f59e0b',
      error: '#dc2626',
    },
    style: {
      borderRadius: 'xl',
      shadows: 'subtle',
      buttonStyle: 'solid',
      cardStyle: 'elevated',
      headerStyle: 'solid',
      heroStyle: 'centered',
      spacing: 'spacious',
    },
    industries: ['Nonprofit', 'Education', 'Healthcare', 'Social Services'],
    orgTypes: ['Nonprofit', 'Training Provider', 'Educational Institution'],
  },

  // ============================================
  // 5. INDUSTRIAL TRADES
  // ============================================
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Rugged and practical. Built for trade schools and vocational training.',
    preview: '/templates/industrial.jpg',
    fonts: {
      heading: 'Oswald',
      body: 'Roboto',
      accent: 'Roboto Mono',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@500&display=swap',
    },
    colors: {
      primary: '#1c1917',
      primaryDark: '#0c0a09',
      secondary: '#f97316',
      accent: '#eab308',
      background: '#fafaf9',
      surface: '#f5f5f4',
      surfaceAlt: '#e7e5e4',
      text: '#1c1917',
      textMuted: '#57534e',
      textOnPrimary: '#ffffff',
      border: '#d6d3d1',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    },
    style: {
      borderRadius: 'sm',
      shadows: 'medium',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      headerStyle: 'solid',
      heroStyle: 'angled',
      spacing: 'compact',
    },
    industries: ['Manufacturing', 'Construction', 'Automotive', 'HVAC', 'Electrical', 'Plumbing'],
    orgTypes: ['Training Provider', 'Apprenticeship Sponsor', 'Employer'],
  },

  // ============================================
  // 6. HEALTHCARE CLEAN
  // ============================================
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Clean and trustworthy. Designed for medical and healthcare training.',
    preview: '/templates/healthcare.jpg',
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    },
    colors: {
      primary: '#0891b2',
      primaryDark: '#0e7490',
      secondary: '#06b6d4',
      accent: '#10b981',
      background: '#ffffff',
      surface: '#f0fdfa',
      surfaceAlt: '#ccfbf1',
      text: '#134e4a',
      textMuted: '#5eead4',
      textOnPrimary: '#ffffff',
      border: '#99f6e4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    style: {
      borderRadius: 'lg',
      shadows: 'subtle',
      buttonStyle: 'solid',
      cardStyle: 'elevated',
      headerStyle: 'blur',
      heroStyle: 'split',
      spacing: 'comfortable',
    },
    industries: ['Healthcare', 'Medical', 'Nursing', 'Dental', 'Pharmacy'],
    orgTypes: ['Training Provider', 'Educational Institution', 'Employer'],
  },

  // ============================================
  // 7. ACADEMIC CLASSIC
  // ============================================
  {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional and scholarly. Suited for universities and certification programs.',
    preview: '/templates/academic.jpg',
    fonts: {
      heading: 'Merriweather',
      body: 'Lato',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Lato:wght@400;700&display=swap',
    },
    colors: {
      primary: '#1e3a5f',
      primaryDark: '#0f2744',
      secondary: '#7c3aed',
      accent: '#b91c1c',
      background: '#fffef5',
      surface: '#fefce8',
      surfaceAlt: '#fef9c3',
      text: '#1c1917',
      textMuted: '#57534e',
      textOnPrimary: '#ffffff',
      border: '#fde047',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#b91c1c',
    },
    style: {
      borderRadius: 'sm',
      shadows: 'subtle',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      headerStyle: 'solid',
      heroStyle: 'centered',
      spacing: 'comfortable',
    },
    industries: ['Education', 'Research', 'Professional Certification', 'Law'],
    orgTypes: ['Educational Institution', 'Training Provider', 'Nonprofit'],
  },

  // ============================================
  // 8. STARTUP FRESH
  // ============================================
  {
    id: 'startup',
    name: 'Startup Fresh',
    description: 'Modern gradients and glass effects. Perfect for innovative training startups.',
    preview: '/templates/startup.jpg',
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
    },
    colors: {
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: '#faf5ff',
      surface: '#f3e8ff',
      surfaceAlt: '#e9d5ff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      textOnPrimary: '#ffffff',
      border: '#ddd6fe',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    style: {
      borderRadius: 'xl',
      shadows: 'medium',
      buttonStyle: 'gradient',
      cardStyle: 'glass',
      headerStyle: 'blur',
      heroStyle: 'centered',
      spacing: 'spacious',
    },
    industries: ['Technology', 'Startup', 'Digital', 'Innovation'],
    orgTypes: ['Training Provider', 'Employer'],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TemplateDesign | undefined {
  return TEMPLATE_DESIGNS.find((t) => t.id === id);
}

/**
 * Get recommended template based on industry and org type
 */
export function getRecommendedTemplate(industry: string, orgType: string): TemplateDesign {
  const industryLower = industry.toLowerCase();
  const orgTypeLower = orgType.toLowerCase();

  // Score each template
  const scored = TEMPLATE_DESIGNS.map((template) => {
    let score = 0;

    // Industry match
    template.industries.forEach((ind) => {
      if (industryLower.includes(ind.toLowerCase()) || ind.toLowerCase().includes(industryLower)) {
        score += 10;
      }
    });

    // Org type match
    template.orgTypes.forEach((org) => {
      if (orgTypeLower.includes(org.toLowerCase()) || org.toLowerCase().includes(orgTypeLower)) {
        score += 5;
      }
    });

    return { template, score };
  });

  // Sort by score and return best match
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.template || TEMPLATE_DESIGNS[0];
}

/**
 * Generate CSS custom properties from template
 */
export function generateCSSFromTemplate(template: TemplateDesign): string {
  const { colors, style } = template;

  const radiusMap = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  };

  return `
    --color-primary: ${colors.primary};
    --color-primary-dark: ${colors.primaryDark};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-surface-alt: ${colors.surfaceAlt};
    --color-text: ${colors.text};
    --color-text-muted: ${colors.textMuted};
    --color-text-on-primary: ${colors.textOnPrimary};
    --color-border: ${colors.border};
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --radius: ${radiusMap[style.borderRadius]};
    --font-heading: ${template.fonts.heading}, sans-serif;
    --font-body: ${template.fonts.body}, sans-serif;
  `;
}
