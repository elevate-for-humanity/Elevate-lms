# User Flows Documentation

**Platform:** Elevate for Humanity Workforce Marketplace  
**Version:** 2.0.0  
**Last Updated:** January 4, 2026

---

## Table of Contents

1. [Student Flows](#student-flows)
2. [Partner Flows](#partner-flows)
3. [Employer Flows](#employer-flows)
4. [Admin Flows](#admin-flows)
5. [Compliance Flows](#compliance-flows)

---

## Student Flows

### 1. Student Registration & Onboarding

**Goal:** New user creates account and completes profile

**Steps:**

1. Visit homepage → Click "Get Started" or "Apply"
2. Fill registration form:
   - Email address
   - Password
   - Full name
   - Phone number (optional)
3. Verify email address
4. Complete profile:
   - Demographics
   - Education history
   - Employment status
   - Funding eligibility (WIOA, WRG, JRI)
5. Upload required documents:
   - ID verification
   - Proof of eligibility (if applicable)
6. Submit application
7. Receive confirmation email

**Success Criteria:**

- ✅ Account created
- ✅ Email verified
- ✅ Profile completed
- ✅ Documents uploaded
- ✅ Application submitted

**Pages Involved:**

- `/signup`
- `/verify-email`
- `/onboarding`
- `/onboarding/profile`
- `/onboarding/documents`
- `/onboarding/complete`

---

### 2. Browse & Enroll in Free Training

**Goal:** Student finds and enrolls in funded training program

**Steps:**

1. Login to account
2. Browse programs:
   - `/programs` - View all programs
   - Filter by:
     - Industry (Healthcare, Trades, Technology)
     - Duration
     - Location
     - Funding type
3. View program details:
   - `/programs/[slug]` - Program page
   - Read description
   - View curriculum
   - Check eligibility requirements
   - See funding options
4. Click "Apply for Free Training"
5. Complete application:
   - Confirm eligibility
   - Select funding source (WIOA, WRG, JRI)
   - Provide additional information
6. Submit application
7. Wait for approval (1-3 business days)
8. Receive approval notification
9. Complete enrollment:
   - Sign enrollment agreement
   - Review program schedule
   - Set up payment (if applicable)
10. Access course materials

**Success Criteria:**

- ✅ Program selected
- ✅ Application submitted
- ✅ Approval received
- ✅ Enrollment completed
- ✅ Course access granted

**Pages Involved:**

- `/programs`
- `/programs/[slug]`
- `/apply`
- `/apply/[programId]`
- `/enroll/success`
- `/courses/[courseId]`

---

### 3. Complete Course & Earn Certificate

**Goal:** Student completes all coursework and receives certificate

**Steps:**

1. Access course dashboard:
   - `/courses/[courseId]`
   - View course overview
   - See progress
   - Check upcoming lessons
2. Start first module:
   - `/courses/[courseId]/learn`
   - Watch video lesson
   - Read materials
   - Complete activities
3. Mark lesson complete
4. Progress to next lesson
5. Complete module quiz (if applicable)
6. Repeat for all modules
7. Complete final assessment
8. Receive completion notification
9. Download certificate:
   - `/certificates/[certificateId]`
   - PDF certificate
   - Digital badge
10. Share certificate:
    - LinkedIn
    - Email
    - Download

**Success Criteria:**

- ✅ All lessons completed
- ✅ All quizzes passed
- ✅ Final assessment passed
- ✅ Certificate generated
- ✅ Certificate downloaded

**Pages Involved:**

- `/courses/[courseId]`
- `/courses/[courseId]/learn`
- `/courses/[courseId]/lessons/[lessonId]`
- `/certificates/[certificateId]`

---

### 4. Job Placement Support

**Goal:** Student receives job placement assistance after completion

**Steps:**

1. Complete training program
2. Access career services:
   - `/career-services`
   - Resume building
   - Interview prep
   - Job search assistance
3. Update employment profile:
   - Job preferences
   - Salary expectations
   - Location preferences
4. View job opportunities:
   - `/jobs`
   - Matched positions
   - Partner employers
5. Apply to jobs:
   - One-click apply
   - Direct employer contact
6. Track applications:
   - `/dashboard/applications`
   - Application status
   - Interview schedules
7. Report employment:
   - `/dashboard/employment`
   - Employer information
   - Start date
   - Wage information

**Success Criteria:**

- ✅ Career services accessed
- ✅ Resume completed
- ✅ Jobs applied to
- ✅ Employment reported

**Pages Involved:**

- `/career-services`
- `/jobs`
- `/dashboard/applications`
- `/dashboard/employment`

---

## Partner Flows

### 1. Partner Registration & Approval

**Goal:** Training provider becomes approved partner

**Steps:**

1. Visit partner page:
   - `/partner`
   - Learn about partnership
   - View benefits
2. Click "Become a Partner"
3. Complete partner application:
   - `/partner-with-us`
   - Organization information
   - Training programs offered
   - Accreditation/licenses
   - References
4. Upload required documents:
   - Business license
   - Insurance certificates
   - Accreditation documents
   - W-9 form
5. Submit application
6. Admin review (3-5 business days)
7. Receive approval notification
8. Complete partner onboarding:
   - Sign partnership agreement
   - Set up payment information
   - Configure partner portal
9. Access partner dashboard

**Success Criteria:**

- ✅ Application submitted
- ✅ Documents uploaded
- ✅ Approval received
- ✅ Agreement signed
- ✅ Portal access granted

**Pages Involved:**

- `/partner`
- `/partner-with-us`
- `/partner/application`
- `/partner/onboarding`
- `/partner/dashboard`

---

### 2. List Training Program

**Goal:** Partner adds new training program to marketplace

**Steps:**

1. Login to partner portal
2. Navigate to programs:
   - `/partner/programs`
   - View existing programs
3. Click "Add New Program"
4. Complete program form:
   - Program name
   - Description
   - Duration
   - Schedule
   - Prerequisites
   - Pricing (if applicable)
   - Funding eligibility
5. Upload program materials:
   - Curriculum outline
   - Syllabus
   - Sample materials
6. Set enrollment capacity
7. Configure approval workflow
8. Submit for review
9. Admin approval (1-2 business days)
10. Program goes live

**Success Criteria:**

- ✅ Program created
- ✅ Materials uploaded
- ✅ Approval received
- ✅ Program published
- ✅ Accepting enrollments

**Pages Involved:**

- `/partner/programs`
- `/partner/programs/create`
- `/partner/programs/[programId]/edit`

---

### 3. Manage Student Enrollments

**Goal:** Partner tracks and manages enrolled students

**Steps:**

1. Access partner dashboard:
   - `/partner/dashboard`
   - View enrollment metrics
   - See pending approvals
2. Review new applications:
   - `/partner/enrollments/pending`
   - Student information
   - Eligibility verification
3. Approve/reject applications
4. View active students:
   - `/partner/enrollments/active`
   - Student roster
   - Contact information
   - Progress tracking
5. Record attendance:
   - `/partner/attendance`
   - Mark present/absent
   - Add notes
6. Track student progress:
   - `/partner/progress`
   - Completion status
   - Performance metrics
7. Generate reports:
   - `/partner/reports`
   - Attendance reports
   - Completion reports
   - Outcome reports

**Success Criteria:**

- ✅ Applications reviewed
- ✅ Students enrolled
- ✅ Attendance recorded
- ✅ Progress tracked
- ✅ Reports generated

**Pages Involved:**

- `/partner/dashboard`
- `/partner/enrollments`
- `/partner/attendance`
- `/partner/progress`
- `/partner/reports`

---

## Employer Flows

### 1. Employer Registration

**Goal:** Employer creates account to access talent pipeline

**Steps:**

1. Visit employer page:
   - `/employers`
   - Learn about hiring graduates
2. Click "Hire Graduates"
3. Complete employer registration:
   - Company information
   - Industry
   - Hiring needs
   - Contact information
4. Verify company:
   - Business verification
   - Tax ID
5. Access employer dashboard

**Success Criteria:**

- ✅ Account created
- ✅ Company verified
- ✅ Dashboard access

**Pages Involved:**

- `/employers`
- `/employer/signup`
- `/employer/dashboard`

---

### 2. Post Job Opening

**Goal:** Employer posts job for trained candidates

**Steps:**

1. Login to employer dashboard
2. Click "Post Job"
3. Complete job posting:
   - Job title
   - Description
   - Requirements
   - Salary range
   - Location
   - Required certifications
4. Select target programs:
   - CNA graduates
   - HVAC graduates
   - etc.
5. Publish job posting
6. Receive candidate applications
7. Review candidates:
   - View profiles
   - See certifications
   - Check completion status
8. Contact candidates
9. Schedule interviews
10. Report hires

**Success Criteria:**

- ✅ Job posted
- ✅ Candidates received
- ✅ Interviews scheduled
- ✅ Hires reported

**Pages Involved:**

- `/employer/dashboard`
- `/employer/jobs/create`
- `/employer/candidates`
- `/employer/hires`

---

## Admin Flows

### 1. Review & Approve Applications

**Goal:** Admin reviews and approves student applications

**Steps:**

1. Login to admin panel:
   - `/admin/dashboard`
   - View pending applications
2. Access applications queue:
   - `/admin/applications`
   - Filter by:
     - Program
     - Funding source
     - Date submitted
3. Review application:
   - Student information
   - Eligibility documents
   - Funding verification
4. Verify eligibility:
   - Check WIOA eligibility
   - Verify income requirements
   - Confirm documentation
5. Approve or reject:
   - Approve → Student notified
   - Reject → Reason provided
6. Process approved applications:
   - Create enrollment
   - Assign to program holder
   - Set up funding

**Success Criteria:**

- ✅ Application reviewed
- ✅ Eligibility verified
- ✅ Decision made
- ✅ Student notified
- ✅ Enrollment created (if approved)

**Pages Involved:**

- `/admin/dashboard`
- `/admin/applications`
- `/admin/applications/[applicationId]`

---

### 2. Generate Compliance Reports

**Goal:** Admin generates WIOA compliance reports

**Steps:**

1. Access reporting dashboard:
   - `/admin/reports`
   - View report types
2. Select report type:
   - WIOA quarterly report
   - DOL compliance report
   - Outcome tracking
   - Employment verification
3. Set report parameters:
   - Date range
   - Programs included
   - Funding sources
4. Generate report:
   - Click "Generate"
   - Wait for processing
5. Review report:
   - Enrollment numbers
   - Completion rates
   - Employment outcomes
   - Wage data
6. Export report:
   - PDF format
   - Excel format
   - CSV format
7. Submit to workforce board

**Success Criteria:**

- ✅ Report generated
- ✅ Data accurate
- ✅ Report exported
- ✅ Submitted to board

**Pages Involved:**

- `/admin/reports`
- `/admin/reports/wioa`
- `/admin/reports/generate`

---

## Compliance Flows

### 1. WIOA Enrollment Tracking

**Goal:** Track WIOA-funded enrollments for compliance

**Flow:**

```
Student Application
  ↓
Eligibility Verification
  ↓
WIOA Approval
  ↓
Enrollment Created
  ↓
Attendance Tracking
  ↓
Progress Monitoring
  ↓
Completion Tracking
  ↓
Employment Verification
  ↓
Outcome Reporting
```

**Data Collected:**

- Demographics
- Income verification
- Education level
- Employment status
- Barriers to employment
- Training attendance
- Completion status
- Employment outcomes
- Wage information

**Reports Generated:**

- Quarterly WIOA reports
- Annual performance reports
- Outcome tracking reports

---

### 2. Audit Trail

**Goal:** Maintain complete audit trail for compliance

**Tracked Events:**

- User registrations
- Application submissions
- Approval decisions
- Enrollment changes
- Attendance records
- Progress updates
- Certificate issuance
- Employment reports
- Data modifications

**Audit Log Fields:**

- Timestamp
- User ID
- Action type
- Resource type
- Resource ID
- Old value
- New value
- IP address
- User agent

**Access:**

- `/admin/audit-logs`
- Filter by:
  - Date range
  - User
  - Action type
  - Resource type

---

## Key Metrics

### Student Success Metrics

- **Enrollment Rate:** % of applicants who enroll
- **Completion Rate:** % of enrolled students who complete
- **Time to Completion:** Average days to complete
- **Employment Rate:** % of graduates employed within 90 days
- **Wage Gain:** Average wage increase post-training

### Partner Performance Metrics

- **Student Capacity:** Total enrollment capacity
- **Utilization Rate:** % of capacity filled
- **Completion Rate:** % of students who complete
- **Student Satisfaction:** Average rating
- **Employment Outcomes:** % of graduates employed

### Platform Health Metrics

- **Active Users:** Daily/monthly active users
- **Enrollment Growth:** Month-over-month growth
- **Course Completion:** Overall completion rate
- **Partner Growth:** New partners per month
- **Revenue:** Monthly recurring revenue

---

## User Journey Maps

### Student Journey

```
Awareness → Interest → Application → Approval → Enrollment → Learning → Completion → Employment
    ↓          ↓            ↓            ↓            ↓            ↓            ↓            ↓
Homepage   Programs    Apply Form   Wait 1-3d   Sign Docs   Take Course  Get Cert    Find Job
```

### Partner Journey

```
Discovery → Application → Approval → Onboarding → List Programs → Enroll Students → Track Progress → Get Paid
    ↓           ↓            ↓            ↓              ↓                ↓                ↓            ↓
Partner    Apply Form   Wait 3-5d   Sign Docs    Create Program    Approve Apps    Record Data   Revenue Share
```

### Employer Journey

```
Discovery → Registration → Post Jobs → Review Candidates → Interview → Hire → Report Outcomes
    ↓            ↓             ↓              ↓               ↓         ↓           ↓
Employers   Sign Up    Create Posting   View Profiles   Schedule   Onboard   Track Success
```

---

## Touchpoints

### Email Notifications

**Student:**

- Welcome email
- Email verification
- Application received
- Application approved/rejected
- Enrollment confirmation
- Course reminders
- Completion congratulations
- Certificate delivery
- Job opportunities

**Partner:**

- Application received
- Approval notification
- New enrollment
- Attendance reminders
- Report due dates
- Payment notifications

**Admin:**

- New applications
- Pending approvals
- System alerts
- Report deadlines

### In-App Notifications

- New messages
- Course updates
- Assignment due dates
- Achievement unlocked
- Certificate ready
- Job matches

---

## Support Touchpoints

### Student Support

- **Live Chat:** Available during business hours
- **Email:** support@www.elevateforhumanity.org
- **Phone:** 317-314-3757
- **Help Center:** `/help`
- **FAQ:** `/faq`

### Partner Support

- **Dedicated Account Manager**
- **Partner Portal Help:** `/partner/help`
- **Technical Support:** partners@www.elevateforhumanity.org
- **Training Resources:** `/partner/resources`

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Maintained By:** Product Team
