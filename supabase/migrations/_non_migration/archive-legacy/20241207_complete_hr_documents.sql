-- ============================================================================
-- COMPLETE HR DOCUMENT SYSTEM
-- Student Handbooks, NDAs, Non-Competes, MOUs, Onboarding Packages
-- ============================================================================

-- Document Types Table
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- handbook, nda, non_compete, mou, onboarding, policy
  description TEXT,
  requires_signature BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR Documents (replaces and extends mou_templates)
CREATE TABLE IF NOT EXISTS hr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id UUID REFERENCES document_types(id),
  title TEXT NOT NULL,
  user_type TEXT NOT NULL, -- student, staff, employer, partner, program_holder, all
  version TEXT NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL, -- Full document text in markdown
  pdf_url TEXT, -- Optional PDF version
  is_active BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  requires_witness BOOLEAN DEFAULT false,
  expiration_days INTEGER, -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hr_docs_type ON hr_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_hr_docs_user_type ON hr_documents(user_type);
CREATE INDEX IF NOT EXISTS idx_hr_docs_active ON hr_documents(is_active);

-- Document Signatures (replaces mou_signatures)
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES hr_documents(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_name TEXT,
  signature_data TEXT, -- Base64 signature image or typed name
  witness_name TEXT,
  witness_signature TEXT,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_signatures_user ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_doc ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_valid ON document_signatures(is_valid);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_expires ON document_signatures(expires_at);

-- Onboarding Packages (groups of documents)
CREATE TABLE IF NOT EXISTS onboarding_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package Documents (many-to-many)
CREATE TABLE IF NOT EXISTS package_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES onboarding_packages(id) ON DELETE CASCADE,
  document_id UUID REFERENCES hr_documents(id) ON DELETE CASCADE,
  order_number INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, document_id)
);

-- User Onboarding Progress
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES onboarding_packages(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_complete BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, package_id)
);

-- Row Level Security
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active document types"
  ON document_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active HR documents"
  ON hr_documents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view own signatures"
  ON document_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signatures"
  ON document_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active packages"
  ON onboarding_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view package documents"
  ON package_documents FOR SELECT
  USING (true);

CREATE POLICY "Users can view own progress"
  ON user_onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage all"
  ON document_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage documents"
  ON hr_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert Document Types
INSERT INTO document_types (name, category, description, requires_signature) VALUES
('Student Handbook', 'handbook', 'Complete guide for students including policies, procedures, and expectations', true),
('Staff Handbook', 'handbook', 'Employee handbook with policies, benefits, and procedures', true),
('Non-Disclosure Agreement', 'nda', 'Confidentiality agreement protecting proprietary information', true),
('Non-Compete Agreement', 'non_compete', 'Agreement restricting competitive activities', true),
('Student MOU', 'mou', 'Memorandum of Understanding for student enrollment', true),
('Program Holder MOU', 'mou', 'Partnership agreement for program holders', true),
('Staff MOU', 'mou', 'Employment agreement for staff members', true),
('Employer Partnership MOU', 'mou', 'Partnership agreement with employers', true),
('Partner Organization MOU', 'mou', 'Collaboration agreement with partner organizations', true),
('Code of Conduct', 'policy', 'Behavioral expectations and standards', true),
('Data Privacy Policy', 'policy', 'Information on data collection and usage', false),
('Equal Opportunity Policy', 'policy', 'Non-discrimination and equal opportunity statement', false),
('Safety Policy', 'policy', 'Workplace and training safety guidelines', true),
('Onboarding Checklist', 'onboarding', 'Step-by-step onboarding tasks', false);

