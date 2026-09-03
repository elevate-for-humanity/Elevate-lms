-- Tax Preparation & Financial Services Career Certificate (IRS VITA Track)
-- ETPL Program #10004627 | 10 Weeks | 150 Hours | Hybrid
-- Inserts into curriculum_lessons (canonical table for new programs)
-- Program ID: 8f51a008-75a8-4d3c-8d3d-31061c9b38ac (slug: tax-preparation)
-- Course ID:  a1b2c3d4-e5f6-7890-abcd-100000000001 (deterministic)
-- lesson_order uses module*100+position to ensure global uniqueness per course

-- 1. Upsert the course
INSERT INTO courses (id, title, slug, description, duration_hours, status, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000001',
  'Tax Preparation & Financial Services Career Certificate (IRS VITA Track)',
  'tax-prep-financial-services',
  'State Certified Earn and Learn program. 10-week hybrid training in tax law, bookkeeping, financial literacy, and customer service. Culminates in IRS VITA/TCE certification and supervised practicum at an IRS-approved VITA site. ETPL Program #10004627.',
  150,
  'published',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_hours = EXCLUDED.duration_hours,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. Remove existing curriculum_lessons for this course (idempotent re-run)
DELETE FROM curriculum_lessons WHERE course_id = 'a1b2c3d4-e5f6-7890-abcd-100000000001';

-- 3. Seed lessons
-- Columns: course_id, program_id, lesson_slug, lesson_title, lesson_order, module_order, module_title, script_text, duration_minutes, status

-- Week 1 (module_order=1, lesson_order 100-106)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-overview','Week 1: Orientation, Ethics & Federal Tax Law',100,1,'Orientation, Ethics & Federal Tax Law','Week 1 covers program orientation, IRS ethics standards, Circular 230, and an introduction to the federal tax system.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-orientation','Program Orientation & Expectations',101,1,'Orientation, Ethics & Federal Tax Law','Program overview, 10-week schedule, hybrid delivery model, credential pathways, and student expectations.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-form13615','IRS Volunteer Standards of Conduct (Form 13615)',102,1,'Orientation, Ethics & Federal Tax Law','Review and sign Form 13615. Covers taxpayer confidentiality, due diligence, conflict of interest, and ethical obligations of VITA volunteers.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-circular230','Ethics & Circular 230',103,1,'Orientation, Ethics & Federal Tax Law','IRS Circular 230 regulations governing tax practitioners. Due diligence requirements, confidentiality obligations, professional responsibilities, and penalties for non-compliance.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-fed-system','Introduction to the Federal Tax System',104,1,'Orientation, Ethics & Federal Tax Law','Overview of the U.S. tax system: IRS structure, taxpayer rights, types of taxes, the tax return lifecycle, and key deadlines.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-linklearn','IRS Link & Learn Account Setup',105,1,'Orientation, Ethics & Federal Tax Law','Create your IRS Link & Learn account. This platform is used for your VITA/TCE certification exam in Week 10.',30,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w1-intuit','Intuit for Education Enrollment',106,1,'Orientation, Ethics & Federal Tax Law','Enroll in Intuit for Education (free). Complete the Money Mindsets introductory module.',30,'published');

-- Week 2 (module_order=2, lesson_order 200-207)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-overview','Week 2: Filing Status, Dependents & Income',200,2,'Filing Status, Dependents & Income','Week 2 covers filing status determination, dependency rules, and reporting wages, interest, dividends, and other income types.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-filing-status','Filing Status Determination',201,2,'Filing Status, Dependents & Income','Single, MFJ, MFS, Head of Household, Qualifying Surviving Spouse. Decision tree for determining correct filing status.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-dependents','Dependency Rules & Qualifying Tests',202,2,'Filing Status, Dependents & Income','Qualifying child vs qualifying relative. Support test, residency test, relationship test, age test, joint return test.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-w2-forms','Wages, Salaries & W-2 Processing',203,2,'Filing Status, Dependents & Income','Reading and interpreting W-2 forms. Box-by-box breakdown. Multiple W-2s. Withholding analysis. Common W-2 errors and corrections.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-1099s','Interest, Dividends & 1099 Forms',204,2,'Filing Status, Dependents & Income','1099-INT, 1099-DIV, 1099-R, 1099-SSA, 1099-G, 1099-MISC, 1099-NEC. When each applies. Reporting requirements.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-other-income','Other Income: Social Security, Retirement, Unemployment',205,2,'Filing Status, Dependents & Income','Social Security benefits taxation (up to 85%). Retirement distributions. Unemployment compensation. Alimony. Gambling income.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-linklearn','IRS Link & Learn: Basic Income Module',206,2,'Filing Status, Dependents & Income','Complete the Basic Income module on IRS Link & Learn. IRS-specific scenarios and practice questions.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w2-intuit','Intuit for Education: Earning Income Module',207,2,'Filing Status, Dependents & Income','Complete the Earning Income module on Intuit for Education. Income sources, pay stubs, and tax withholding basics.',45,'published');

