import { describe, expect, it } from 'vitest';
import { getPublicPageFacts } from '@/lib/marketing/public-page-facts';

describe('public page self-service facts', () => {
  it.each(['/apprenticeships', '/programs/barber-apprenticeship', '/programs/cosmetology-apprenticeship', '/programs/esthetician-apprenticeship', '/programs/nail-technician-apprenticeship'])('states self-pay only on %s', (route) => {
    const page = getPublicPageFacts(route);
    expect(page.facts.some((fact) => /self-pay only/i.test(fact.answer))).toBe(true);
    expect(page.facts.some((fact) => fact.href.startsWith('/funding'))).toBe(false);
  });
  it('answers host approval and job-posting questions with actionable links', () => {
    const facts = getPublicPageFacts('/partners/host-shops').facts;
    expect(facts.find((fact) => /immediately/.test(fact.question))?.answer).toContain('Submitting an application is not approval');
    expect(facts.find((fact) => /list a job/.test(fact.question))?.href).toBe('/employers/post-job');
  });
  it('discloses that unactivated student kits cannot be ordered', () => {
    const facts = getPublicPageFacts('/store').facts;
    expect(facts.find((fact) => /student kits/.test(fact.question))?.answer).toContain('not available to order yet');
  });
  it.each(['/about', '/contact', '/privacy', '/testing', '/testing/checkout', '/programs/hvac-technician', '/programs/cna'])('keeps unrelated apprenticeship and Host Shop content off %s', (route) => {
    const facts = getPublicPageFacts(route).facts;
    expect(JSON.stringify(facts)).not.toMatch(/apprenticeship|Host Shop|host-shops/);
  });
  it('keeps testing instructions within the booking flow', () => {
    expect(getPublicPageFacts('/testing').facts[0].href).toBe('/testing#booking');
  });
  it('does not append enrollment FAQs to unrelated informational pages', () => {
    expect(getPublicPageFacts('/about').facts).toEqual([]);
  });
  it('keeps a program application linked to the selected program', () => {
    expect(getPublicPageFacts('/programs/hvac-technician').facts[1].href).toBe('/apply/student?program=hvac-technician');
  });
});
