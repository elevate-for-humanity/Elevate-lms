import type { CredentialBlueprint } from './types';
import { entrepreneurshipBlueprint } from './entrepreneurship';

const retailObjectiveEnhancements: Record<string, string[]> = {
  'esb-v2-sales-channels-process-support': [
    'Apply customer-service and selling practices in physical and digital retail environments.',
    'Connect the sales process to customer retention, service recovery, and repeat business.',
  ],
  'esb-v2-production-inputs-options': [
    'Explain how inventory, suppliers, capacity, and replenishment decisions affect retail operations.',
    'Compare inventory-control approaches for a small retail business.',
  ],
  'esb-v2-distribution-fulfillment-lab': [
    'Design a practical retail inventory, distribution, and fulfillment workflow.',
    'Identify shrink, stockout, overstock, and fulfillment risks and select appropriate controls.',
  ],
  'esb-v2-selling-price-unit-economics': [
    'Calculate retail price, markdown, gross profit, and gross-margin scenarios.',
    'Use unit economics and customer value to evaluate a pricing decision.',
  ],
  'esb-v2-financial-statements': [
    'Connect sales, cost of goods sold, inventory, expenses, and profit to basic business financial statements.',
  ],
  'esb-v2-fixed-variable-breakeven': [
    'Calculate break-even volume for a retail or small-business scenario.',
  ],
  'esb-v2-capstone-go-to-market-financial': [
    'Integrate merchandising, inventory, customer experience, pricing, and retail operations into the business plan.',
  ],
};

const modules = entrepreneurshipBlueprint.modules.map((courseModule) => {
  const lessons = (courseModule.lessons ?? []).map((sourceLesson) => ({
    ...sourceLesson,
    learningObjectives: [
      ...(sourceLesson.learningObjectives ?? []),
      ...(retailObjectiveEnhancements[sourceLesson.slug] ?? []),
    ],
  }));
  const targetHours =
    lessons.reduce((minutes, lesson) => minutes + Number(lesson.durationMinutes ?? 0), 0) / 60;
  const baseModule = { ...courseModule, targetHours, lessons };

  if (courseModule.domainKey === 'marketing_sales') {
    return {
      ...baseModule,
      title: 'Week 2 — Marketing, Sales & Customer Experience',
      description:
        'Market research, target customers, customer value, pricing, marketing, selling, service recovery, sales channels, customer retention, and retail customer experience.',
    };
  }

  if (courseModule.domainKey === 'production_distribution') {
    return {
      ...baseModule,
      title: 'Week 3 — Retail Operations, Inventory & Distribution',
      description:
        'Products and services, quality, suppliers, inventory lifecycle and controls, merchandising-related operations, regulation, safety, distribution, fulfillment, stock risk, and loss-prevention concepts.',
    };
  }

  if (courseModule.domainKey === 'business_financials') {
    return {
      ...baseModule,
      title: 'Week 4 — Business Finance, Pricing & Retail Math',
      description:
        'Startup costs, revenue, expenses, pricing, markdowns, gross profit, profit margin, cost of goods sold, inventory economics, break-even, cash flow, financial statements, ROI, budgets, and funding readiness.',
    };
  }

  if (courseModule.domainKey === 'entrepreneurial_small_business_concepts') {
    return {
      ...baseModule,
      title: 'Week 1 — Entrepreneurship, Opportunity & Business Planning',
      description:
        'Entrepreneurial mindset, opportunity recognition, customers, value propositions, ownership, business planning, design thinking, risk, and intellectual property.',
    };
  }

  if (courseModule.domainKey === 'capstone_exam_readiness') {
    return {
      ...baseModule,
      title: 'Week 5 — Business Simulation, Credential Readiness & Final Assessment',
      description:
        'Integrates entrepreneurship, customer service, retail operations, inventory, merchandising, marketing, sales, and practical business finance through capstone work, practice assessment, remediation, and final evaluation.',
    };
  }

  return baseModule;
});

export const businessEntrepreneurshipBlueprint: CredentialBlueprint = {
  ...entrepreneurshipBlueprint,
  id: 'business-entrepreneurship-esb-retail-v1',
  version: '1.0.0',
  title: 'Business & Entrepreneurship — ESB + Business of Retail',
  programSlug: 'business-administration',
  credentialSlug: 'business-entrepreneurship-esb-retail',
  credentialTitle: 'Business & Entrepreneurship — ESB + Business of Retail',
  credentialCode: 'BUS-ESB-RETAIL',
  sourceAuthority: 'Elevate for Humanity',
  sourceReference:
    'Original Elevate five-week business curriculum aligned to entrepreneurship and small-business objectives plus retail-business competencies including customer experience, merchandising, inventory, pricing, profit, loss prevention, safety, and management.',
  effectiveDate: '2026-08-22',
  targetRole: 'Entrepreneur / Small Business Owner / Retail Business Specialist',
  trackVariants: ['business-esb-retail'],
  certiportExamCodes: undefined,
  certificationPathway: undefined,
  externalCourses: undefined,
  modules,
};
