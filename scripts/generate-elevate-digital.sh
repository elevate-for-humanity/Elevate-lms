#!/usr/bin/env bash
set -euo pipefail

DOC_DIR="docs/elevate"
mkdir -p "$DOC_DIR"

echo "📘 Generating Digital Elevate Handbook Package..."
echo ""

##############################################
# 1. STUDENT HANDBOOK
##############################################
cat << 'EOF' > "$DOC_DIR/student_handbook.md"
# Elevate for Humanity  
## Student Success Handbook  
Single-Spaced • Humanized • Credentialed

Welcome to Elevate for Humanity! You are joining a community committed to helping you build real skills, earn recognized credentials, and move confidently into the workforce.

---

## OUR PROMISE
- Training that leads to real jobs  
- Credentialed programs  
- Support at every step  
- Mobile-friendly, easy learning  
- Help available anytime at **317-314-3757**

---

## YOUR DASHBOARD
Everything lives inside your Student Portal:
https://elevateconnectsdirectory.org/lms/dashboard

Inside your portal you can:
- Complete orientation  
- Upload ID  
- View program assignment  
- Track progress  
- Receive messages  
- Download certificates after completion  

---

## AVAILABLE PROGRAMS
- **CNA** - Certified Nursing Assistant  
- **Barber Apprenticeship** - State-approved apprenticeship  
- **HVAC Technician** - Heating, ventilation, and air conditioning  
- **Building Tech** - Building maintenance and facilities  
- **Workforce Readiness** - Essential workplace skills  

Each program is credentialed and tied directly to real employment pathways.

---

## YOUR JOURNEY

### Step 1 — Enroll
Go to: https://elevateconnectsdirectory.org

Enrollment takes less than 5 minutes.

### Step 2 — Create Account
Use your phone or email to log in.

### Step 3 — Orientation
Complete the online Elevate orientation inside your dashboard.

### Step 4 — Upload ID
Submit a clear photo of your ID and selfie for verification.

### Step 5 — Program Assignment
You will be assigned to a CNA school, Barber shop, HVAC provider, or Building Tech site.

### Step 6 — Begin Training
Attend class, stay engaged, communicate with your instructor.

### Step 7 — Certification
Receive your Elevate certificate with a public serial number that anyone can verify.

### Step 8 — Employment
We help connect you with employers and apprenticeships.

---

## EXPECTATIONS

You agree to:
- Attend training sessions  
- Communicate with instructors  
- Be respectful to staff and peers  
- Keep your contact information updated  
- Complete required assignments  
- Ask for help when you need it  

---

## SUPPORT

You're never doing this alone.

**Phone/Text**: 317-314-3757  
**Email**: support@elevateconnectsdirectory.org  
**Website**: https://elevateconnectsdirectory.org/contact

---

## FREQUENTLY ASKED QUESTIONS

**Q: Is this really free?**  
A: Yes. We work with state and workforce partners so qualifying students don't pay tuition.

**Q: What if I can't attend a session?**  
A: Contact your instructor or call support immediately. We'll work with you.

**Q: How long does training take?**  
A: It depends on the program. CNA is 4-6 weeks, Barber is 12-18 months, HVAC is 8-12 weeks.

**Q: Will I get a job after?**  
A: We connect you with employers and provide job placement support. Your success is our goal.

**Q: Can I verify my certificate?**  
A: Yes! Anyone can verify your certificate at:  
https://elevateconnectsdirectory.org/cert/verify/[your-serial-number]

---

## CERTIFICATE VERIFICATION

Your certificate includes:
- Your name  
- Program completed  
- Completion date  
- Unique serial number  

Share your certificate with:
- Employers  
- Licensing agencies  
- Apprenticeship sponsors  
- Anyone who needs proof of training  

---

## NEXT STEPS

1. Log into your dashboard  
2. Complete orientation  
3. Upload your ID  
4. Wait for program assignment  
5. Begin training  
6. Earn your certificate  
7. Start your new career  

---

**Welcome to Elevate for Humanity. Let's build your future together.**

📞 317-314-3757  
🌐 elevateconnectsdirectory.org

EOF

echo "✅ student_handbook.md created"

##############################################
# 2. PARTNER ONE-PAGER
##############################################
cat << 'EOF' > "$DOC_DIR/partner_one_pager.md"
# Elevate for Humanity  
## Training Partner One-Pager  
Single-Spaced • Professional • Credentialed

