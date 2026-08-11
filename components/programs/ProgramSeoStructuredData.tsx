import type { ProgramSchema } from '@/lib/programs/program-schema';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { getVerifiedProgramFunding } from '@/lib/programs/funding-registry';
import { RAPIDS_CONFIG, isRAPIDSProgram } from '@/lib/compliance/rapids-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE = 'https://www.elevateforhumanity.org';

function isoDurationFromWeeks(weeks: number) {
  return Number.isFinite(weeks) && weeks > 0 ? `P${Math.round(weeks)}W` : undefined;
}

function totalProgramHours(program: ProgramSchema) {
  return Object.values(program.hoursBreakdown ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export default function ProgramSeoStructuredData({
  program,
  canonicalPath,
}: {
  program: ProgramSchema;
  canonicalPath?: string;
}) {
  const canonical = `${SITE}${canonicalPath ?? `/programs/${program.slug}`}`;
  const funding = getVerifiedProgramFunding(program.slug);
  const registered = isRAPIDSProgram(program.slug) ||
    program.complianceAlignment?.some((item) => /DOL Registered Apprenticeship/i.test(item.standard));
  const hostShops = FEATURED_BEAUTY_HOST_PARTNERS.filter((shop) => shop.programs.includes(program.slug));
  const cities = [...new Set(hostShops.map((shop) => shop.city))];
  const hours = totalProgramHours(program);
  const rapidsProgram = Object.values(RAPIDS_CONFIG.programs).find((item) => item.slug === program.slug);

  const provider = {
    '@type': 'EducationalOrganization',
    '@id': `${SITE}/#organization`,
    name: PLATFORM_DEFAULTS.orgName,
    legalName: `2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgLegalName}`,
    url: SITE,
  };

  const educationalProgram: Record<string, unknown> = {
    '@type': 'EducationalOccupationalProgram',
    '@id': `${canonical}#occupational-program`,
    name: program.title,
    description: program.metaDescription || program.subtitle,
    url: canonical,
    provider,
    programType: registered ? 'Registered Apprenticeship Program' : program.programType,
    timeToComplete: isoDurationFromWeeks(program.durationWeeks),
    occupationalCredentialAwarded: program.credentials?.[0]?.name,
    educationalCredentialAwarded: program.credentials?.map((credential) => credential.name),
    programPrerequisites: program.admissionRequirements,
    termsAvailable: program.schedule,
    occupationalCategory: program.category,
    areaServed: cities.length
      ? cities.map((city) => ({ '@type': 'City', name: `${city}, Indiana` }))
      : { '@type': 'State', name: 'Indiana' },
  };

  if (hours > 0) {
    educationalProgram.numberOfCredits = {
      '@type': 'StructuredValue',
      value: hours,
      unitText: 'training hours',
    };
  }

  if (rapidsProgram) {
    educationalProgram.identifier = [
      {
        '@type': 'PropertyValue',
        name: 'Registered Apprenticeship Sponsor Registration',
        value: RAPIDS_CONFIG.registrationId,
      },
      {
        '@type': 'PropertyValue',
        name: 'Registered Occupation Code',
        value: rapidsProgram.occupationCode,
      },
    ];
  }

  if (funding?.etplListedFor2Exclusive) {
    educationalProgram.offers = {
      '@type': 'Offer',
      category: 'Workforce training',
      description: funding.sourceNote,
      url: canonical,
    };
  } else if (program.selfPayCost) {
    const numericPrice = program.selfPayCost.replace(/[^0-9.]/g, '');
    if (numericPrice) {
      educationalProgram.offers = {
        '@type': 'Offer',
        category: program.programType === 'apprenticeship' ? 'Apprenticeship Program' : 'Career Training',
        price: numericPrice,
        priceCurrency: 'USD',
        url: canonical,
      };
    }
  }

  const courseSchema = {
    '@type': 'Course',
    '@id': `${canonical}#course`,
    name: program.title,
    description: program.metaDescription || program.subtitle,
    url: canonical,
    provider,
    educationalCredentialAwarded: program.credentials?.map((credential) => credential.name),
    courseMode:
      program.deliveryMode === 'online'
        ? 'online'
        : program.deliveryMode === 'hybrid'
          ? 'blended'
          : 'onsite',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode:
        program.deliveryMode === 'online'
          ? 'online'
          : program.deliveryMode === 'hybrid'
            ? 'blended'
            : 'onsite',
      courseWorkload: hours > 0 ? `PT${hours}H` : undefined,
    },
  };

  const faqSchema = program.faqs?.length
    ? {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: program.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Programs', item: `${SITE}/programs` },
      { '@type': 'ListItem', position: 3, name: program.title, item: canonical },
    ],
  };

  const graph = [educationalProgram, courseSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  );
}
