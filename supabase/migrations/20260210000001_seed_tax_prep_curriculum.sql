-- Tax Preparation & Financial Services Career Certificate (IRS VITA Track)
-- ETPL Program #10004627 | 10 Weeks | 150 Hours | Hybrid
--
-- Run AFTER: 20260210_tax_prep_enrollment_map.sql
-- Run IN: Supabase SQL Editor (production)

-- Use deterministic UUIDs so this migration is idempotent
-- Course ID: fixed UUID derived from program slug

-- 1. Create the course
INSERT INTO courses (id, title, slug, description, duration_weeks, is_published, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000001',
  'Tax Preparation & Financial Services Career Certificate (IRS VITA Track)',
  'tax-prep-financial-services',
  'State Certified Earn and Learn program. 10-week hybrid training in tax law, bookkeeping, financial literacy, and customer service. Culminates in IRS VITA/TCE certification and supervised practicum at an IRS-approved VITA site. ETPL Program #10004627.',
  10,
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_weeks = EXCLUDED.duration_weeks,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- 2. Create lessons (grouped by week via order_index ranges)
-- Week 1: order_index 100-199
-- Week 2: order_index 200-299
-- etc.

-- Helper: delete existing lessons for this course to avoid duplicates on re-run
DELETE FROM lessons WHERE course_id = 'a1b2c3d4-e5f6-7890-abcd-100000000001';

-- ── Week 1: Orientation, Ethics & Federal Tax Law (15 hours) ──
INSERT INTO lessons (course_id, title, content, order_index, duration_minutes, is_published) VALUES
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 1: Orientation, Ethics & Federal Tax Law', 'Week 1 covers program orientation, IRS ethics standards, Circular 230, and an introduction to the federal tax system. You will also set up your IRS Link & Learn and Intuit for Education accounts.', 100, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Program Orientation & Expectations', 'Program overview, 10-week schedule, hybrid delivery model, credential pathways (IRS VITA/TCE, QuickBooks ProAdvisor, Microsoft 365 Fundamentals, Rise Up), and student expectations.', 101, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'IRS Volunteer Standards of Conduct (Form 13615)', 'Review and sign Form 13615. Covers taxpayer confidentiality, due diligence, conflict of interest, and ethical obligations of VITA volunteers. External resource: https://www.irs.gov/pub/irs-pdf/f13615.pdf', 102, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Ethics & Circular 230', 'IRS Circular 230 regulations governing tax practitioners. Due diligence requirements, confidentiality obligations, professional responsibilities, and penalties for non-compliance.', 103, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Introduction to the Federal Tax System', 'Overview of the U.S. tax system: IRS structure, taxpayer rights (Taxpayer Bill of Rights), types of taxes, the tax return lifecycle, and key deadlines.', 104, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'IRS Link & Learn Account Setup', 'Create your IRS Link & Learn account at https://apps.irs.gov/app/vita/. This platform is used for your VITA/TCE certification exam in Week 10. Complete the account setup and explore the interface.', 105, 30, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education Enrollment', 'Enroll in Intuit for Education (free) at https://intuit4education.app.intuit.com. Complete the Money Mindsets introductory module. This platform delivers your Week 5 financial literacy curriculum.', 106, 30, true),

-- ── Week 2: Filing Status, Dependents & Income (15 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 2: Filing Status, Dependents & Income', 'Week 2 covers filing status determination, dependency rules, and reporting wages, interest, dividends, and other income types.', 200, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Filing Status Determination', 'Single, Married Filing Jointly, Married Filing Separately, Head of Household, Qualifying Surviving Spouse. Decision tree for determining correct filing status. Impact on standard deduction and tax brackets.', 201, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Dependency Rules & Qualifying Tests', 'Qualifying child vs qualifying relative. Support test, residency test, relationship test, age test, joint return test. Tiebreaker rules for multiple claims.', 202, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Wages, Salaries & W-2 Processing', 'Reading and interpreting W-2 forms. Box-by-box breakdown. Multiple W-2s. Withholding analysis. Common W-2 errors and corrections.', 203, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Interest, Dividends & 1099 Forms', '1099-INT, 1099-DIV, 1099-R, 1099-SSA, 1099-G, 1099-MISC, 1099-NEC. When each applies. Reporting requirements. Tax-exempt interest.', 204, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Other Income: Social Security, Retirement, Unemployment', 'Social Security benefits taxation (up to 85%). Retirement distributions (traditional vs Roth). Unemployment compensation. Alimony (pre/post-2019). Gambling income.', 205, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'IRS Link & Learn: Basic Income Module', 'Complete the Basic Income module on IRS Link & Learn at https://apps.irs.gov/app/vita/. This covers the same topics with IRS-specific scenarios and practice questions.', 206, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Earning Income Module', 'Complete the Earning Income module on Intuit for Education at https://intuit4education.app.intuit.com. Covers income sources, pay stubs, and tax withholding basics.', 207, 45, true),

-- ── Week 3: Adjustments, Deductions & Credits (15 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 3: Adjustments, Deductions & Credits', 'Week 3 covers above-the-line adjustments, standard vs itemized deductions, and key tax credits including EITC, CTC, and education credits.', 300, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Adjustments to Income', 'Student loan interest deduction, educator expenses, IRA contributions, HSA contributions, self-employment tax deduction, alimony paid (pre-2019). Above-the-line vs below-the-line.', 301, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Standard vs Itemized Deductions', 'When to itemize. Schedule A: medical expenses (7.5% AGI floor), state/local taxes (SALT $10K cap), mortgage interest, charitable contributions. Standard deduction amounts by filing status.', 302, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Earned Income Tax Credit (EITC) & Due Diligence', 'EITC eligibility rules, income limits, qualifying children. Form 8867 due diligence requirements. Penalties for failure to comply. Common EITC errors.', 303, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Child Tax Credit & Dependent Care Credit', 'CTC amounts and phase-outs. Additional Child Tax Credit. Child and Dependent Care Credit (Form 2441). Qualifying expenses and provider requirements.', 304, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Education Credits (AOTC & LLC)', 'American Opportunity Tax Credit vs Lifetime Learning Credit. Eligibility, income limits, qualified expenses. Form 1098-T. Coordination with 529 plans.', 305, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practice Returns: Credits & Deductions Scenarios', 'Complete 3 practice returns using mock client files with various credit/deduction combinations. Scenarios include: single parent with EITC, married couple itemizing, student with education credits.', 306, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Taxes & Government Module', 'Complete the Taxes & Government module on Intuit for Education at https://intuit4education.app.intuit.com. Covers how taxes work, tax brackets, and government services funded by taxes.', 307, 45, true),

-- ── Week 4: TaxSlayer Software & Practice Returns (15 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 4: TaxSlayer Software & Practice Returns', 'Week 4 is hands-on TaxSlayer Pro training. Data entry, e-filing, quality review, and a mid-term simulation exam.', 400, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'TaxSlayer Pro: Navigation & Setup', 'Account setup, interface navigation, client management, return creation. Interview mode vs forms mode. Keyboard shortcuts.', 401, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'TaxSlayer Pro: Data Entry & Form 1040', 'Enter W-2s, 1099s, dependents, and deductions. Walk through a complete Form 1040 from start to finish. Error checking and diagnostics.', 402, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'TaxSlayer Pro: Schedules & Supporting Forms', 'Schedule A, B, C, EIC. Form 8867 due diligence. Form 8863 education credits. State return add-on. Quality review checklist.', 403, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'E-Filing Requirements & Procedures', 'IRS e-file requirements, EFIN, rejection codes and resolution. Bank products and refund options. Direct deposit vs check. Refund transfer products.', 404, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Quality Review Process', 'IRS quality review standards. Peer review checklist. Common errors to catch before filing. Accuracy benchmarks.', 405, 30, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practice Returns: 5 Complete Returns in TaxSlayer', 'Complete 5 practice returns from mock client files in TaxSlayer Pro. Includes: simple W-2 return, family with dependents, self-employed (Schedule C), retiree with Social Security, complex multi-form.', 406, 120, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', '⚡ Mid-Term Simulation Exam', 'Timed simulation: prepare 2 complete returns from mock client files within 90 minutes. Graded on accuracy, completeness, and proper form selection. Passing score: 80%.', 407, 90, true),

-- ── Week 5: Financial Literacy via Intuit for Education (15 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 5: Financial Literacy (Intuit for Education)', 'Week 5 is delivered via Intuit for Education (free). Covers budgeting, credit management, savings, and investing fundamentals.', 500, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Money Mindsets', 'Complete the Money Mindsets module at https://intuit4education.app.intuit.com. Financial attitudes, values, goal setting, and the psychology of money decisions.', 501, 120, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Earning & Spending', 'Complete the Earning & Spending module. Income sources, budgeting fundamentals, needs vs wants, spending plans, and tracking expenses.', 502, 120, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Saving & Investing', 'Complete the Saving & Investing module. Savings strategies, compound interest, investment basics, risk vs return, and retirement planning.', 503, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Intuit for Education: Credit & Debt', 'Complete the Credit & Debt module. Credit scores, credit reports, managing debt, building credit responsibly, and avoiding predatory lending.', 504, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Budgeting Workshop: Build Your Personal Budget', 'In-class workshop: create a personal budget using Excel or Google Sheets. Apply concepts from the I4E modules to your own financial situation.', 505, 60, true),

-- ── Weeks 6-9: VITA Site Practicum (60 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEKS 6–9: VITA Site Practicum (60 Hours)', 'Four weeks of supervised live client tax preparation at an IRS-approved VITA site. Progressive independence from direct supervision to independent preparation.', 600, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'VITA Site Orientation & Procedures', 'Site layout, client flow, intake procedures using Form 13614-C, scope of service, quality review process, and site coordinator expectations.', 601, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Client Intake Interview Techniques', 'Conducting effective intake interviews. Gathering documents. Identifying out-of-scope issues. Building rapport. Handling sensitive situations (identity theft, prior year issues).', 602, 45, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practicum Week 6: Supervised Tax Preparation', 'Prepare client returns under direct supervision. All returns reviewed by site coordinator before filing. Focus on accuracy and following procedures.', 603, 600, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practicum Week 7: Tax Preparation with Peer Review', 'Prepare returns with increasing independence. Conduct peer quality reviews with fellow students. Discuss complex scenarios with supervisor.', 604, 600, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practicum Week 8: Independent Preparation', 'Prepare returns independently. Supervisor spot-checks selected returns. Handle more complex scenarios (self-employment, multiple income sources).', 605, 600, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Practicum Week 9: Final Week & Supervisor Evaluation', 'Final practicum week. Supervisor completes formal evaluation covering: accuracy, client communication, ethics, time management, and professionalism.', 606, 600, true),

-- ── Week 10: Certification, Career Readiness & Placement (15 hours) ──
('a1b2c3d4-e5f6-7890-abcd-100000000001', '📋 WEEK 10: Certification Exams, Career Readiness & Placement', 'Final week: IRS VITA/TCE certification exam, credential exams, resume building, and job placement support.', 700, 0, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'IRS Certification Exam Prep Review', 'Comprehensive review of all tax topics. Practice questions covering filing status, income, deductions, credits, and ethics. Common exam pitfalls and strategies.', 701, 120, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', '🎓 IRS VITA/TCE Certification Exam', 'Complete the IRS VITA/TCE certification exam on the Link & Learn platform at https://apps.irs.gov/app/vita/. Passing score: 80%. You may retake if needed.', 702, 120, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', '🎓 QuickBooks ProAdvisor Certification Exam', 'Complete the QuickBooks ProAdvisor certification exam at https://quickbooks.intuit.com/accountants/training-certification/. Free for program participants.', 703, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', '🎓 Microsoft 365 Fundamentals (MS-900) Exam', 'Complete the MS-900 exam at the Certiport Authorized Testing Center. Covers cloud concepts, Microsoft 365 apps, security, and compliance.', 704, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', '🎓 Rise Up Career Readiness Assessment', 'Complete the NRF RISE Up assessment. Covers workplace readiness, communication, and professional development. Passing score: 70%.', 705, 60, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Resume Building & Interview Preparation', 'Build a professional resume highlighting all credentials earned. Practice interview scenarios for tax preparer, bookkeeping clerk, and financial services positions.', 706, 90, true),
('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Career Readiness & Job Placement Review', 'Final career readiness review. Job placement support. Employer connections for seasonal and year-round positions. Starting your own tax business overview.', 707, 60, true);

-- 3. Verify
-- Run this after to confirm:
-- SELECT title, order_index, duration_minutes FROM lessons
-- WHERE course_id = 'a1b2c3d4-e5f6-7890-abcd-100000000001'
-- ORDER BY order_index;
-- Expected: ~50 rows across 7 week groups
