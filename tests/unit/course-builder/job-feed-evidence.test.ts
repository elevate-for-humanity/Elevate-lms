import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkWorkforceEvidence } from '@/lib/course-factory/procurement-gate';
import { buildJobFeedEvidence } from '@/lib/course-builder/workforce-evidence';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const template = (overrides: Partial<ProgramBuilderTemplate>): ProgramBuilderTemplate =>
  ({
    title: 'Barber Apprenticeship',
    slug: 'barber-apprenticeship',
    credentialTarget: 'STATE_BOARD',
    minimumHours: 1500,
    requiresFinalExam: false,
    finalExam: { required: false },
    certificateRequirements: {
      includeHours: true,
      includeCompetencies: true,
      includeInstructorVerification: true,
      includeCompletionDate: true,
      includeVerificationUrl: true,
    },
    modules: [],
    regulatory: { complianceProfileKey: 'barber', credentialTarget: 'STATE_BOARD' },
    ...overrides,
  }) as ProgramBuilderTemplate;

describe('single Course Builder: government job-feed evidence', () => {
  it('fails a credentialed course that has a SOC mapping but no feed evidence', () => {
    const issues = checkWorkforceEvidence(template({}));
    expect(issues.some((i) => i.code === 'WORKFORCE_EVIDENCE_REQUIRED' && i.severity === 'error')).toBe(true);
  });

  it('passes a credentialed course once job-feed evidence is attached', () => {
    const issues = checkWorkforceEvidence(
      template({
        socCode: '39-5011.00',
        workforceEvidence: {
          socCode: '39-5011.00',
          occupationTitle: 'Barbers',
          onet: null,
          careerOneStop: null,
          usaJobs: { count: 0, listings: [] },
          bls: null,
          sources: ['US-DOL-O*NET'],
          fetchedAt: new Date().toISOString(),
          warnings: [],
        },
      }),
    );
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('does not fail INTERNAL courses or unmapped slugs for missing evidence', () => {
    expect(
      checkWorkforceEvidence(template({ credentialTarget: 'INTERNAL' })).filter(
        (i) => i.severity === 'error',
      ),
    ).toEqual([]);
    const unmapped = checkWorkforceEvidence(
      template({ slug: 'some-unmapped-program', socCode: null }),
    );
    expect(unmapped.some((i) => i.code === 'SOC_CODE_UNMAPPED' && i.severity === 'warning')).toBe(true);
    expect(unmapped.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('maps O*NET, BLS, CareerOneStop and USAJobs into one stored evidence block', () => {
    const evidence = buildJobFeedEvidence({
      socCode: '39-5011.00',
      occupationTitle: 'Barbers',
      standards: {
        soc_code: '39-5011.00',
        occupation_title: 'Barbers',
        occupation_description: 'Provide barbering services.',
        top_tasks: ['Cut hair'],
        top_skills: ['Active Listening'],
        top_knowledge: ['Customer Service'],
        median_annual_wage: 35000,
        entry_wage: 25000,
        experienced_wage: 45000,
        indiana_median_wage: 34000,
        projected_growth_pct: 5,
        projected_growth_cat: 'As fast as average',
        projected_openings: 1000,
        typical_education: 'Postsecondary nondegree award',
        certifications: [],
        credential_domains: [],
        credential_code: null,
        exam_blueprint: null,
        technology_skills: ['Point-of-sale software'],
        fetched_at: '2026-11-23T00:00:00.000Z',
        sources: ['onet', 'bls'],
        is_cached: false,
      } as any,
      evidenceSources: ['registered-course-blueprint', 'US-DOL-O*NET'],
      usaJobs: [
        {
          source: 'USAJobs.gov',
          external_id: '1',
          title: 'Barber',
          organization: 'Dept. of Veterans Affairs',
          location: 'Indianapolis, Indiana',
          salary_range: '$35,000 - $45,000',
          job_type: 'Full-time',
          remote_type: null,
          description: null,
          application_url: 'https://example.invalid/jobs/1',
          posted_at: null,
          closes_at: null,
          raw_payload: {},
          imported_at: '2026-11-23T00:00:00.000Z',
          promoted_to_job_postings: false,
        },
      ],
      careerOneStop: { jobPostingsCount: 42, location: 'IN' },
      warnings: [],
    });

    expect(evidence.socCode).toBe('39-5011.00');
    expect(evidence.onet?.tasks).toEqual(['Cut hair']);
    expect(evidence.bls?.medianAnnualWage).toBe(35000);
    expect(evidence.careerOneStop?.jobPostingsCount).toBe(42);
    expect(evidence.usaJobs.count).toBe(1);
    expect(evidence.usaJobs.listings[0]?.title).toBe('Barber');
    expect(evidence.sources).toContain('US-DOL-O*NET');
    expect(evidence.sources).toContain('US-DOL-BLS');
    expect(evidence.sources).toContain('USAJOBS');
    expect(evidence.sources).toContain('US-DOL-CareerOneStop');
  });

  it('wires the formerly dead evidence builder into the single Course Builder', () => {
    const loader = read('lib/course-builder/workforce-evidence.ts');
    expect(loader).toContain('buildCourseEvidenceContext');
    expect(loader).toContain('loadIndustryStandards');
    expect(loader).toContain('fetchUsaJobs');
    expect(loader).toContain('fetchCareerOneStopData');
    const orchestrator = read('lib/course-builder/orchestrator.ts');
    expect(orchestrator).toContain('attachJobFeedEvidence');
    expect(orchestrator).toContain('publishGovernedCourse');
    expect(orchestrator).toContain('requestCanonicalGeneration');
  });

  it('carries JAG as a funding type on the single template — not a feed', () => {
    const schema = read('lib/course-builder/schema.ts');
    expect(schema).toContain('jagEligible');
    expect(schema).toContain("Jobs for America's Graduates");
    expect(schema).toContain('JobFeedEvidence');
    expect(read('lib/course-builder/workforce-evidence.ts')).toContain('is NOT a feed');
    expect(read('lib/course-builder/workforce-evidence.ts')).not.toContain('fetchJag');
    const gate = read('lib/course-factory/procurement-gate.ts');
    expect(gate).toContain('WORKFORCE_EVIDENCE_REQUIRED');
  });
});
