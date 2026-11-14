import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// Central config for the Elevate mobile app(s).
// This is what the mobile manifest route exposes.

export interface MobileProgramSummary {
  programId: string;
  label: string;
  category:
    | 'healthcare'
    | 'skilled-trades'
    | 'beauty'
    | 'business'
    | 'transportation'
    | 'community'
    | 'other';
  primaryCourseSlug?: string;
  allowMobileLessons: boolean;
  allowNotifications: boolean;
}

export interface MobileAppConfig {
  appName: string;
  bundleIdAndroid?: string;
  bundleIdIos?: string;
  minVersion: string;
  recommendedVersion: string;
  supportEmail?: string;
  programs: MobileProgramSummary[];
}

export const mobileAppConfig: MobileAppConfig = {
  appName: 'Elevate for Humanity',
  bundleIdAndroid: 'org.elevateforhumanity.app',
  bundleIdIos: 'org.elevateforhumanity.app',
  minVersion: '1.0.0',
  recommendedVersion: '1.0.0',
  supportEmail: 'support@www.elevateforhumanity.org',
  programs: [
    {
      programId: 'prog-cna',
      label: 'CNA Training',
      category: 'healthcare',
      primaryCourseSlug: 'job-ready-indy-core',
      allowMobileLessons: true,
      allowNotifications: true,
    },
    {
      programId: 'prog-barber',
      label: 'Barber Apprenticeship',
      category: 'beauty',
      primaryCourseSlug: 'barber-apprentice-foundations',
      allowMobileLessons: true,
      allowNotifications: true,
    },
    {
      programId: 'prog-tax-vita',
      label: 'Tax & VITA Track',
      category: 'community',
      primaryCourseSlug: 'tax-vita-onramp',
      allowMobileLessons: true,
      allowNotifications: true,
    },
    {
      programId: 'prog-hvac',
      label: 'HVAC Technician Pathway',
      category: 'skilled-trades',
      primaryCourseSlug: 'hvac-tech-foundations',
      allowMobileLessons: true,
      allowNotifications: true,
    },
    {
      programId: 'prog-cdl',
      label: 'CDL Training',
      category: 'transportation',
      primaryCourseSlug: 'cdl-eldt-core',
      allowMobileLessons: true,
      allowNotifications: true,
    },
  ],
};