-- Insert Student Handbook
INSERT INTO hr_documents (document_type_id, title, user_type, version, content, requires_signature) VALUES
(
  (SELECT id FROM document_types WHERE name = 'Student Handbook'),
  'Elevate for Humanity Student Handbook',
  'student',
  '2024.1',
  '# ELEVATE FOR HUMANITY STUDENT HANDBOOK

## Welcome to Your Future

Welcome to Elevate for Humanity! This handbook contains everything you need to know about our programs, policies, and your journey to a successful career.

---

## TABLE OF CONTENTS

1. Mission & Vision
2. Program Overview
3. Student Rights & Responsibilities
4. Academic Policies
5. Attendance Policy
6. Code of Conduct
7. Support Services
8. Grievance Procedures
9. Completion & Certification
10. Job Placement Services

---

## 1. MISSION & VISION

### Our Mission
Elevate for Humanity connects individuals to 100% free workforce training that leads to real careers. We provide comprehensive support from enrollment through job placement, removing barriers and creating pathways to economic mobility.

### Our Vision
A community where every person has access to quality career training and the support needed to succeed, regardless of their background or circumstances.

### Core Values
- **Accessibility**: Training is 100% free with no hidden costs
- **Quality**: Industry-recognized certifications and expert instruction
- **Support**: Wraparound services addressing barriers to success
- **Outcomes**: Focus on job placement and career advancement
- **Equity**: Equal opportunity for all students

---

## 2. PROGRAM OVERVIEW

### What We Offer
- 30+ career training programs
- Industry-recognized certifications
- Hands-on training and real-world experience
- Job placement assistance
- Support services (housing, transportation, childcare assistance)
- Career counseling and mentorship

### Program Duration
Programs range from 4 weeks to 12 months depending on the career path.

### 100% Free Training
All training is government-funded through:
- WIOA (Workforce Innovation and Opportunity Act)
- Workforce Ready Grants
- State workforce development funds
- Federal training programs

**You pay NOTHING. No tuition. No fees. No debt.**

---

## 3. STUDENT RIGHTS & RESPONSIBILITIES

### Your Rights
You have the right to:
- Quality instruction and training materials
- A safe, respectful learning environment
- Reasonable accommodations for disabilities
- Privacy of your educational records
- Fair treatment without discrimination
- Access to support services
- File grievances without retaliation

### Your Responsibilities
You are responsible for:
- Attending all scheduled classes and training
- Completing assignments on time
- Maintaining satisfactory academic progress (70% or higher)
- Following the code of conduct
- Communicating with instructors and staff
- Notifying us of barriers to completion
- Participating in job placement activities
- Providing accurate information for reporting

---

## 4. ACADEMIC POLICIES

### Satisfactory Academic Progress
Students must maintain:
- 70% or higher on all assessments
- Completion of all required coursework
- Timely submission of assignments

### Grading Scale
- A: 90-100% (Excellent)
- B: 80-89% (Good)
- C: 70-79% (Satisfactory)
- F: Below 70% (Unsatisfactory)

### Academic Support
If you are struggling:
- Request tutoring (free)
- Meet with your instructor
- Contact your student advisor
- Access online resources

### Retake Policy
Students who fail an assessment may retake it once. Additional attempts require instructor approval.

---

## 5. ATTENDANCE POLICY

### Attendance Requirements
- Minimum 80% attendance required
- Arrive on time for all sessions
- Notify staff of absences in advance when possible

### Excused Absences
- Medical emergencies (documentation required)
- Family emergencies
- Court appearances
- Religious observances

### Unexcused Absences
- More than 3 unexcused absences may result in dismissal
- Excessive tardiness counts as absences

### Make-Up Work
Students must complete make-up work for all absences within one week.

---

## 6. CODE OF CONDUCT

### Expected Behavior
Students must:
- Treat everyone with respect
- Maintain professional demeanor
- Follow safety protocols
- Arrive prepared for class
- Use appropriate language
- Dress appropriately for training environment

### Prohibited Behavior
The following will result in disciplinary action:
- Harassment or discrimination
- Violence or threats
- Substance abuse
- Theft or dishonesty
- Disruptive behavior
- Academic dishonesty (cheating, plagiarism)
- Violation of safety rules

### Disciplinary Process
1. **Verbal Warning**: First minor offense
2. **Written Warning**: Second offense or serious violation
3. **Probation**: Continued violations
4. **Dismissal**: Severe or repeated violations

### Appeal Process
Students may appeal disciplinary decisions within 5 business days.

---

## 7. SUPPORT SERVICES

### Available Services
- **Academic Support**: Tutoring, study groups, learning resources
- **Career Counseling**: Resume help, interview prep, job search
- **Case Management**: Addressing barriers to completion
- **Mental Health**: Counseling referrals and support
- **Housing Assistance**: Emergency housing resources
- **Transportation**: Bus passes, gas cards, ride assistance
- **Childcare**: Referrals and financial assistance
- **Technology**: Loaner laptops, internet access
- **Food Assistance**: Food pantry, meal programs

### How to Access Services
Contact your student advisor or visit the support services office.

---

## 8. GRIEVANCE PROCEDURES

### Filing a Complaint
If you have a concern:
1. Speak with your instructor or advisor
2. If unresolved, contact the Program Director
3. If still unresolved, submit written grievance to Administration

### Grievance Form
Available at the front desk or online at elevateforhumanity.org/grievance

### Investigation Process
- Grievances reviewed within 5 business days
- Investigation completed within 15 business days
- Written response provided to student

### No Retaliation
Students will not face retaliation for filing legitimate grievances.

---

## 9. COMPLETION & CERTIFICATION

### Completion Requirements
To complete your program:
- Maintain 70% or higher grade average
- Complete all required coursework
- Meet attendance requirements
- Pass final assessments
- Complete job readiness training

### Certifications
Upon completion, you will receive:
- Program completion certificate from Elevate for Humanity
- Industry certification (varies by program)
- Digital badge for LinkedIn
- Official transcript

### Graduation Ceremony
We celebrate your success! Graduates are invited to our quarterly graduation ceremony.

---

## 10. JOB PLACEMENT SERVICES

### Career Services
We help you find employment:
- Resume writing and review
- Interview preparation and practice
- Job search strategies
- Employer connections
- Job fairs and hiring events
- Follow-up support after placement

### Employer Network
We partner with 100+ employers actively hiring our graduates.

### Job Placement Commitment
We work with you until you are employed in your field.

---

## IMPORTANT CONTACTS

**Main Office**: 317-314-3757
**Email**: support@elevateforhumanity.org
**Website**: elevateforhumanity.org
**Address**: Indianapolis, IN

**Emergency**: 911
**Crisis Hotline**: 988

---

## ACKNOWLEDGMENT

By signing this handbook, you acknowledge that you have received, read, and understand the policies and procedures outlined herein. You agree to comply with all policies and understand that violations may result in disciplinary action up to and including dismissal from the program.

**Student Signature Required**

---

*This handbook is subject to change. Students will be notified of any updates.*

*Effective Date: January 2024*
*Version: 2024.1*',
  true
);

