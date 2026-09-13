import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'Elevate for Humanity Career & Technical Institute',
  description = 'Career training, registered apprenticeship support, testing, and workforce services in Indianapolis, Indiana.',
  keywords = 'workforce development, career training, apprenticeships, testing, Indianapolis',
  image = 'https://www.elevateforhumanity.org/og-image.svg',
  url = 'https://www.elevateforhumanity.org',
  type = 'website',
}) {
  const fullTitle = title.includes('Elevate for Humanity')
    ? title
    : `${title} | Elevate for Humanity`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Elevate for Humanity" />
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Elevate for Humanity" />
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      {/* Schema.org markup - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'Elevate for Humanity Career & Technical Institute',
          alternateName: 'Elevate for Humanity',
          description,
          url: 'https://www.elevateforhumanity.org',
          logo: 'https://www.elevateforhumanity.org/logo.jpg',
          image: 'https://www.elevateforhumanity.org/og-image.svg',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '120 E Market St, Suite 930',
            addressLocality: 'Indianapolis',
            addressRegion: 'IN',
            postalCode: '46204',
            addressCountry: 'US',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-317-314-3757',
            contactType: 'customer service',
            email: 'info@elevateforhumanity.org',
            availableLanguage: ['English'],
          },
          sameAs: [
            'https://www.facebook.com/elevateforhumanity',
            'https://www.linkedin.com/company/elevate-for-humanity',
          ],
          foundingDate: '2020',
          slogan: 'Empowering People. Elevating Communities.',
          knowsAbout: [
            'Workforce Development',
            'Career Training',
            'Professional Certifications',
            'Apprenticeships',
            'WIOA Programs',
            'Healthcare Training',
            'IT Certifications',
            'Construction Training',
          ],
        })}
      </script>
      {/* Schema.org markup - LocalBusiness */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Elevate for Humanity Career & Technical Institute',
          image: 'https://www.elevateforhumanity.org/og-image.svg',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '120 E Market St, Suite 930',
            addressLocality: 'Indianapolis',
            addressRegion: 'IN',
            postalCode: '46204',
            addressCountry: 'US',
          },
          telephone: '+1-317-314-3757',
          url: 'https://www.elevateforhumanity.org',
          email: 'info@elevateforhumanity.org',
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '08:00',
            closes: '18:00',
          },
        })}
      </script>
      {/* Schema.org markup - FAQPage */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Can workforce funding help pay for training?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Some applicants may qualify for workforce funding. Eligibility and authorization are determined by the responsible funding agency after reviewing the applicant and program.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does Elevate guarantee employment after training?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Elevate provides career services and employer connections, but training completion does not guarantee employment, wages, or placement.',
              },
            },
            {
              '@type': 'Question',
              name: 'How long do the programs take?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Programs range from 4-20 weeks depending on the certification. Most programs are 8-12 weeks with flexible scheduling options.',
              },
            },
            {
              '@type': 'Question',
              name: 'What certifications do you offer?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We offer 106+ industry-recognized certifications in Healthcare (Phlebotomy, EHR, Allied Health), IT (CompTIA, Cloud, Cisco), Construction (OSHA, Pre-Apprenticeship), Business (PMI, HRCI), and more.',
              },
            },
            {
              '@type': 'Question',
              name: 'Who is eligible for the programs?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Programs are available to Indianapolis/Marion County residents who meet WIOA eligibility requirements. This includes unemployed, underemployed, veterans, and those seeking career advancement.',
              },
            },
          ],
        })}
      </script>
    </Helmet>
  );
}
