-- Seed Tax Preparer Training Lessons with initial content
-- Full AI-generated content can be added later via API

-- Tax Preparation Fundamentals (tax-basics) - 24 lessons
INSERT INTO training_lessons (course_id, lesson_number, title, content, duration_minutes, topics, quiz_questions) VALUES
('tax-basics', 1, 'Understanding the U.S. Tax System', '<h2>Learning Objectives</h2><ul><li>Understand the structure of the U.S. federal tax system</li><li>Identify the role of the IRS</li><li>Explain progressive tax rates</li></ul><h2>Introduction</h2><p>The United States federal tax system is a progressive income tax system where tax rates increase as income increases. Understanding this foundation is critical for all tax preparers.</p><h2>Key Concepts</h2><ul><li>Federal income tax is collected by the Internal Revenue Service (IRS)</li><li>Tax rates range from 10% to 37% based on income brackets</li><li>Filing status affects tax brackets and deductions</li></ul>', 30, ARRAY['tax system', 'IRS', 'progressive tax'], '[]'::jsonb),

('tax-basics', 2, 'Filing Status Determination', '<h2>Learning Objectives</h2><ul><li>Identify the five filing statuses</li><li>Determine correct filing status for clients</li><li>Understand impact on tax liability</li></ul><h2>Filing Statuses</h2><ol><li><strong>Single</strong> - Unmarried, divorced, or legally separated</li><li><strong>Married Filing Jointly (MFJ)</strong> - Married couples filing together</li><li><strong>Married Filing Separately (MFS)</strong> - Married couples filing separately</li><li><strong>Head of Household (HOH)</strong> - Unmarried with qualifying dependent</li><li><strong>Qualifying Widow(er) (QW)</strong> - Spouse died within last 2 years</li></ol>', 30, ARRAY['filing status', 'MFJ', 'HOH'], '[]'::jsonb),

('tax-basics', 3, 'Personal Exemptions and Dependents', '<h2>Learning Objectives</h2><ul><li>Define qualifying child vs qualifying relative</li><li>Apply dependency tests</li><li>Understand impact on credits</li></ul><h2>Dependency Tests</h2><p>A dependent must meet specific tests including relationship, age, residency, support, and joint return tests.</p>', 30, ARRAY['dependents', 'exemptions'], '[]'::jsonb),

('tax-basics', 4, 'Income Types: W-2 Wages and Salaries', '<h2>Learning Objectives</h2><ul><li>Read and interpret Form W-2</li><li>Enter W-2 data correctly</li><li>Identify common W-2 errors</li></ul><h2>Form W-2 Boxes</h2><ul><li>Box 1: Wages, tips, other compensation</li><li>Box 2: Federal income tax withheld</li><li>Box 12: Various codes (401k, HSA, etc.)</li></ul>', 30, ARRAY['W-2', 'wages', 'income'], '[]'::jsonb),

('tax-basics', 5, 'Income Types: 1099 Forms', '<h2>Learning Objectives</h2><ul><li>Distinguish between 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV</li><li>Report 1099 income correctly</li><li>Understand backup withholding</li></ul>', 30, ARRAY['1099', 'interest', 'dividends'], '[]'::jsonb),

('tax-basics', 6, 'Self-Employment Income (Schedule C)', '<h2>Learning Objectives</h2><ul><li>Complete Schedule C</li><li>Calculate self-employment tax</li><li>Identify deductible business expenses</li></ul>', 30, ARRAY['Schedule C', 'self-employment'], '[]'::jsonb),

('tax-basics', 7, 'Standard Deduction vs Itemized Deductions', '<h2>Learning Objectives</h2><ul><li>Compare standard vs itemized deductions</li><li>Determine which is more beneficial</li><li>Know 2024 standard deduction amounts</li></ul>', 30, ARRAY['deductions', 'standard deduction'], '[]'::jsonb),

('tax-basics', 8, 'Common Itemized Deductions', '<h2>Learning Objectives</h2><ul><li>Identify deductible expenses on Schedule A</li><li>Apply limitations and thresholds</li><li>Document itemized deductions</li></ul>', 30, ARRAY['Schedule A', 'itemized deductions'], '[]'::jsonb),

('tax-basics', 9, 'Above-the-Line Deductions', '<h2>Learning Objectives</h2><ul><li>Identify adjustments to income</li><li>Calculate student loan interest deduction</li><li>Understand IRA contribution deductions</li></ul>', 30, ARRAY['adjustments', 'IRA', 'student loan'], '[]'::jsonb),

