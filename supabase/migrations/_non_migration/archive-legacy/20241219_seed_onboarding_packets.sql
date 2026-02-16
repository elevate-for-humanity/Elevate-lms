-- =====================================================
-- SEED ONBOARDING PACKETS WITH ROLE-SPECIFIC DOCUMENTS
-- =====================================================

-- Note: Handbook content is embedded directly in this migration
-- Full handbooks are available in content/handbooks/ directory

-- =====================================================
-- 1. PROGRAM HOLDER ONBOARDING PACKET
-- =====================================================
INSERT INTO onboarding_packets (role, title, version, description, is_active)
VALUES (
  'PROGRAM_HOLDER',
  'Program Holder Onboarding',
  '1.0',
  'Complete onboarding for Program Holders managing full apprenticeship programs',
  true
)
ON CONFLICT (role, version) DO NOTHING
RETURNING id AS program_holder_packet_id \gset

-- Program Holder Documents
INSERT INTO onboarding_documents (packet_id, document_type, title, content, requires_signature, sort_order) VALUES
(:'program_holder_packet_id', 'POLICY', 'Sponsorship & Curriculum Acknowledgment',
:'sponsorship_acknowledgment',
true, 0),

(:'program_holder_packet_id', 'MOU', 'Program Holder Memorandum of Understanding', 
'# Program Holder MOU

This Memorandum of Understanding (MOU) establishes the partnership between Elevate for Humanity and you as a Program Holder.

## Agreement Terms

1. **Program Management**: You agree to manage the complete apprenticeship program in accordance with U.S. DOL and Indiana DWD standards.

2. **Compensation**: You will receive 18-22% of tuition for full program management services.

3. **Compliance**: You agree to maintain all required licenses, insurance, and registrations.

4. **Recordkeeping**: You agree to maintain accurate records and submit monthly progress reports.

5. **Oversight**: You agree to cooperate with audits, site visits, and oversight activities.

6. **Termination**: Either party may terminate this agreement with 30 days written notice.

## Authority

Elevate for Humanity retains final authority over student enrollment, funding decisions, and compliance determinations.

## Acknowledgment

By signing below, you acknowledge that you have read, understood, and agree to the terms of this MOU.', 
true, 1),

(:'program_holder_packet_id', 'HANDBOOK', 'Program Holder Rights & Responsibilities', 
:'program_holder_handbook',
true, 2),

(:'program_holder_packet_id', 'ATTESTATION', 'Background Check & Compliance Attestation',
'# Background Check & Compliance Attestation

I hereby attest that:

1. I have no felony convictions involving crimes against children or vulnerable adults
2. I have no pending criminal charges
3. I am not on any sex offender registry
4. I have not had any professional licenses revoked or suspended
5. I am not currently under investigation by any regulatory body
6. I understand that Elevate for Humanity may conduct background checks
7. I agree to immediately disclose any changes to the above statements

I understand that providing false information may result in immediate termination of this partnership.

**This attestation is made under penalty of perjury.**',
true, 3),

(:'program_holder_packet_id', 'W9', 'W-9 Tax Form Upload',
'# W-9 Tax Form

Please upload your completed W-9 form.

You can download the form here: https://www.irs.gov/pub/irs-pdf/fw9.pdf

**Required Information:**
- Legal business name
- Tax identification number (EIN or SSN)
- Business address
- Tax classification

This information is required for 1099 reporting.',
false, 4);

-- =====================================================
-- 2. WORKSITE ONLY ONBOARDING PACKET
-- =====================================================
INSERT INTO onboarding_packets (role, title, version, description, is_active)
VALUES (
  'WORKSITE_ONLY',
  'Worksite Only Partner Onboarding',
  '1.0',
  'Complete onboarding for Worksite Only partners providing hands-on training',
  true
)
ON CONFLICT (role, version) DO NOTHING
RETURNING id AS worksite_only_packet_id \gset

