import { describe, expect, it } from 'vitest';
import {
  getWebsiteInterviewQuestions,
  missingRequiredWebsiteAnswers,
} from '@/lib/website-builder/interview';

describe('PARIS Website Builder interview', () => {
  it('collects the complete core brief one useful question at a time', () => {
    const questions = getWebsiteInterviewQuestions({});
    const keys = questions.map((question) => question.key);
    expect(keys).toEqual(expect.arrayContaining([
      'businessName', 'industry', 'audience', 'goal', 'services', 'products',
      'pricing', 'payments', 'subscriptions', 'booking', 'locations', 'staff',
      'pages', 'brand', 'assets', 'policies', 'compliance', 'contacts', 'domain',
      'existingWebsite', 'analytics', 'seo', 'accessibility', 'conversion', 'upsell',
    ]));
    expect(missingRequiredWebsiteAnswers({})).toEqual([
      'businessName', 'industry', 'audience', 'goal', 'services', 'conversion',
    ]);
  });

  it('adapts follow-up questions for commerce, booking, and imports', () => {
    const questions = getWebsiteInterviewQuestions({
      products: 'We sell oils online with shipping and pickup',
      booking: 'Customers book consultations',
      existingWebsite: 'https://example.com',
    });
    const keys = questions.map((question) => question.key);
    expect(keys).toEqual(expect.arrayContaining(['inventory', 'scheduling', 'importScope']));
  });
});
