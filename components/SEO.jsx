import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'Elevate for Humanity - 106+ Workforce Certifications',
  description = 'Indianapolis-based ETPL provider offering 106+ industry-recognized certification programs with 92% job placement rate. 100% FREE through WIOA funding.',
  keywords = 'workforce development, online learning, career training, professional development, LMS, certifications, Indianapolis, WIOA, free training',
  image = 'https://elevateforhumanity.pages.dev/og-image.svg',
  url = 'https://elevateforhumanity.pages.dev',
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
          name: 'Elevate for Humanity',
          alternateName: 'EFH Workforce Development',
          description:
            'Indianapolis-based ETPL provider offering 106+ industry-recognized certification programs with 92% job placement rate. FREE workforce development through WIOA funding.',
          url: 'https://elevateforhumanity.pages.dev',
          logo: 'https://elevateforhumanity.pages.dev/images/logo.png',
          image: 'https://elevateforhumanity.pages.dev/og-image.svg',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '8888 Keystone Crossing, Suite 1300',
            addressLocality: 'Indianapolis',
            addressRegion: 'IN',
            postalCode: '46240',
            addressCountry: 'US',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-317-314-3757',
            contactType: 'customer service',
            email: 'elizabethpowell6262@gmail.com',
            availableLanguage: ['English'],
          },
          sameAs: [
            'https://www.facebook.com/elevateforhumanity',
            'https://www.linkedin.com/company/elevate-for-humanity',
          ],
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '247',
            bestRating: '5',
            worstRating: '1',
          },
          numberOfEmployees: {
            '@type': 'QuantitativeValue',
            value: '15',
          },
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
          name: 'Elevate for Humanity',
          image: 'https://elevateforhumanity.pages.dev/og-image.svg',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '8888 Keystone Crossing, Suite 1300',
            addressLocality: 'Indianapolis',
            addressRegion: 'IN',
            postalCode: '46240',
            addressCountry: 'US',
          },
          telephone: '+1-317-314-3757',
          url: 'https://elevateforhumanity.pages.dev',
          priceRange: 'FREE',
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '08:00',
            closes: '18:00',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '247',
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
              name: 'Are the training programs really free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, 100% FREE through WIOA (Workforce Innovation and Opportunity Act) funding. Students pay nothing for tuition, materials, or certification exams.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the job placement rate?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We maintain a 92% job placement rate across all programs. Most students are employed within 30-60 days of program completion.',
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