Elevate for Humanity connects motivated learners with approved training providers to build statewide talent pipelines.

---

## WHAT WE OFFER PARTNERS

- **Student Referrals** - Pre-screened, motivated students  
- **Provider Dashboard** - Manage students, track progress  
- **Certificate Issuance** - We handle certificate generation  
- **Public Verification** - QR code and serial number verification  
- **Reporting Tools** - Track completions and outcomes  
- **Compliance Support** - Documentation and audit assistance  
- **LMS Workflow** - Integrated orientation and tracking  

We handle the admin — you focus on training.

---

## HOW IT WORKS

1. **Apply**: https://elevateconnectsdirectory.org/program-holder/apply  
2. **Submit**: License + training outline + capacity info  
3. **Onboarding**: Complete onboarding call with our team  
4. **Dashboard Access**: Get secure login to Partner Dashboard  
5. **Receive Students**: Students appear in your dashboard  
6. **Train**: Provide quality training per your curriculum  
7. **Submit Completions**: Mark students complete in dashboard  
8. **Certificates Issued**: Elevate generates and distributes certificates  

---

## IDEAL PARTNERS

- **CNA Schools** - State-approved nursing assistant programs  
- **Barber Shops** - Licensed shops accepting apprentices  
- **HVAC Training Organizations** - Certified HVAC instruction  
- **Building Tech Programs** - Facilities and maintenance training  
- **Workforce Centers** - Multi-program training providers  

---

## PARTNER BENEFITS

✅ **No Marketing Costs** - We send you students  
✅ **No LMS Fees** - Use our platform at no charge  
✅ **Compliance Support** - We help with documentation  
✅ **Certificate Management** - We handle issuance and verification  
✅ **Reporting Tools** - Track your program performance  
✅ **State Alignment** - Programs aligned with workforce priorities  

---

## REQUIREMENTS

Partners must:
- Hold valid state licenses/certifications  
- Maintain insurance and compliance  
- Provide quality instruction  
- Submit attendance and completion records  
- Communicate with students and Elevate staff  
- Follow Elevate policies and procedures  

---

## REVENUE SHARE (If Applicable)

For funded programs, partners may receive:
- Per-student stipends  
- Completion bonuses  
- Revenue share agreements  

Contact us to discuss your specific arrangement.

---

## DELEGATE ACCESS

Add your team to the dashboard:
- Instructors  
- Admin staff  
- Case managers  
- Compliance officers  

Each gets their own secure login with appropriate permissions.

---

## STUDENT FLOW

1. Student enrolls with Elevate  
2. Student completes orientation  
3. Student uploads ID  
4. Elevate assigns student to your program  
5. You receive notification in dashboard  
6. You review student details  
7. You contact student to schedule  
8. Student begins training  
9. You track attendance and progress  
10. You mark student complete  
11. Elevate issues certificate  

---

## COMPLIANCE & DOCUMENTATION

We help you maintain:
- Attendance logs  
- Skills checklists  
- Completion forms  
- Instructor credentials  
- Facility documentation  
- Insurance certificates  

---

## REPORTING

Access real-time reports on:
- Active students  
- Completion rates  
- Attendance trends  
- Program performance  
- Revenue (if applicable)  

Export reports for:
- State agencies  
- Workforce boards  
- Internal review  
- Grant compliance  

---

## SUPPORT FOR PARTNERS

**Partner Support Line**: 317-314-3757  
**Email**: partners@elevateconnectsdirectory.org  
**Dashboard**: https://elevateconnectsdirectory.org/program-holder/dashboard

---

## READY TO PARTNER?

**Apply Now**: https://elevateconnectsdirectory.org/program-holder/apply

**Questions?**  
Call or text: **317-314-3757**

---

**Elevate for Humanity**  
Building talent pipelines that work.

🌐 elevateconnectsdirectory.org  
📞 317-314-3757

EOF

echo "✅ partner_one_pager.md created"

##############################################
# 3. STATE-FACING OUTLINE
##############################################
cat << 'EOF' > "$DOC_DIR/state_packet_outline.md"
# Elevate for Humanity  
## State & Workforce Agency Packet  
Credentialed • Verifiable • Workforce-Aligned

---

## SECTION 1 — ORGANIZATION OVERVIEW

**Organization Name**: Elevate for Humanity  
**Website**: https://elevateconnectsdirectory.org  
**Phone**: 317-314-3757  
**Email**: support@elevateconnectsdirectory.org

**Mission**: Provide free/subsidized credentialed workforce training aligned with employer and state priorities.

