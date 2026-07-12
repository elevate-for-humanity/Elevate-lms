import { MetadataRoute } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const siteUrl = PLATFORM_DEFAULTS.siteUrl;

const imagePages = [
  {
    url: '/',
    images: [
      { url: '/images/hero-banner.webp', caption: 'Elevate Workforce Training Indianapolis' },
      { url: '/images/heroes/hero-homepage.webp', caption: 'Elevate for Humanity Workforce Development' },
    ],
  },
  {
    url: '/programs/healthcare',
    images: [
      { url: '/images/pages/healthcare-hero.webp', caption: 'Healthcare Training Programs' },
      { url: '/images/pages/cna-hero.jpg', caption: 'CNA Certification Training' },
      { url: '/images/healthcare/hero-program-medical-assistant.webp', caption: 'Medical Assistant Program' },
    ],
  },
  {
    url: '/programs/barber-apprenticeship',
    images: [
      { url: '/images/pages/barber-hero.webp', caption: 'Barber Apprenticeship Program' },
      { url: '/images/pages/barber-hero-main.webp', caption: 'Barber Training Indianapolis' },
    ],
  },
  {
    url: '/programs/hvac-technician',
    images: [
      { url: '/images/pages/hvac-hero.webp', caption: 'HVAC Technician Training' },
      { url: '/images/pexels/hvac.webp', caption: 'EPA 608 HVAC Certification' },
    ],
  },
  {
    url: '/apprenticeships',
    images: [
      { url: '/images/pages/apprenticeship-hero.webp', caption: 'Registered Apprenticeship Programs' },
    ],
  },
  {
    url: '/funding',
    images: [
      { url: '/images/pages/funding-hero.webp', caption: 'Workforce Training Funding Options' },
    ],
  },
  {
    url: '/testing',
    images: [
      { url: '/images/pages/testing-center-hero.webp', caption: 'Certification Testing Center' },
    ],
  },
];

export default function imageSitemap(): MetadataRoute.Sitemap {
  return imagePages.map((page) => ({
    url: `${siteUrl}${page.url}`,
    images: page.images.map((img) => ({
      url: `${siteUrl}${img.url}`,
      caption: img.caption,
      title: img.caption,
    })),
  }));
}
