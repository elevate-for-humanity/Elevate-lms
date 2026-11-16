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
  it('does not classify a store offer by a keyword inside its product name', () => {
    expect(getPublicPageFacts('/store/products/apprenticeship-tools').title).toBe('Before you choose a store product');
  });
  it('keeps testing instructions within the booking flow', () => {
    expect(getPublicPageFacts('/testing').facts[0].href).toBe('/testing#booking');
  });
  it('does not append enrollment FAQs to unrelated informational pages', () => {
    expect(getPublicPageFacts('/about').facts).toEqual([]);
  });
  it.each(['/programs/healthcare', '/programs/healthcare-training', '/programs/business', '/programs/not-a-program'])('does not create an application for category or unknown route %s', (route) => {
    expect(getPublicPageFacts(route).facts).toEqual([]);
  });
  it.each([['/programs/healthcare/nha-patient-care-technician', 'nha-patient-care-technician'], ['/programs/healthcare-training/enchanted-hearts-cpr-instructor', null]])('preserves nested detail and validated application links for %s', (route, slug) => {
    const facts = getPublicPageFacts(route).facts;
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.filter((fact) => !fact.href.startsWith('/apply/')).every((fact) => fact.href === route)).toBe(true);
    const application = facts.find((fact) => fact.href.startsWith('/apply/'));
    if (slug) expect(application?.href).toBe(`/apply/student?program=${slug}`);
    else expect(application).toBeUndefined();
  });
  it('keeps a program application linked to the selected program', () => {
    expect(getPublicPageFacts('/programs/hvac-technician').facts[1].href).toBe('/apply/student?program=hvac-technician');
  });
});