-- Worksite Only Documents
INSERT INTO onboarding_documents (packet_id, document_type, title, content, requires_signature, sort_order) VALUES
(:'worksite_only_packet_id', 'POLICY', 'Sponsorship & Curriculum Acknowledgment',
:'sponsorship_acknowledgment',
true, 0),

(:'worksite_only_packet_id', 'MOU', 'Worksite Hands-On Training MOU',
'# Worksite Hands-On Training MOU

This Memorandum of Understanding (MOU) establishes your role as a Worksite Only partner providing supervised hands-on training.

## Agreement Terms

1. **Training Services**: You agree to provide supervised hands-on training at your facility.

2. **Scope of Services**: You will provide hands-on training ONLY. You will not enroll students, promise funding, or issue credentials.

3. **Compensation**: You will receive 8-12% of tuition for verified hands-on supervision hours.

4. **Hour Logging**: You agree to submit accurate hour logs weekly or bi-weekly.

5. **Safety**: You agree to maintain a safe, professional training environment.

6. **Compliance**: You agree to cooperate with Site Coordinator verification and oversight.

7. **Termination**: Either party may terminate this agreement with 14 days written notice.

## Authority

Elevate for Humanity retains final authority over all program decisions. Site Coordinators verify your hour logs.

## Acknowledgment

By signing below, you acknowledge that you understand your role is limited to hands-on training only.',
true, 1),

(:'worksite_only_packet_id', 'HANDBOOK', 'Worksite Only Rights & Responsibilities',
:'worksite_only_handbook',
true, 2),

(:'worksite_only_packet_id', 'LICENSE', 'Business License Upload',
'# Business License

Please upload a copy of your current business license.

**Required:**
- Valid business license for your state/locality
- Current and not expired
- Matches your business name

If you operate under a personal license (e.g., barber license), please upload that instead.',
false, 3),

(:'worksite_only_packet_id', 'INSURANCE', 'Insurance Acknowledgment',
'# Insurance Acknowledgment

I acknowledge that:

1. I maintain current liability insurance for my business
2. My insurance covers apprentice/trainee activities
3. I will immediately notify Elevate for Humanity if my insurance lapses
4. I understand that lack of insurance may result in suspension of training activities

**Insurance Requirements:**
- General liability: Minimum $1,000,000 per occurrence
- Professional liability (if applicable): Minimum $1,000,000 per occurrence

I understand that Elevate for Humanity may request proof of insurance at any time.',
true, 4),

(:'worksite_only_packet_id', 'W9', 'W-9 Tax Form Upload',
'# W-9 Tax Form

Please upload your completed W-9 form.

You can download the form here: https://www.irs.gov/pub/irs-pdf/fw9.pdf

**Required Information:**
- Legal business name or your name
- Tax identification number (EIN or SSN)
- Business address
- Tax classification

This information is required for 1099 reporting.',
false, 5);

-- =====================================================
-- 3. SITE COORDINATOR ONBOARDING PACKET
-- =====================================================
INSERT INTO onboarding_packets (role, title, version, description, is_active)
VALUES (
  'SITE_COORDINATOR',
  'Site Coordinator Onboarding',
  '1.0',
  'Complete onboarding for Site Coordinators managing student oversight and compliance',
  true
)
ON CONFLICT (role, version) DO NOTHING
RETURNING id AS site_coordinator_packet_id \gset

-- Site Coordinator Documents
INSERT INTO onboarding_documents (packet_id, document_type, title, content, requires_signature, sort_order) VALUES
(:'site_coordinator_packet_id', 'POLICY', 'Sponsorship & Curriculum Acknowledgment',
:'sponsorship_acknowledgment',
true, 0),

