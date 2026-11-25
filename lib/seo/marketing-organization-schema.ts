import { organization } from '@/lib/config/organization';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const MARKETING_SITE_URL = 'https://www.elevateforhumanity.org';
export const ORGANIZATION_LOGO_URL =
  `${MARKETING_SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

const telephoneDigits = organization.phone.replace(/\D/g, '');
const telephone = telephoneDigits.startsWith('1')
  ? `+${telephoneDigits}`
  : `+1${telephoneDigits}`;

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  '@id': `${MARKETING_SITE_URL}/#organization`,
  name: PLATFORM_DEFAULTS.orgName,
  alternateName: PLATFORM_DEFAULTS.orgLegalName,
  legalName: organization.legalName,
  url: MARKETING_SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: ORGANIZATION_LOGO_URL,
    contentUrl: ORGANIZATION_LOGO_URL,
    width: 720,
    height: 1080,
  },
  image: ORGANIZATION_LOGO_URL,
  telephone,
  email: organization.email,
  address: {
    '@type': 'PostalAddress',
    ...organization.postalAddress,
  },
  location: {
    '@type': 'Place',
    '@id': `${MARKETING_SITE_URL}/#indianapolis-office`,
    name: `${PLATFORM_DEFAULTS.orgName} Indianapolis Office`,
    address: {
      '@type': 'PostalAddress',
      ...organization.postalAddress,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...organization.geo,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: organization.hours.openingHours.dayOfWeek.map(
          (day) => `https://schema.org/${day}`,
        ),
        opens: organization.hours.openingHours.opens,
        closes: organization.hours.openingHours.closes,
      },
    ],
  },
  sameAs: [
    'https://www.facebook.com/61578240192934/',
    'https://linkedin.com/company/elevate-for-humanity',
    'https://instagram.com/elevateforhumanity',
    'https://www.youtube.com/@elevateforhumanity',
  ],
  description:
    'Career and technical education provider connecting learners with training, registered apprenticeships, testing and credential pathways, workforce funding navigation, employers, and supportive services.',
  knowsAbout: [
    'Registered Apprenticeship',
    'Career and Technical Training',
    'Barber and Beauty Apprenticeships',
    'HVAC Training',
    'Commercial Driver Training',
    'Business and Entrepreneurship Training',
    'Testing and Proctoring',
    'Credentialing',
    'Workforce Development',
    'Work-Based Learning',
    'WIOA',
    'Employer Services',
  ],
} as const;