-- Week 3 (module_order=3, lesson_order 300-307)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-overview','Week 3: Adjustments, Deductions & Credits',300,3,'Adjustments, Deductions & Credits','Week 3 covers above-the-line adjustments, standard vs itemized deductions, and key tax credits including EITC, CTC, and education credits.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-adjustments','Adjustments to Income',301,3,'Adjustments, Deductions & Credits','Student loan interest, educator expenses, IRA contributions, HSA contributions, self-employment tax deduction. Above-the-line vs below-the-line.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-deductions','Standard vs Itemized Deductions',302,3,'Adjustments, Deductions & Credits','When to itemize. Schedule A: medical expenses (7.5% AGI floor), SALT ($10K cap), mortgage interest, charitable contributions.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-eitc','Earned Income Tax Credit (EITC) & Due Diligence',303,3,'Adjustments, Deductions & Credits','EITC eligibility rules, income limits, qualifying children. Form 8867 due diligence requirements. Penalties for failure to comply.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-ctc','Child Tax Credit & Dependent Care Credit',304,3,'Adjustments, Deductions & Credits','CTC amounts and phase-outs. Additional Child Tax Credit. Child and Dependent Care Credit (Form 2441).',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-edu-credits','Education Credits (AOTC & LLC)',305,3,'Adjustments, Deductions & Credits','American Opportunity Tax Credit vs Lifetime Learning Credit. Eligibility, income limits, qualified expenses. Form 1098-T.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-practice','Practice Returns: Credits & Deductions Scenarios',306,3,'Adjustments, Deductions & Credits','Complete 3 practice returns using mock client files with various credit/deduction combinations.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w3-intuit','Intuit for Education: Taxes & Government Module',307,3,'Adjustments, Deductions & Credits','Complete the Taxes & Government module on Intuit for Education. How taxes work, tax brackets, and government services.',45,'published');

-- Week 4 (module_order=4, lesson_order 400-407)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-overview','Week 4: TaxSlayer Software & Practice Returns',400,4,'TaxSlayer Software & Practice Returns','Week 4 is hands-on TaxSlayer Pro training. Data entry, e-filing, quality review, and a mid-term simulation exam.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-taxslayer-nav','TaxSlayer Pro: Navigation & Setup',401,4,'TaxSlayer Software & Practice Returns','Account setup, interface navigation, client management, return creation. Interview mode vs forms mode.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-data-entry','TaxSlayer Pro: Data Entry & Form 1040',402,4,'TaxSlayer Software & Practice Returns','Enter W-2s, 1099s, dependents, and deductions. Walk through a complete Form 1040 from start to finish.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-schedules','TaxSlayer Pro: Schedules & Supporting Forms',403,4,'TaxSlayer Software & Practice Returns','Schedule A, B, C, EIC. Form 8867 due diligence. Form 8863 education credits. State return add-on.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-efile','E-Filing Requirements & Procedures',404,4,'TaxSlayer Software & Practice Returns','IRS e-file requirements, EFIN, rejection codes and resolution. Bank products and refund options.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-quality','Quality Review Process',405,4,'TaxSlayer Software & Practice Returns','IRS quality review standards. Peer review checklist. Common errors to catch before filing.',30,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-practice5','Practice Returns: 5 Complete Returns in TaxSlayer',406,4,'TaxSlayer Software & Practice Returns','Complete 5 practice returns from mock client files in TaxSlayer Pro.',120,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w4-midterm','Mid-Term Simulation Exam',407,4,'TaxSlayer Software & Practice Returns','Timed simulation: prepare 2 complete returns within 90 minutes. Graded on accuracy, completeness, and proper form selection. Passing score: 80%.',90,'published');

