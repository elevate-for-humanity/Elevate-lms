import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.elevateforhumanity.org';
const privatePaths = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/account/',
  '/login',
  '/logout',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      // OpenAI recommends allowing OAI-SearchBot so public pages can be
      // discovered, cited, and linked in ChatGPT search. Private/authenticated
      // surfaces remain excluded by the same route policy.
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
