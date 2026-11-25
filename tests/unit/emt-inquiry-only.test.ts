import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { EMT_INQUIRY_HREF, isEmtInquiryOnly, isEmtInterviewSelection } from '../../lib/programs/emt-inquiry-only';

const read = (path: string) => readFileSync(path, 'utf8');

describe('temporary EMT inquiry-only policy', () => {
  it.each(['emt-apprenticeship', 'emt', ' EMT '])('recognizes the EMT route %s', (slug) => {
    expect(isEmtInquiryOnly(slug)).toBe(true);
  });

  it.each(['cna', 'hvac-technician', 'culinary-apprenticeship', undefined, null, ['emt']])('does not restrict %j', (value) => {
    expect(isEmtInquiryOnly(value)).toBe(false);
  });

  it('uses the existing contact form and renders before generic enrollment and course offers', () => {
    expect(EMT_INQUIRY_HREF).toBe('/contact?program=emt-apprenticeship#contact-form');
    const page = read('apps/marketing/app/programs/[program]/page.tsx');
    expect(page.indexOf('if (isEmtInquiryOnly(resolved.slug))')).toBeGreaterThan(-1);
    expect(page.indexOf('if (isEmtInquiryOnly(resolved.slug))')).toBeLessThan(page.indexOf('<ProgramStructuredData'));
    expect(page).toContain('href={EMT_INQUIRY_HREF}');
    expect(read('components/programs/PublicCatalogCard.tsx')).toContain("inquiryOnly ? 'Ask About EMT Training'");
    expect(read('apps/marketing/app/contact/page.tsx')).toContain('const emtInquiry = isEmtInquiryOnly(params.program)');
  });

  it.each([
    'apps/marketing/app/apply/page.tsx',
    'apps/marketing/app/apply/student/page.tsx',
    'apps/marketing/app/apply/student/form/page.tsx',
    'apps/marketing/app/apply/student/interview/page.tsx',
  ])('redirects saved EMT application routes through %s', (path) => {
    expect(read(path)).toMatch(/if \(isEmtInquiryOnly.*redirect\(EMT_INQUIRY_HREF\)/);
  });

  it.each(['EMT', 'EMT training.', 'Emergency Medical Technician (EMT)', 'emt-apprenticeship'])(
    'recognizes EMT when selected or typed as %s', (value) => {
      expect(isEmtInterviewSelection(value)).toBe(true);
    },
  );

  it.each(['paramedic', 'EMT or CNA', 'hvac-technician', undefined])(
    'does not divert a different or ambiguous interview answer: %s', (value) => {
      expect(isEmtInterviewSelection(value)).toBe(false);
    },
  );

  it('routes interview choices, typed and resumed answers, and the exact API link to inquiries', () => {
    const page = read('apps/marketing/app/apply/student/interview/page.tsx');
    const workspace = read('apps/marketing/app/apply/student/interview/ParisApplicationWorkspace.tsx');
    expect(page).toContain('!isEmtInquiryOnly(program.slug)');
    expect(page).toContain('href={EMT_INQUIRY_HREF}');
    expect(workspace).toContain("session?.nextQuestion?.field === 'program' && isEmtInterviewSelection(value)");
    expect(workspace).toContain('isEmtInterviewSelection(pending.value)');
    expect(workspace).toContain('data.inquiryUrl === EMT_INQUIRY_HREF');
  });

  it('keeps historical standard-form EMT drafts out of application and payment', () => {
    const form = read('apps/marketing/app/apply/student/StudentApplicationForm.tsx');
    expect(form).toContain('isEmtInquiryOnly(resumed.program)');
    expect(form).toContain('isEmtInquiryOnly(form.program)');
    expect(form).toContain('data.inquiryUrl === EMT_INQUIRY_HREF');
  });

  it('posts structured EMT interest independently of editable message text', () => {
    const page = read('apps/marketing/app/contact/page.tsx');
    const route = read('apps/marketing/app/api/contact/route.ts');
    expect(page).toContain('name="program" value={EMT_PROGRAM_SLUG}');
    expect(route).toContain('program_interest: data.program || data.interest || null');
  });

  it('shows inquiry cards outside the searchable enrollment groups', () => {
    const page = read('apps/marketing/app/programs/page.tsx');
    expect(page).toContain('const apprenticeships = enrollmentPrograms.filter(isApprenticeship)');
    expect(page).toContain('const careerTraining = enrollmentPrograms.filter');
    expect(page).toContain('inquiryOnly.map((program) => <PublicCatalogCard');
    expect(page).not.toContain('<ProgramsExplorer programs={inquiryOnly}');
  });

  it('blocks the active payment and application writes server-side', () => {
    const checkout = read('apps/marketing/app/api/programs/enroll/checkout/route.ts');
    const application = read('apps/marketing/app/api/applications/route.ts');
    expect(checkout.indexOf('if (isEmtInquiryOnly(program.slug))')).toBeGreaterThan(-1);
    expect(checkout.indexOf('if (isEmtInquiryOnly(program.slug))')).toBeLessThan(checkout.indexOf('const payment_plan ='));
    expect(application.indexOf('if (isEmtInquiryOnly(program)')).toBeGreaterThan(-1);
    expect(application.indexOf('if (isEmtInquiryOnly(program)')).toBeLessThan(application.indexOf('body.program = program;'));
    expect(checkout).toContain('inquiryUrl: EMT_INQUIRY_HREF }, { status: 409 }');
    expect(application).toContain('status: 409, headers: corsHeadersForOrigin');
  });
});