('tax-basics', 10, 'Child Tax Credit and Additional Child Tax Credit', '<h2>Learning Objectives</h2><ul><li>Determine CTC eligibility</li><li>Calculate credit amount</li><li>Understand refundable vs non-refundable</li></ul>', 30, ARRAY['CTC', 'child tax credit'], '[]'::jsonb),

('tax-basics', 11, 'Earned Income Tax Credit (EITC)', '<h2>Learning Objectives</h2><ul><li>Determine EITC eligibility</li><li>Apply due diligence requirements</li><li>Calculate EITC amount</li></ul>', 30, ARRAY['EITC', 'earned income credit'], '[]'::jsonb),

('tax-basics', 12, 'Education Credits', '<h2>Learning Objectives</h2><ul><li>Compare AOTC vs Lifetime Learning Credit</li><li>Determine eligibility</li><li>Calculate credit amounts</li></ul>', 30, ARRAY['AOTC', 'education credits'], '[]'::jsonb),

('tax-basics', 13, 'Tax Calculations and Tax Brackets', '<h2>Learning Objectives</h2><ul><li>Calculate tax using tax tables</li><li>Understand marginal vs effective tax rates</li><li>Apply tax brackets correctly</li></ul>', 30, ARRAY['tax brackets', 'tax calculation'], '[]'::jsonb),

('tax-basics', 14, 'Federal Withholding and Estimated Taxes', '<h2>Learning Objectives</h2><ul><li>Understand withholding requirements</li><li>Calculate estimated tax payments</li><li>Avoid underpayment penalties</li></ul>', 30, ARRAY['withholding', 'estimated tax'], '[]'::jsonb),

('tax-basics', 15, 'Form 1040 Line-by-Line Walkthrough', '<h2>Learning Objectives</h2><ul><li>Complete Form 1040 accurately</li><li>Understand each line item</li><li>Identify common errors</li></ul>', 30, ARRAY['Form 1040', 'tax return'], '[]'::jsonb),

('tax-basics', 16, 'Common Schedules (Schedule 1, 2, 3)', '<h2>Learning Objectives</h2><ul><li>Complete Schedule 1 (Additional Income)</li><li>Complete Schedule 2 (Additional Taxes)</li><li>Complete Schedule 3 (Additional Credits)</li></ul>', 30, ARRAY['schedules', 'Schedule 1'], '[]'::jsonb),

('tax-basics', 17, 'State Tax Return Basics', '<h2>Learning Objectives</h2><ul><li>Understand state tax requirements</li><li>Identify state-specific deductions</li><li>Complete basic state returns</li></ul>', 30, ARRAY['state tax', 'state returns'], '[]'::jsonb),

('tax-basics', 18, 'IRS Forms and Where to Find Them', '<h2>Learning Objectives</h2><ul><li>Navigate IRS.gov</li><li>Download current tax forms</li><li>Access IRS publications</li></ul>', 30, ARRAY['IRS forms', 'IRS.gov'], '[]'::jsonb),

('tax-basics', 19, 'Ethics and Due Diligence Requirements', '<h2>Learning Objectives</h2><ul><li>Understand preparer responsibilities</li><li>Apply due diligence requirements</li><li>Maintain ethical standards</li></ul>', 30, ARRAY['ethics', 'due diligence'], '[]'::jsonb),

('tax-basics', 20, 'Client Confidentiality (IRC Section 7216)', '<h2>Learning Objectives</h2><ul><li>Understand IRC Section 7216</li><li>Protect client information</li><li>Obtain proper consents</li></ul>', 30, ARRAY['confidentiality', 'IRC 7216'], '[]'::jsonb),

('tax-basics', 21, 'PTIN Requirements', '<h2>Learning Objectives</h2><ul><li>Understand PTIN requirements</li><li>Apply for PTIN</li><li>Renew PTIN annually</li></ul>', 30, ARRAY['PTIN', 'preparer requirements'], '[]'::jsonb),

('tax-basics', 22, 'Practice Return: Simple W-2 Only', '<h2>Learning Objectives</h2><ul><li>Complete a basic tax return</li><li>Apply standard deduction</li><li>Calculate refund or balance due</li></ul>', 30, ARRAY['practice return', 'W-2'], '[]'::jsonb),

