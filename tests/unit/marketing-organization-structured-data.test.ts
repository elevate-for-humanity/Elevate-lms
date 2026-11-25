import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { organization } from '@/lib/config/organization';
import { siteConfig } from '@/lib/config/site';
import {
  ORGANIZATION_LOGO_URL,
  organizationJsonLd,
} from '@/lib/seo/marketing-organization-schema';

function readJpegDimensions(path: string) {
  const image = readFileSync(path);
  let offset = 2;

  while (offset < image.length) {
    const marker = image[offset + 1];
    const segmentLength = image.readUInt16BE(offset + 2);

    if (marker === 0xc0 || marker === 0xc2) {
      return {
        width: image.readUInt16BE(offset + 7),
        height: image.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength + 2;
  }

  throw new Error(`No JPEG dimensions found in ${path}`);
}

describe('marketing organization structured data', () => {
  it('publishes office-only fields on a Place location node', () => {
    expect(organizationJsonLd).not.toHaveProperty('geo');
    expect(organizationJsonLd).not.toHaveProperty('openingHours');
    expect(organizationJsonLd.location).toMatchObject({
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...organization.postalAddress,
      },
      geo: {
        '@type': 'GeoCoordinates',
        ...organization.geo,
      },
      openingHoursSpecification: [
        expect.objectContaining({
          '@type': 'OpeningHoursSpecification',
          opens: '09:00',
          closes: '17:00',
        }),
      ],
    });
  });

  it('describes the dimensions of the published logo asset', () => {
    const logoPath = join(
      process.cwd(),
      'public/images/Elevate_for_Humanity_logo_81bf0fab.jpg',
    );
    const dimensions = readJpegDimensions(logoPath);

    expect(organizationJsonLd.logo).toEqual({
      '@type': 'ImageObject',
      url: ORGANIZATION_LOGO_URL,
      contentUrl: ORGANIZATION_LOGO_URL,
      ...dimensions,
    });
  });

  it('uses Indianapolis local time instead of a fixed UTC offset', () => {
    expect(organization.timeZone).toBe('America/Indiana/Indianapolis');
    expect(siteConfig.hours.weekdays).toContain('ET');
    expect(siteConfig.hours.weekdays).not.toContain('EST');
  });
});
