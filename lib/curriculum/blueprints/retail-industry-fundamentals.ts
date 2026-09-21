/**
 * Elevate Retail Industry Fundamentals
 *
 * Original Elevate courseware aligned to publicly described retail-workforce
 * competencies. It does not reproduce NRF Foundation RISE Up curriculum,
 * videos, manuals, or certification exam questions.
 */
import type { CredentialBlueprint, BlueprintLessonRef } from './types';

const lesson = (
  slug: string,
  title: string,
  order: number,
  domainKey: string,
  learningObjectives: string[],
  durationMinutes = 50,
): BlueprintLessonRef => ({ slug, title, order, domainKey, learningObjectives, durationMinutes });

export const retailIndustryFundamentalsBlueprint: CredentialBlueprint = {
  id: 'elevate-retail-industry-fundamentals-v1',
  version: '1.0.0',
  title: 'Elevate Retail Industry Fundamentals',
  programSlug: 'retail-industry-fundamentals',
  programType: 'workforce',
  credentialSlug: 'elevate-retail-industry-fundamentals',
  credentialTitle: 'Elevate Retail Industry Fundamentals',
  credentialCode: 'ELEVATE-RIF',
  state: 'US',
  status: 'active',
  targetRole: 'Retail Sales / Customer Service Associate',
  sourceAuthority: 'Elevate for Humanity',
  sourceReference:
    'Original Elevate retail-workforce competency framework aligned to publicly described retail industry fundamentals and customer-service competencies. NRF Foundation RISE Up testing remains external.',
  effectiveDate: '2026-09-21',
  expectedModuleCount: 5,
  expectedLessonCount: 30,
  generationRules: {
    generatorMode: 'fixed',
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 30,
    requiresFinalExam: true,
    requireCheckpointPerModule: true,
    passingScore: 80,
    allowedLessonTypes: ['orientation', 'lesson', 'scenario', 'practical', 'checkpoint', 'exam'],
  },
  finalExam: {
    questionCount: 60,
    passingScore: 80,
    domainDistribution: {
      retail_industry: 15,
      customer_service_sales: 25,
      retail_operations: 25,
      retail_math: 15,
      workplace_readiness: 20,
    },
  },
  certificateRequirements: {
    includeHours: true,
    includeCompetencies: true,
    includeInstructorVerification: false,
    includeCompletionDate: true,
    includeVerificationUrl: true,
    requireAllCriticalCompetencies: true,
  },
  videoConfig: {
    videoGenerator: 'remotion',
    template: 'elevate-slide',
    instructorName: 'Elevate Retail Instructor',
    instructorTitle: 'Retail & Customer Service Instructor',
    instructorImagePath: '/images/instructors/business-coach.jpg',
    brandName: 'Elevate for Humanity',
    logoPath: '/images/logo.png',
    captions: true,
    backgroundMusic: false,
    ttsVoice: 'nova',
    ttsSpeed: 1,
    slideCount: 6,
    segments: ['intro', 'concept', 'scenario', 'application', 'knowledge-check', 'wrapup'],
    requireNarrationVisualAlignment: true,
    requireValidatedStoryboardBeforeRender: true,
    requireSceneLevelObjectiveMapping: true,
    requireCaptionsAndTranscript: true,
    allowSceneLevelRepair: true,
  },
  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 10, maxQuestions: 15, passingThreshold: 0.8 },
    { assessmentType: 'final', scope: 'all', minQuestions: 60, maxQuestions: 60, passingThreshold: 0.8 },
  ],
  modules: [
    {
      slug: 'retail-industry-foundations', title: 'Retail Industry Foundations', orderIndex: 1,
      domainKey: 'retail_industry', minLessons: 6, maxLessons: 6, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'orientation', requiredCount: 1 }, { lessonType: 'lesson', requiredCount: 3 }, { lessonType: 'practical', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'retail_cycle', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'quiz' },
        { competencyKey: 'retail_channels', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'assignment' },
      ],
      lessons: [
        lesson('retail-orientation','Retail Careers, Customers, and the Retail Cycle',1,'retail_industry',['Explain how retailers create value for customers.','Identify major stages of the retail cycle.','Recognize common entry-level retail roles.']),
        lesson('retail-channels','Stores, E-commerce, Omnichannel, and Fulfillment',2,'retail_industry',['Compare store, online, and omnichannel retail.','Explain pickup, delivery, and fulfillment options.','Select an appropriate channel for a customer scenario.']),
        lesson('retail-products-services','Products, Services, Brands, and Customer Value',3,'retail_industry',['Differentiate products and services.','Connect product knowledge to customer value.','Use accurate product information in a customer interaction.']),
        lesson('retail-store-flow','How a Retail Business Operates',4,'retail_industry',['Trace merchandise from supplier to customer.','Identify front-of-house and back-of-house responsibilities.','Explain how departments coordinate during a shift.']),
        lesson('retail-foundations-scenario','Practical: Follow the Retail Cycle',5,'retail_industry',['Map a product through receiving, merchandising, sale, and fulfillment.','Identify operational handoffs and risks.','Recommend an improvement to a sample retail workflow.'],75),
        lesson('retail-foundations-checkpoint','Retail Industry Foundations Checkpoint',6,'retail_industry',['Demonstrate mastery of retail-industry fundamentals.','Identify objectives requiring remediation.'],35),
      ],
    },
    {
      slug: 'retail-customer-service-sales', title: 'Customer Service & Sales Fundamentals', orderIndex: 2,
      domainKey: 'customer_service_sales', minLessons: 7, maxLessons: 7, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'practical', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'customer_engagement', isCritical: true, minimumTouchpoints: 3, assessmentMethod: 'observation' },
        { competencyKey: 'service_recovery', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'assignment' },
        { competencyKey: 'sales_process', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'quiz' },
      ],
      lessons: [
        lesson('retail-customer-needs','Understanding Customer Needs',1,'customer_service_sales',['Use open and closed questions appropriately.','Identify stated and unstated customer needs.','Match solutions to customer priorities.']),
        lesson('retail-communication','Professional Communication and Active Listening',2,'customer_service_sales',['Demonstrate active listening.','Use professional verbal and nonverbal communication.','Adapt communication to customer situations.']),
        lesson('retail-sales-process','The Retail Sales Process',3,'customer_service_sales',['Identify stages of a customer-focused sales process.','Recommend products without pressure or deception.','Recognize opportunities for relevant add-on sales.']),
        lesson('retail-objections','Questions, Objections, and Product Comparisons',4,'customer_service_sales',['Respond accurately to product questions.','Handle objections respectfully.','Compare options using customer needs and product facts.']),
        lesson('retail-service-recovery','Complaints, Returns, and Service Recovery',5,'customer_service_sales',['De-escalate a dissatisfied customer.','Apply policy while preserving customer dignity.','Identify when to involve a supervisor.']),
        lesson('retail-customer-scenario','Practical: Customer Interaction Simulation',6,'customer_service_sales',['Conduct a complete customer interaction.','Resolve a realistic service problem.','Document the outcome and improvement opportunity.'],75),
        lesson('retail-service-checkpoint','Customer Service & Sales Checkpoint',7,'customer_service_sales',['Demonstrate customer-service and sales readiness.','Target weak objectives for remediation.'],35),
      ],
    },
    {
      slug: 'retail-operations', title: 'Retail Operations, Inventory & Safety', orderIndex: 3,
      domainKey: 'retail_operations', minLessons: 7, maxLessons: 7, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'practical', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'inventory_operations', isCritical: true, minimumTouchpoints: 3, assessmentMethod: 'assignment' },
        { competencyKey: 'loss_prevention_safety', isCritical: true, minimumTouchpoints: 3, assessmentMethod: 'quiz' },
      ],
      lessons: [
        lesson('retail-receiving','Receiving, Stocking, and Inventory Flow',1,'retail_operations',['Explain receiving and stocking steps.','Identify common inventory discrepancies.','Use safe stocking practices.']),
        lesson('retail-merchandising','Merchandising and Product Presentation',2,'retail_operations',['Explain basic merchandising principles.','Maintain accurate and accessible displays.','Connect presentation to customer experience.']),
        lesson('retail-pos','POS, Payments, Receipts, and Transaction Accuracy',3,'retail_operations',['Describe a basic point-of-sale workflow.','Protect payment and customer information.','Respond appropriately to transaction errors.']),
        lesson('retail-inventory','Inventory Accuracy, Replenishment, and Fulfillment',4,'retail_operations',['Explain cycle counts and replenishment.','Identify stockout and overstock risks.','Support accurate pickup and fulfillment.']),
        lesson('retail-safety-loss','Workplace Safety and Loss-Prevention Awareness',5,'retail_operations',['Recognize common retail safety hazards.','Explain employee responsibilities in loss prevention.','Follow policy rather than confronting suspected theft.']),
        lesson('retail-operations-scenario','Practical: Run a Safe Retail Shift',6,'retail_operations',['Prioritize operational tasks during a simulated shift.','Resolve inventory and customer-flow issues.','Document safety or loss-prevention concerns.'],75),
        lesson('retail-operations-checkpoint','Retail Operations Checkpoint',7,'retail_operations',['Demonstrate retail-operations readiness.','Identify weak operational objectives for remediation.'],35),
      ],
    },
    {
      slug: 'retail-math-profit', title: 'Retail Math, Pricing & Profit', orderIndex: 4,
      domainKey: 'retail_math', minLessons: 5, maxLessons: 5, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 3 }, { lessonType: 'practical', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'retail_math', isCritical: true, minimumTouchpoints: 3, assessmentMethod: 'quiz' },
        { competencyKey: 'profit_awareness', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'assignment' },
      ],
      lessons: [
        lesson('retail-pricing','Price, Discounts, Markdowns, and Sales Tax',1,'retail_math',['Calculate discounts and markdowns.','Distinguish price from cost.','Calculate transaction totals in realistic scenarios.']),
        lesson('retail-profit','Sales, Cost of Goods, Gross Profit, and Margin',2,'retail_math',['Calculate basic gross profit.','Explain how cost of goods affects profit.','Interpret simple margin scenarios.']),
        lesson('retail-kpis','Retail Performance Measures',3,'retail_math',['Interpret sales and conversion measures.','Explain average transaction value.','Use simple data to identify an operational opportunity.']),
        lesson('retail-math-lab','Practical: Retail Math Workbook',4,'retail_math',['Solve pricing, markdown, profit, and transaction scenarios.','Check calculations for reasonableness.','Explain a business decision using retail math.'],75),
        lesson('retail-math-checkpoint','Retail Math Checkpoint',5,'retail_math',['Demonstrate retail-math readiness.','Remediate weak calculation skills.'],35),
      ],
    },
    {
      slug: 'retail-workplace-readiness', title: 'Workplace Professionalism & Credential Readiness', orderIndex: 5,
      domainKey: 'workplace_readiness', minLessons: 5, maxLessons: 5, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'scenario', requiredCount: 1 }, { lessonType: 'practical', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'workplace_professionalism', isCritical: true, minimumTouchpoints: 3, assessmentMethod: 'observation' },
        { competencyKey: 'retail_readiness', isCritical: true, minimumTouchpoints: 2, assessmentMethod: 'exam' },
      ],
      lessons: [
        lesson('retail-professionalism','Attendance, Reliability, Ethics, and Professional Conduct',1,'workplace_readiness',['Explain reliability expectations.','Apply ethical decision making to workplace scenarios.','Demonstrate professional conduct.']),
        lesson('retail-teamwork','Teamwork, Feedback, and Workplace Communication',2,'workplace_readiness',['Collaborate across retail roles.','Give and receive constructive feedback.','Escalate workplace concerns appropriately.']),
        lesson('retail-shift-scenario','Scenario: A Complete Retail Shift',3,'workplace_readiness',['Prioritize customer, safety, and operational demands.','Choose appropriate responses to realistic workplace events.','Explain decisions using course concepts.'],70),
        lesson('retail-focused-review','Practical: Focused Review and Remediation',4,'workplace_readiness',['Use assessment results to identify weak domains.','Complete targeted remediation.','Demonstrate improved readiness before the final assessment.'],75),
        lesson('retail-final-readiness','Elevate Retail Final Readiness Assessment',5,'workplace_readiness',['Demonstrate integrated readiness across all Elevate retail domains.','Identify any remaining areas for review before external credential testing.'],60),
      ],
    },
  ],
};