('tax-basics', 23, 'Practice Return: W-2 with Dependents and Credits', '<h2>Learning Objectives</h2><ul><li>Complete return with dependents</li><li>Apply CTC and EITC</li><li>Verify credit eligibility</li></ul>', 30, ARRAY['practice return', 'credits'], '[]'::jsonb),

('tax-basics', 24, 'Practice Return: Self-Employment Income', '<h2>Learning Objectives</h2><ul><li>Complete Schedule C</li><li>Calculate self-employment tax</li><li>Complete full return</li></ul>', 30, ARRAY['practice return', 'Schedule C'], '[]'::jsonb);

-- IRS Ethics & Professional Standards (irs-regulations) - 12 lessons
INSERT INTO training_lessons (course_id, lesson_number, title, content, duration_minutes, topics, quiz_questions) VALUES
('irs-regulations', 1, 'IRS Circular 230 Overview', '<h2>Learning Objectives</h2><ul><li>Understand Circular 230 requirements</li><li>Identify preparer obligations</li><li>Apply professional standards</li></ul>', 30, ARRAY['Circular 230', 'professional standards'], '[]'::jsonb),

('irs-regulations', 2, 'Preparer Tax Identification Number (PTIN)', '<h2>Learning Objectives</h2><ul><li>Understand PTIN purpose</li><li>Apply for PTIN</li><li>Maintain PTIN compliance</li></ul>', 30, ARRAY['PTIN'], '[]'::jsonb),

('irs-regulations', 3, 'Who Must Have a PTIN', '<h2>Learning Objectives</h2><ul><li>Identify who needs PTIN</li><li>Understand exemptions</li><li>Apply PTIN requirements</li></ul>', 30, ARRAY['PTIN requirements'], '[]'::jsonb),

('irs-regulations', 4, 'Preparer Penalties and Sanctions', '<h2>Learning Objectives</h2><ul><li>Identify preparer penalties</li><li>Understand penalty amounts</li><li>Avoid common violations</li></ul>', 30, ARRAY['penalties', 'sanctions'], '[]'::jsonb),

('irs-regulations', 5, 'Due Diligence Requirements', '<h2>Learning Objectives</h2><ul><li>Apply due diligence for EITC</li><li>Apply due diligence for CTC</li><li>Document due diligence efforts</li></ul>', 30, ARRAY['due diligence', 'EITC', 'CTC'], '[]'::jsonb),

('irs-regulations', 6, 'Client Confidentiality Requirements', '<h2>Learning Objectives</h2><ul><li>Understand IRC 7216</li><li>Protect client data</li><li>Obtain proper consents</li></ul>', 30, ARRAY['confidentiality', 'IRC 7216'], '[]'::jsonb),

('irs-regulations', 7, 'Consent Requirements for Disclosure', '<h2>Learning Objectives</h2><ul><li>Identify when consent is required</li><li>Obtain proper consent forms</li><li>Maintain consent records</li></ul>', 30, ARRAY['consent', 'disclosure'], '[]'::jsonb),

('irs-regulations', 8, 'Record Retention Requirements', '<h2>Learning Objectives</h2><ul><li>Understand retention periods</li><li>Identify required records</li><li>Maintain proper documentation</li></ul>', 30, ARRAY['record retention'], '[]'::jsonb),

('irs-regulations', 9, 'Preparer Signature Requirements', '<h2>Learning Objectives</h2><ul><li>Understand signature requirements</li><li>Sign returns properly</li><li>Use PTIN correctly</li></ul>', 30, ARRAY['signature requirements'], '[]'::jsonb),

('irs-regulations', 10, 'Electronic Filing Requirements', '<h2>Learning Objectives</h2><ul><li>Understand e-file requirements</li><li>Obtain EFIN</li><li>Comply with e-file regulations</li></ul>', 30, ARRAY['e-file', 'EFIN'], '[]'::jsonb),

('irs-regulations', 11, 'Continuing Education Requirements', '<h2>Learning Objectives</h2><ul><li>Understand CE requirements</li><li>Identify approved CE providers</li><li>Track CE credits</li></ul>', 30, ARRAY['continuing education', 'CE'], '[]'::jsonb),

('irs-regulations', 12, 'Professional Conduct and Best Practices', '<h2>Learning Objectives</h2><ul><li>Apply professional standards</li><li>Maintain ethical conduct</li><li>Build client trust</li></ul>', 30, ARRAY['professional conduct', 'best practices'], '[]'::jsonb);

-- Note: Additional courses (advanced-returns, business-returns, software-mastery) can be seeded similarly
-- For now, this provides the foundation for the two core courses