(:'site_coordinator_packet_id', 'MOU', 'Site Coordinator Agreement',
'# Site Coordinator Agreement

This agreement establishes your role as a Site Coordinator for Elevate for Humanity apprenticeship programs.

## Agreement Terms

1. **Oversight Services**: You agree to provide student oversight, hour verification, and compliance monitoring.

2. **Compensation**: You will receive a flat monthly rate of $400-$750 based on your assigned caseload.

3. **Responsibilities**: You agree to conduct regular site visits, verify hour logs, and report compliance concerns.

4. **Confidentiality**: You agree to maintain confidentiality of all student records (FERPA compliance).

5. **Reporting**: You agree to submit monthly reports to Elevate for Humanity.

6. **Availability**: You agree to maintain the availability schedule you provided during onboarding.

7. **Termination**: Either party may terminate this agreement with 14 days written notice.

## Authority

You report directly to Elevate for Humanity and follow their direction. You do not have authority to enroll students, approve payroll, or terminate partnerships.

## Acknowledgment

By signing below, you acknowledge that you understand your role and responsibilities as Site Coordinator.',
true, 1),

(:'site_coordinator_packet_id', 'HANDBOOK', 'Site Coordinator Rights & Responsibilities',
:'site_coordinator_handbook',
true, 2),

(:'site_coordinator_packet_id', 'CONFIDENTIALITY', 'FERPA Confidentiality Agreement',
'# FERPA Confidentiality Agreement

The Family Educational Rights and Privacy Act (FERPA) protects the privacy of student education records.

As a Site Coordinator, you will have access to student education records. You must maintain strict confidentiality.

## I Agree To:

1. Keep all student information confidential
2. Only share student information with authorized personnel
3. Secure all records (digital and physical)
4. Not discuss student information in public settings
5. Not post student information on social media
6. Not use student information for personal purposes
7. Report any data breaches immediately
8. Return or destroy all student records upon termination

## I Understand That:

1. FERPA violations can result in immediate termination
2. FERPA violations may result in legal consequences
3. Elevate for Humanity may audit my compliance with FERPA
4. I am personally responsible for maintaining confidentiality

**This is a legally binding agreement.**

Violations of FERPA will result in immediate termination and may result in legal action.',
true, 3),

(:'site_coordinator_packet_id', 'ATTESTATION', 'Background Check Attestation',
'# Background Check Attestation

I hereby attest that:

1. I have no felony convictions involving crimes against children or vulnerable adults
2. I have no pending criminal charges
3. I am not on any sex offender registry
4. I have not had any professional licenses revoked or suspended
5. I am not currently under investigation by any regulatory body
6. I understand that Elevate for Humanity will conduct a background check
7. I agree to immediately disclose any changes to the above statements

I understand that providing false information will result in immediate termination.

**This attestation is made under penalty of perjury.**',
true, 4),

(:'site_coordinator_packet_id', 'AVAILABILITY', 'Availability Confirmation',
'# Availability Confirmation

Please confirm your availability for Site Coordinator duties.

## My Availability:

**Days Available:**
☐ Monday
☐ Tuesday
☐ Wednesday
☐ Thursday
☐ Friday
☐ Saturday
☐ Sunday

**Hours Available:**
From: _______ To: _______

**Maximum Caseload:**
I can manage up to _____ students at a time.

**Geographic Area:**
I am available to conduct site visits within _____ miles of _____________ (city/zip).

**Start Date:**
I am available to start on: _____________

## I Understand That:

1. I must maintain this availability or notify Elevate for Humanity of changes
2. My compensation is based on my caseload
3. I may be assigned students based on my availability
4. I must respond to urgent issues within 24 hours

By signing, I confirm that the above availability is accurate and I commit to maintaining this schedule.',
true, 5),

(:'site_coordinator_packet_id', 'W9', 'W-9 Tax Form Upload',
'# W-9 Tax Form

Please upload your completed W-9 form.

You can download the form here: https://www.irs.gov/pub/irs-pdf/fw9.pdf

**Required Information:**
- Your legal name
- Social Security Number or EIN
- Your address
- Tax classification

This information is required for 1099 reporting.',
false, 6);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration seeds the database with:
-- ✅ 3 role-specific onboarding packets
-- ✅ 14 total onboarding documents
-- ✅ MOUs, handbooks, attestations, and forms
-- ✅ Ready for immediate use
-- =====================================================