-- Insert Staff NDA
INSERT INTO hr_documents (document_type_id, title, user_type, version, content, requires_signature) VALUES
(
  (SELECT id FROM document_types WHERE name = 'Non-Disclosure Agreement'),
  'Employee Non-Disclosure Agreement',
  'staff',
  '1.0',
  '# NON-DISCLOSURE AGREEMENT (NDA)

## Elevate for Humanity

**Effective Date:** [DATE]

This Non-Disclosure Agreement ("Agreement") is entered into between Elevate for Humanity ("Company") and the undersigned employee ("Employee").

---

## 1. PURPOSE

During employment, Employee will have access to confidential and proprietary information. This Agreement protects Company''s legitimate business interests.

---

## 2. CONFIDENTIAL INFORMATION

Confidential Information includes, but is not limited to:

### Student Information
- Student names, addresses, contact information
- Academic records and progress
- Personal circumstances and barriers
- Medical or disability information
- Financial information
- Any information protected by FERPA

### Business Information
- Business strategies and plans
- Financial data and projections
- Partner and employer relationships
- Proprietary training materials
- Software and technology systems
- Marketing strategies
- Grant applications and funding sources

### Operational Information
- Internal processes and procedures
- Staff information and compensation
- Vendor and supplier relationships
- Pricing and cost structures

---

## 3. OBLIGATIONS

Employee agrees to:

### Confidentiality
- Keep all Confidential Information strictly confidential
- Not disclose to any third party without written authorization
- Use Confidential Information only for job duties
- Protect information with reasonable security measures

### Student Privacy (FERPA Compliance)
- Never discuss students outside of work context
- Never share student information on social media
- Never access student records without legitimate need
- Follow all FERPA regulations

### Data Security
- Use strong passwords and change regularly
- Never share login credentials
- Lock computer when away from desk
- Report security breaches immediately
- Follow all IT security policies

---

## 4. EXCEPTIONS

This Agreement does not apply to information that:
- Is publicly available
- Was known to Employee before employment
- Is required to be disclosed by law (with notice to Company)

---

## 5. RETURN OF MATERIALS

Upon termination of employment, Employee must:
- Return all Company property
- Delete all Confidential Information from personal devices
- Return all documents, files, and materials
- Certify compliance in writing

---

## 6. DURATION

This Agreement remains in effect:
- During employment
- After termination of employment (indefinitely)

---

## 7. REMEDIES

Breach of this Agreement may result in:
- Immediate termination of employment
- Legal action for damages
- Injunctive relief
- Criminal prosecution (if applicable)

---

## 8. ACKNOWLEDGMENT

Employee acknowledges:
- Reading and understanding this Agreement
- Receiving training on confidentiality requirements
- Understanding the consequences of breach
- Agreeing to comply with all terms

---

**Employee Signature Required**

**Date:** _______________

---

*This is a legally binding agreement. Consult an attorney if you have questions.*',
  true
);