**Model**: Technology-enabled training network connecting students, training providers, and employers through a centralized LMS and credential verification system.

**Geographic Focus**: Indiana (expandable to other states)

**Target Population**:
- Adults seeking career change  
- Young adults entering workforce  
- Individuals with barriers to employment  
- WIOA-eligible participants  
- Justice-involved individuals  
- SNAP/TANF recipients  

---

## SECTION 2 — PROGRAM OFFERINGS

We provide credentialed pathways in:

### CNA (Certified Nursing Assistant)
- Duration: 4-6 weeks  
- Hours: 75+ hours (classroom + clinical)  
- Credential: State CNA certification  
- Outcome: Healthcare employment  

### Barber Apprenticeship
- Duration: 12-18 months  
- Hours: 1,500 hours  
- Credential: Indiana State Barber License  
- Outcome: Licensed barber, shop ownership potential  

### HVAC Technician
- Duration: 8-12 weeks  
- Hours: 160+ hours  
- Credential: HVAC fundamentals certificate  
- Outcome: HVAC technician, apprenticeship-ready  

### Building Tech
- Duration: 6-8 weeks  
- Hours: 120+ hours  
- Credential: Building maintenance certificate  
- Outcome: Facilities technician, building operations  

### Workforce Readiness
- Duration: 2-4 weeks  
- Hours: 40+ hours  
- Credential: Workforce readiness certificate  
- Outcome: Employment-ready skills  

**Each program includes**:
- Online orientation  
- ID verification  
- Instructor-led training  
- Attendance tracking  
- Skills assessment  
- Completion documentation  
- Certificate issuance  
- Job placement support  

---

## SECTION 3 — COMPLIANCE & VERIFICATION

### Public Certificate Verification
**URL**: https://elevateconnectsdirectory.org/cert/verify/[serial]

Anyone can verify a certificate by:
- Entering serial number  
- Scanning QR code on certificate  
- No login required  

### Documentation Provided
- Attendance logs (daily/weekly)  
- Skills checklists (program-specific)  
- Completion forms (signed by instructor)  
- Partner verification (training provider confirmation)  
- Certificate with unique serial number  

### Data Security
- FERPA-compliant  
- Secure authentication  
- Role-based access control  
- Encrypted data transmission  
- Regular security audits  

---

## SECTION 4 — EMPLOYER PIPELINE

We connect employers with:
- **Certified Candidates** - Graduates ready to work  
- **Apprenticeship-Ready Graduates** - Pre-screened for apprenticeships  
- **OJT/WEX Pathways** - On-the-job training opportunities  
- **Retention Support** - Post-placement follow-up  

### Employer Services
- Candidate referrals  
- Skills verification  
- Hiring support  
- OJT/WEX coordination  
- Retention tracking  

### Current Employer Partners
(List to be provided upon request)

---

## SECTION 5 — STUDENT SUPPORT

Students receive:
- **Digital Onboarding** - Mobile-friendly enrollment  
- **Orientation** - Program expectations and support  
- **Progress Tracking** - Real-time dashboard access  
- **Certificate Database** - Lifetime access to credentials  
- **Career Connections** - Job placement assistance  
- **Case Management** - 1:1 support as needed  

**Support Line**: 317-314-3757 (call or text)

### Student Success Metrics
- Enrollment completion rate  
- Training completion rate  
- Certificate issuance rate  
- Employment placement rate  
- 90-day retention rate  

---

## SECTION 6 — PARTNER MANAGEMENT

Training partners receive access to:
- **Provider Dashboard** - Secure web portal  
- **Student Lists** - Assigned students with details  
- **Completion Submission** - Mark students complete  
- **Reporting** - Program performance metrics  
- **Compliance Tools** - Documentation templates  

### Partner Requirements
- Valid state licenses/certifications  
- Insurance and bonding  
- Qualified instructors  
- Appropriate facilities  
- Attendance tracking  
- Skills assessment capability  

### Partner Vetting Process
1. Application submission  
2. License verification  
3. Facility review  
4. Instructor credential check  
5. Insurance verification  
6. Onboarding call  
7. Dashboard access granted  

---

## SECTION 7 — DATA & REPORTING

Elevate provides:
- **Completion Rates** - By program, provider, cohort  
- **Employment Outcomes** - Placement and retention  
- **Demographics** - Age, gender, location, barriers  
- **Provider Performance** - Quality metrics  
- **Program-Level Analytics** - Trends and insights  

