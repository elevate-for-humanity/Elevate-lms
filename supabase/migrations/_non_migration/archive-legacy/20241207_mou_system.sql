-- ============================================================================
-- MEMORANDUM OF UNDERSTANDING (MOU) SYSTEM
-- Digital agreements for students, staff, employers, partners, program holders
-- ============================================================================

-- MOU Templates
CREATE TABLE IF NOT EXISTS mou_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_type TEXT NOT NULL, -- student, staff, employer, partner, program_holder
  version TEXT NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL, -- Full MOU text in markdown
  is_active BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_mou_templates_type ON mou_templates(user_type);
CREATE INDEX IF NOT EXISTS idx_mou_templates_active ON mou_templates(is_active);

-- MOU Signatures
CREATE TABLE IF NOT EXISTS mou_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES mou_templates(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_name TEXT, -- For program holders, employers, partners
  signature_data TEXT, -- Base64 signature image or typed name
  ip_address TEXT,
  user_agent TEXT,
  agreed_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_user ON mou_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_template ON mou_signatures(template_id);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_type ON mou_signatures(user_type);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_valid ON mou_signatures(is_valid);

-- Row Level Security
ALTER TABLE mou_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active MOU templates"
  ON mou_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage MOU templates"
  ON mou_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE mou_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures"
  ON mou_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signatures"
  ON mou_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all signatures"
  ON mou_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can revoke signatures"
  ON mou_signatures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert default MOU templates
INSERT INTO mou_templates (name, user_type, version, content, is_active) VALUES
(
  'Student Enrollment Agreement',
  'student',
  '1.0',
  '# STUDENT ENROLLMENT AGREEMENT

## Elevate for Humanity Workforce Training Program

**Effective Date:** [DATE]

This Memorandum of Understanding (MOU) is entered into between Elevate for Humanity ("Program") and the undersigned student ("Student").

### 1. PROGRAM OVERVIEW
Elevate for Humanity provides 100% government-funded workforce training programs at no cost to eligible students. Training includes career preparation, industry certifications, and job placement assistance.

### 2. STUDENT RESPONSIBILITIES
The Student agrees to:
- Attend all scheduled training sessions and complete coursework on time
- Maintain satisfactory academic progress (70% or higher)
- Comply with all program policies and code of conduct
- Notify program staff of any barriers to completion
- Participate in job placement activities upon program completion
- Provide accurate information for reporting and compliance purposes

### 3. PROGRAM COMMITMENTS
The Program agrees to:
- Provide quality training at no cost to the student
- Offer academic and career support services
- Assist with job placement upon successful completion
- Maintain confidentiality of student records
- Provide reasonable accommodations as needed

### 4. ATTENDANCE POLICY
Students must maintain 80% attendance. Excessive absences may result in dismissal from the program.

### 5. CODE OF CONDUCT
Students must:
- Treat staff, instructors, and fellow students with respect
- Maintain a professional demeanor
- Follow all safety protocols
- Refrain from harassment, discrimination, or disruptive behavior

### 6. TERMINATION
Either party may terminate this agreement with written notice. Students dismissed for policy violations may be ineligible for re-enrollment.

### 7. DATA PRIVACY
Student information will be used for program administration, reporting, and compliance purposes only. Data will not be shared without consent except as required by law.

### 8. ACKNOWLEDGMENT
By signing below, the Student acknowledges reading, understanding, and agreeing to the terms of this agreement.

---

**Student Signature Required**',
  true
),
(
  'Program Holder Partnership Agreement',
  'program_holder',
  '1.0',
  '# PROGRAM HOLDER PARTNERSHIP AGREEMENT

## Elevate for Humanity Workforce Training Program

**Effective Date:** [DATE]

This Memorandum of Understanding (MOU) is entered into between Elevate for Humanity ("Elevate") and the undersigned organization ("Program Holder").

### 1. PURPOSE
This MOU establishes a partnership to deliver workforce training programs to eligible students through government-funded initiatives.

### 2. PROGRAM HOLDER RESPONSIBILITIES
The Program Holder agrees to:
- Enroll eligible students in approved training programs
- Monitor student attendance and progress
- Provide support services to students as needed
- Submit accurate and timely reports to Elevate
- Maintain compliance with all federal, state, and local regulations
- Ensure student data privacy and confidentiality
- Communicate regularly with Elevate staff
- Participate in required training and meetings

### 3. ELEVATE RESPONSIBILITIES
Elevate agrees to:
- Provide access to training platform and materials
- Offer technical support and training
- Process student enrollments and certifications
- Maintain program quality and compliance
- Provide reporting tools and templates
- Offer ongoing support to Program Holders

### 4. STUDENT MANAGEMENT
Program Holders must:
- Verify student eligibility before enrollment
- Track student progress and completion
- Report student outcomes within required timeframes
- Maintain accurate student records
- Provide intervention for at-risk students

### 5. COMPLIANCE REQUIREMENTS
Program Holders must comply with:
- WIOA (Workforce Innovation and Opportunity Act) regulations
- State workforce development requirements
- Federal privacy laws (FERPA, etc.)
- Equal opportunity and non-discrimination policies
- All applicable labor and employment laws

### 6. REPORTING REQUIREMENTS
Program Holders must submit:
- Monthly enrollment reports
- Quarterly progress reports
- Completion and outcome data
- Compliance documentation as requested

### 7. FUNDING AND PAYMENT
All training is 100% government-funded. No fees may be charged to students. Program Holders may receive reimbursement for eligible expenses per approved agreements.

### 8. TERM AND TERMINATION
This agreement is effective upon signature and continues for one year, renewable annually. Either party may terminate with 30 days written notice.

### 9. LIABILITY
Each party is responsible for its own actions. Neither party assumes liability for the other''s negligence or misconduct.

### 10. ACKNOWLEDGMENT
By signing below, the Program Holder acknowledges reading, understanding, and agreeing to the terms of this partnership agreement.

---

**Authorized Signature Required**',
  true
),
(
  'Staff Employment Agreement',
  'staff',
  '1.0',
  '# STAFF EMPLOYMENT AGREEMENT

## Elevate for Humanity

**Effective Date:** [DATE]

This agreement is between Elevate for Humanity ("Employer") and the undersigned staff member ("Employee").

### 1. POSITION AND DUTIES
Employee agrees to perform duties as assigned in their role, including but not limited to student support, program administration, and compliance activities.

### 2. EMPLOYEE RESPONSIBILITIES
Employee agrees to:
- Perform duties professionally and competently
- Maintain confidentiality of student and organizational information
- Comply with all policies and procedures
- Complete required training and professional development
- Report any compliance concerns immediately
- Treat all students, staff, and partners with respect

### 3. CONFIDENTIALITY
Employee must maintain strict confidentiality of:
- Student records and personal information
- Proprietary business information
- Financial data
- Strategic plans and partnerships

### 4. CODE OF CONDUCT
Employee must:
- Act with integrity and professionalism
- Avoid conflicts of interest
- Follow ethical guidelines
- Maintain appropriate boundaries with students
- Report any misconduct or policy violations

### 5. COMPLIANCE
Employee must comply with:
- Federal and state employment laws
- FERPA and student privacy regulations
- Equal opportunity and non-discrimination policies
- Workplace safety requirements
- All organizational policies

### 6. TERMINATION
Employment is at-will. Either party may terminate with appropriate notice per employment agreement.

### 7. ACKNOWLEDGMENT
By signing below, Employee acknowledges reading, understanding, and agreeing to these terms.

---

**Employee Signature Required**',
  true
),
(
  'Employer Partnership Agreement',
  'employer',
  '1.0',
  '# EMPLOYER PARTNERSHIP AGREEMENT

## Elevate for Humanity Workforce Training Program

**Effective Date:** [DATE]

This MOU is between Elevate for Humanity ("Elevate") and the undersigned employer ("Employer").

### 1. PURPOSE
This partnership connects trained graduates with employment opportunities and may include customized training programs.

### 2. EMPLOYER COMMITMENTS
Employer agrees to:
- Consider Elevate graduates for open positions
- Provide job descriptions and hiring requirements
- Participate in job fairs and recruitment events
- Offer interviews to qualified candidates
- Provide feedback on candidate quality
- Consider offering internships or apprenticeships

### 3. ELEVATE COMMITMENTS
Elevate agrees to:
- Provide qualified, trained candidates
- Screen candidates for basic qualifications
- Offer job placement support services
- Maintain communication with Employer
- Track employment outcomes

### 4. HIRING PROCESS
- Elevate will refer qualified candidates
- Employer conducts interviews and makes hiring decisions
- All employment terms are between Employer and employee
- Elevate is not responsible for employment outcomes

### 5. EQUAL OPPORTUNITY
Both parties commit to equal opportunity employment practices and non-discrimination.

### 6. CONFIDENTIALITY
Both parties will maintain confidentiality of proprietary information shared during the partnership.

### 7. TERM
This agreement continues until terminated by either party with 30 days notice.

### 8. ACKNOWLEDGMENT
By signing below, Employer acknowledges agreement to these partnership terms.

---

**Authorized Signature Required**',
  true
),
(
  'Partner Organization Agreement',
  'partner',
  '1.0',
  '# PARTNER ORGANIZATION AGREEMENT

## Elevate for Humanity

**Effective Date:** [DATE]

This MOU is between Elevate for Humanity ("Elevate") and the undersigned partner organization ("Partner").

### 1. PURPOSE
This partnership supports workforce development through collaboration, resource sharing, and joint programming.

### 2. PARTNER RESPONSIBILITIES
Partner agrees to:
- Collaborate on workforce development initiatives
- Share resources and expertise as agreed
- Maintain quality standards
- Comply with applicable regulations
- Communicate regularly with Elevate
- Respect confidentiality agreements

### 3. ELEVATE RESPONSIBILITIES
Elevate agrees to:
- Collaborate in good faith
- Share agreed-upon resources
- Maintain program quality
- Provide regular communication
- Respect partner confidentiality

### 4. JOINT ACTIVITIES
Partners may collaborate on:
- Training program development
- Student recruitment
- Job placement activities
- Grant applications
- Community events
- Research and evaluation

### 5. INTELLECTUAL PROPERTY
Each party retains ownership of its intellectual property. Joint work will be addressed in separate agreements.

### 6. FUNDING
Financial arrangements will be documented in separate agreements as needed.

### 7. TERM AND TERMINATION
This agreement continues until terminated by either party with 30 days written notice.

### 8. ACKNOWLEDGMENT
By signing below, Partner acknowledges agreement to these partnership terms.

---

**Authorized Signature Required**',
  true
);

-- Comments
COMMENT ON TABLE mou_templates IS 'MOU agreement templates for different user types';
COMMENT ON TABLE mou_signatures IS 'Digital signatures for MOU agreements';