-- Insert Staff Non-Compete
INSERT INTO hr_documents (document_type_id, title, user_type, version, content, requires_signature) VALUES
(
  (SELECT id FROM document_types WHERE name = 'Non-Compete Agreement'),
  'Employee Non-Compete Agreement',
  'staff',
  '1.0',
  '# NON-COMPETE AGREEMENT

## Elevate for Humanity

**Effective Date:** [DATE]

This Non-Compete Agreement ("Agreement") is between Elevate for Humanity ("Company") and the undersigned employee ("Employee").

---

## 1. PURPOSE

Company invests significant resources in developing relationships, training programs, and business strategies. This Agreement protects those investments.

---

## 2. RESTRICTIONS

During employment and for 12 months after termination, Employee agrees NOT to:

### Competitive Employment
- Work for a direct competitor in the workforce training industry
- Provide services to competitors in a similar capacity
- Start a competing workforce training business

### Geographic Scope
This restriction applies within:
- Marion County, Indiana
- Counties where Company operates programs
- Areas where Company has active partnerships

### Solicitation Restrictions
Employee agrees NOT to:
- Solicit Company students to enroll in competing programs
- Solicit Company employees to leave employment
- Solicit Company partners or employers to switch providers
- Use Company contact lists for competitive purposes

---

## 3. PERMITTED ACTIVITIES

This Agreement does NOT restrict:
- Employment in non-competing industries
- General workforce development work that is not competitive
- Volunteer work or community service
- Personal career advancement in non-competing roles

---

## 4. REASONABLENESS

Employee acknowledges that these restrictions are:
- Reasonable in scope and duration
- Necessary to protect legitimate business interests
- Not unduly burdensome to Employee''s career

---

## 5. CONSIDERATION

In exchange for this Agreement, Company provides:
- Employment opportunity
- Training and professional development
- Access to proprietary information and relationships
- Competitive compensation and benefits

---

## 6. ENFORCEMENT

If Employee breaches this Agreement:
- Company may seek injunctive relief
- Employee may be liable for damages
- Company may recover attorney fees and costs

---

## 7. SEVERABILITY

If any provision is found unenforceable, the remaining provisions remain in effect.

---

## 8. ACKNOWLEDGMENT

Employee acknowledges:
- Reading and understanding this Agreement
- Having opportunity to consult an attorney
- Agreeing voluntarily to these restrictions
- Understanding the consequences of breach

---

**Employee Signature Required**

**Date:** _______________

---

*This is a legally binding agreement. Consult an attorney if you have questions.*',
  true
);

-- Create Onboarding Packages
INSERT INTO onboarding_packages (name, user_type, description, is_active) VALUES
('Student Complete Onboarding', 'student', 'Complete onboarding package for new students including handbook, MOU, and policies', true),
('Staff Complete Onboarding', 'staff', 'Complete HR onboarding for new employees including handbook, NDA, non-compete, and policies', true),
('Program Holder Onboarding', 'program_holder', 'Partnership onboarding for program holders including MOU and policies', true),
('Employer Partnership Package', 'employer', 'Onboarding documents for employer partners', true),
('Partner Organization Package', 'partner', 'Onboarding documents for partner organizations', true);

-- Link documents to packages (will need to be updated with actual document IDs after creation)
-- This is a template - actual IDs will be different

COMMENT ON TABLE hr_documents IS 'All HR documents including handbooks, NDAs, non-competes, MOUs, and policies';
COMMENT ON TABLE document_signatures IS 'Digital signatures for all HR documents';
COMMENT ON TABLE onboarding_packages IS 'Grouped sets of documents for complete onboarding';
COMMENT ON TABLE user_onboarding_progress IS 'Track user progress through onboarding packages';