### Report Formats
- Real-time dashboards  
- Exportable CSV/Excel  
- PDF summary reports  
- Custom reports on request  

### Reporting Frequency
- Real-time: Dashboard access  
- Weekly: Internal review  
- Monthly: Partner reports  
- Quarterly: State/workforce board reports  
- Annual: Comprehensive impact report  

---

## SECTION 8 — WORKFORCE ALIGNMENT

Our model aligns with:

### WIOA (Workforce Innovation and Opportunity Act)
- Eligible training provider  
- Performance metrics tracking  
- Credential attainment focus  
- Employment outcome reporting  

### ETPL (Eligible Training Provider List)
- Application submitted/approved (as applicable)  
- Performance data provided  
- Consumer information available  

### OJT/WEX (On-the-Job Training / Work Experience)
- Employer coordination  
- Wage reimbursement support  
- Documentation and compliance  

### Apprenticeship Sponsorship
- State-approved barber apprenticeship sponsor  
- Apprenticeship-ready pathways in HVAC and Building Tech  
- DOL apprenticeship alignment  

### State Workforce Objectives
- Credential attainment  
- Employment placement  
- Wage progression  
- Barrier reduction  
- Equity and inclusion  

---

## SECTION 9 — FUNDING & SUSTAINABILITY

### Current Funding Sources
- Workforce development grants  
- Training provider partnerships  
- Employer contributions  
- Philanthropic support  

### Revenue Model
- Per-student training fees (funded programs)  
- Partner revenue share (where applicable)  
- Employer placement fees (optional)  
- Grant funding  

### Cost Per Student
(Varies by program, available upon request)

---

## SECTION 10 — IMPACT & OUTCOMES

### Students Served
(To be updated quarterly)

### Certificates Issued
(To be updated quarterly)

### Employment Placements
(To be updated quarterly)

### Average Wage at Placement
(To be updated quarterly)

### Partner Network
- CNA Schools: [Number]  
- Barber Shops: [Number]  
- HVAC Providers: [Number]  
- Building Tech Programs: [Number]  

---

## SECTION 11 — TECHNOLOGY PLATFORM

### LMS Features
- Mobile-responsive design  
- Student dashboard  
- Partner dashboard  
- Admin dashboard  
- Certificate generation  
- Public verification  
- Reporting and analytics  
- Secure authentication  

### Technical Specifications
- Platform: Next.js 16 + React 19  
- Database: PostgreSQL (Supabase)  
- Hosting: Netlify  
- Security: SSL, encryption, RLS  
- Uptime: 99.9% target  

---

## SECTION 12 — CONTACT & NEXT STEPS

**Primary Contact**: Elevate for Humanity Team  
**Phone**: 317-314-3757  
**Email**: support@elevateconnectsdirectory.org  
**Website**: https://elevateconnectsdirectory.org

### For State Agencies
To discuss partnership, data sharing, or ETPL application:
- Call: 317-314-3757  
- Email: partnerships@elevateconnectsdirectory.org  

### For Workforce Boards
To explore referral partnerships or co-enrollment:
- Call: 317-314-3757  
- Email: workforce@elevateconnectsdirectory.org  

### For Employers
To receive candidate referrals or discuss OJT/WEX:
- Call: 317-314-3757  
- Email: employers@elevateconnectsdirectory.org  

---

## APPENDICES (Available Upon Request)

- Appendix A: Sample Certificate  
- Appendix B: Partner Application  
- Appendix C: Student Handbook  
- Appendix D: Curriculum Outlines  
- Appendix E: Performance Data  
- Appendix F: Insurance Certificates  
- Appendix G: Instructor Credentials  
- Appendix H: Facility Documentation  

---

**Elevate for Humanity**  
Credentialed Training • Verified Outcomes • Workforce Ready

📞 317-314-3757  
🌐 elevateconnectsdirectory.org

EOF

echo "✅ state_packet_outline.md created"
echo ""
echo "🎉 Digital package generation complete!"
echo ""
echo "📁 Generated documents:"
echo "   - docs/elevate/student_handbook.md"
echo "   - docs/elevate/partner_one_pager.md"
echo "   - docs/elevate/state_packet_outline.md"
echo ""
echo "💡 These documents are ready for:"
echo "   - PDF creation"
echo "   - Canva upload"
echo "   - LMS lessons"
echo "   - State submissions"
echo "   - Website pages"
echo "   - Partner distribution"
echo ""