-- Week 5 (module_order=5, lesson_order 500-505)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-overview','Week 5: Financial Literacy (Intuit for Education)',500,5,'Financial Literacy','Week 5 is delivered via Intuit for Education (free). Covers budgeting, credit management, savings, and investing fundamentals.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-mindsets','Intuit for Education: Money Mindsets',501,5,'Financial Literacy','Complete the Money Mindsets module. Financial attitudes, values, goal setting, and the psychology of money decisions.',120,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-earning','Intuit for Education: Earning & Spending',502,5,'Financial Literacy','Complete the Earning & Spending module. Income sources, budgeting fundamentals, needs vs wants, spending plans.',120,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-saving','Intuit for Education: Saving & Investing',503,5,'Financial Literacy','Complete the Saving & Investing module. Savings strategies, compound interest, investment basics, risk vs return.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-credit','Intuit for Education: Credit & Debt',504,5,'Financial Literacy','Complete the Credit & Debt module. Credit scores, credit reports, managing debt, building credit responsibly.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w5-budget-workshop','Budgeting Workshop: Build Your Personal Budget',505,5,'Financial Literacy','In-class workshop: create a personal budget using Excel or Google Sheets.',60,'published');

-- Weeks 6-9: VITA Site Practicum (module_order=6, lesson_order 600-606)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w6-overview','Weeks 6-9: VITA Site Practicum (60 Hours)',600,6,'VITA Site Practicum','Four weeks of supervised live client tax preparation at an IRS-approved VITA site.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w6-site-orientation','VITA Site Orientation & Procedures',601,6,'VITA Site Practicum','Site layout, client flow, intake procedures using Form 13614-C, scope of service, quality review process.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w6-intake','Client Intake Interview Techniques',602,6,'VITA Site Practicum','Conducting effective intake interviews. Gathering documents. Identifying out-of-scope issues. Building rapport.',45,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w6-supervised','Practicum Week 6: Supervised Tax Preparation',603,6,'VITA Site Practicum','Prepare client returns under direct supervision. All returns reviewed by site coordinator before filing.',600,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w7-peer-review','Practicum Week 7: Tax Preparation with Peer Review',604,6,'VITA Site Practicum','Prepare returns with increasing independence. Conduct peer quality reviews with fellow students.',600,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w8-independent','Practicum Week 8: Independent Preparation',605,6,'VITA Site Practicum','Prepare returns independently. Supervisor spot-checks selected returns. Handle more complex scenarios.',600,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w9-evaluation','Practicum Week 9: Final Week & Supervisor Evaluation',606,6,'VITA Site Practicum','Final practicum week. Supervisor completes formal evaluation covering accuracy, client communication, ethics, time management.',600,'published');

-- Week 10: Certification & Career Readiness (module_order=7, lesson_order 700-707)
INSERT INTO curriculum_lessons (course_id,program_id,lesson_slug,lesson_title,lesson_order,module_order,module_title,script_text,duration_minutes,status) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-overview','Week 10: Certification Exams, Career Readiness & Placement',700,7,'Certification & Career Readiness','Final week: IRS VITA/TCE certification exam, credential exams, resume building, and job placement support.',0,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-exam-prep','IRS Certification Exam Prep Review',701,7,'Certification & Career Readiness','Comprehensive review of all tax topics. Practice questions covering filing status, income, deductions, credits, and ethics.',120,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-vita-exam','IRS VITA/TCE Certification Exam',702,7,'Certification & Career Readiness','Complete the IRS VITA/TCE certification exam on the Link & Learn platform. Passing score: 80%.',120,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-qb-exam','QuickBooks ProAdvisor Certification Exam',703,7,'Certification & Career Readiness','Complete the QuickBooks ProAdvisor certification exam. Free for program participants.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-ms900','Microsoft 365 Fundamentals (MS-900) Exam',704,7,'Certification & Career Readiness','Complete the MS-900 exam at the Certiport Authorized Testing Center. Covers cloud concepts, Microsoft 365 apps, security, and compliance.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-riseup','Rise Up Career Readiness Assessment',705,7,'Certification & Career Readiness','Complete the NRF RISE Up assessment. Covers workplace readiness, communication, and professional development. Passing score: 70%.',60,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-resume','Resume Building & Interview Preparation',706,7,'Certification & Career Readiness','Build a professional resume highlighting all credentials earned. Practice interview scenarios for tax preparer and financial services positions.',90,'published'),
('a1b2c3d4-e5f6-7890-abcd-100000000001','8f51a008-75a8-4d3c-8d3d-31061c9b38ac','tax-w10-placement','Career Readiness & Job Placement Review',707,7,'Certification & Career Readiness','Final career readiness review. Job placement support. Employer connections for seasonal and year-round positions.',60,'published');

-- Verify: SELECT lesson_slug, module_order, lesson_order FROM curriculum_lessons
-- WHERE course_id = 'a1b2c3d4-e5f6-7890-abcd-100000000001' ORDER BY module_order, lesson_order;
-- Expected: 50 rows across 7 module groups
