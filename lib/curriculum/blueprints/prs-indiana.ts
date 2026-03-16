/**
 * lib/curriculum/blueprints/prs-indiana.ts
 *
 * Canonical blueprint for Indiana Certified Peer Recovery Specialist (CPRS).
 * Authority: Indiana DMHA.
 *
 * This file is the single source of truth for PRS course structure.
 * The builder reads this file. The hydration script reads this file.
 * Neither may infer structure from DB rows.
 *
 * Slugs are the durable identity. Do not change slugs after lessons are seeded.
 * Titles are display text and may be updated without breaking the builder.
 */

import type { CredentialBlueprint } from './types';

export const prsIndianaBlueprint: CredentialBlueprint = {
  id: 'prs-indiana',
  version: '1.0.0',
  credentialSlug: 'prs',
  credentialTitle: 'Certified Peer Recovery Specialist',
  state: 'IN',
  expectedModuleCount: 8,
  expectedLessonCount: 39,
  modules: [
    {
      key: 'foundations',
      title: 'Foundations of Peer Recovery Support',
      order: 1,
      domainKey: 'foundations',
      lessons: [
        { slug: 'role-of-peer-recovery-specialist',            title: 'The Role of a Peer Recovery Specialist',          order: 1, domainKey: 'foundations' },
        { slug: 'history-and-principles-of-peer-support',      title: 'History and Principles of Peer Support',          order: 2, domainKey: 'foundations' },
        { slug: 'recovery-oriented-language-and-perspective',  title: 'Recovery-Oriented Language and Perspective',      order: 3, domainKey: 'foundations' },
        { slug: 'lived-experience-as-a-professional-asset',    title: 'Lived Experience as a Professional Asset',        order: 4, domainKey: 'foundations' },
        { slug: 'person-centered-support-and-self-determination', title: 'Person-Centered Support and Self-Determination', order: 5, domainKey: 'foundations' },
      ],
    },
    {
      key: 'advocacy',
      title: 'Advocacy and Systems Navigation',
      order: 2,
      domainKey: 'advocacy',
      lessons: [
        { slug: 'advocacy-in-recovery-systems',         title: 'Advocacy in Recovery Systems',         order: 1, domainKey: 'advocacy' },
        { slug: 'navigating-community-resources',       title: 'Navigating Community Resources',       order: 2, domainKey: 'advocacy' },
        { slug: 'supporting-access-to-services',        title: 'Supporting Access to Services',        order: 3, domainKey: 'advocacy' },
        { slug: 'empowerment-and-informed-choice',      title: 'Empowerment and Informed Choice',      order: 4, domainKey: 'advocacy' },
        { slug: 'reducing-barriers-and-system-friction',title: 'Reducing Barriers and System Friction',order: 5, domainKey: 'advocacy' },
      ],
    },
    {
      key: 'mentoring',
      title: 'Mentoring and Peer Relationships',
      order: 3,
      domainKey: 'mentoring',
      lessons: [
        { slug: 'building-trust-in-peer-relationships',   title: 'Building Trust in Peer Relationships',   order: 1, domainKey: 'mentoring' },
        { slug: 'using-self-disclosure-appropriately',    title: 'Using Self-Disclosure Appropriately',    order: 2, domainKey: 'mentoring' },
        { slug: 'communication-skills-for-peer-support',  title: 'Communication Skills for Peer Support',  order: 3, domainKey: 'mentoring' },
        { slug: 'motivational-support-and-encouragement', title: 'Motivational Support and Encouragement', order: 4, domainKey: 'mentoring' },
        { slug: 'maintaining-mutuality-and-respect',      title: 'Maintaining Mutuality and Respect',      order: 5, domainKey: 'mentoring' },
      ],
    },
    {
      key: 'education',
      title: 'Education and Recovery Learning',
      order: 4,
      domainKey: 'education',
      lessons: [
        { slug: 'recovery-education-and-wellness-planning',  title: 'Recovery Education and Wellness Planning',  order: 1, domainKey: 'education' },
        { slug: 'teaching-self-advocacy-skills',             title: 'Teaching Self-Advocacy Skills',             order: 2, domainKey: 'education' },
        { slug: 'sharing-tools-for-relapse-prevention',      title: 'Sharing Tools for Relapse Prevention',      order: 3, domainKey: 'education' },
        { slug: 'supporting-goal-setting-and-action-steps',  title: 'Supporting Goal Setting and Action Steps',  order: 4, domainKey: 'education' },
        { slug: 'introducing-recovery-capital-concepts',     title: 'Introducing Recovery Capital Concepts',     order: 5, domainKey: 'education' },
      ],
    },
    {
      key: 'recovery-support',
      title: 'Recovery and Wellness Support',
      order: 5,
      domainKey: 'recovery_support',
      lessons: [
        { slug: 'stages-of-change-and-recovery-readiness',    title: 'Stages of Change and Recovery Readiness',    order: 1, domainKey: 'recovery_support' },
        { slug: 'wellness-dimensions-in-peer-support',        title: 'Wellness Dimensions in Peer Support',        order: 2, domainKey: 'recovery_support' },
        { slug: 'supporting-crisis-awareness-and-referral',   title: 'Supporting Crisis Awareness and Referral',   order: 3, domainKey: 'recovery_support' },
        { slug: 'community-integration-and-natural-supports', title: 'Community Integration and Natural Supports', order: 4, domainKey: 'recovery_support' },
        { slug: 'supporting-long-term-recovery-maintenance',  title: 'Supporting Long-Term Recovery Maintenance',  order: 5, domainKey: 'recovery_support' },
      ],
    },
    {
      key: 'ethics',
      title: 'Ethics and Professional Responsibility',
      order: 6,
      domainKey: 'ethics',
      lessons: [
        { slug: 'ethical-standards-in-peer-support',              title: 'Ethical Standards in Peer Support',              order: 1, domainKey: 'ethics' },
        { slug: 'confidentiality-and-privacy',                    title: 'Confidentiality and Privacy',                    order: 2, domainKey: 'ethics' },
        { slug: 'boundaries-and-dual-relationships',              title: 'Boundaries and Dual Relationships',              order: 3, domainKey: 'ethics' },
        { slug: 'scope-of-role-and-appropriate-referral',         title: 'Scope of Role and Appropriate Referral',         order: 4, domainKey: 'ethics' },
        { slug: 'documentation-professionalism-and-accountability',title: 'Documentation, Professionalism, and Accountability', order: 5, domainKey: 'ethics' },
      ],
    },
    {
      key: 'cultural-responsiveness',
      title: 'Cultural Responsiveness and Trauma-Informed Practice',
      order: 7,
      domainKey: 'cultural_responsiveness',
      lessons: [
        { slug: 'cultural-humility-in-peer-support',              title: 'Cultural Humility in Peer Support',              order: 1, domainKey: 'cultural_responsiveness' },
        { slug: 'equity-access-and-inclusive-practice',           title: 'Equity, Access, and Inclusive Practice',         order: 2, domainKey: 'cultural_responsiveness' },
        { slug: 'trauma-informed-principles-for-peer-work',       title: 'Trauma-Informed Principles for Peer Work',       order: 3, domainKey: 'cultural_responsiveness' },
        { slug: 'avoiding-retraumatization-in-support-settings',  title: 'Avoiding Retraumatization in Support Settings',  order: 4, domainKey: 'cultural_responsiveness' },
        { slug: 'supporting-diverse-recovery-pathways',           title: 'Supporting Diverse Recovery Pathways',           order: 5, domainKey: 'cultural_responsiveness' },
      ],
    },
    {
      key: 'professional-growth',
      title: 'Professional Growth, Self-Care, and Workforce Readiness',
      order: 8,
      domainKey: 'professional_growth',
      lessons: [
        { slug: 'self-care-and-burnout-prevention',                  title: 'Self-Care and Burnout Prevention',                  order: 1, domainKey: 'professional_growth' },
        { slug: 'reflective-practice-and-continuous-improvement',    title: 'Reflective Practice and Continuous Improvement',    order: 2, domainKey: 'professional_growth' },
        { slug: 'teamwork-and-collaboration-in-service-settings',    title: 'Teamwork and Collaboration in Service Settings',    order: 3, domainKey: 'professional_growth' },
        { slug: 'career-pathways-for-peer-recovery-specialists',     title: 'Career Pathways for Peer Recovery Specialists',     order: 4, domainKey: 'professional_growth' },
      ],
    },
  ],
};

// ── Hard guards — fail at module load, not at runtime ────────────────────────

const _actualModuleCount = prsIndianaBlueprint.modules.length;
const _actualLessonCount = prsIndianaBlueprint.modules.reduce(
  (sum, m) => sum + m.lessons.length, 0
);

if (_actualModuleCount !== prsIndianaBlueprint.expectedModuleCount) {
  throw new Error(
    `prs-indiana blueprint invalid: expected ${prsIndianaBlueprint.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}

if (_actualLessonCount !== prsIndianaBlueprint.expectedLessonCount) {
  throw new Error(
    `prs-indiana blueprint invalid: expected ${prsIndianaBlueprint.expectedLessonCount} lessons, got ${_actualLessonCount}`
  );
}
