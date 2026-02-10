/**
 * Demo Tour Definitions
 * Narrative-rich guided tours for each license type
 */

import { DemoLicenseType, DemoRole } from './context';

export interface TourStep {
  id: string;
  title: string;
  narrative: string;
  why_it_matters: string;
  role: DemoRole;
  route: string;
  completion_check: 'manual' | 'auto' | string;
  next_button_label: string;
}

export interface Tour {
  id: string;
  name: string;
  licenseType: DemoLicenseType;
  description: string;
  steps: TourStep[];
}

export const TOURS: Record<DemoLicenseType, Tour> = {
  institution_admin: {
    id: 'institution_admin',
    name: 'Institution / Admin License Tour',
    licenseType: 'institution_admin',
    description: 'Experience full administrative control over your training programs, from enrollment to compliance reporting.',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to the Admin Dashboard',
        narrative: `You're about to experience the complete administrative control center for workforce training programs.

This dashboard is where training providers, community colleges, and workforce development organizations manage their entire operation—from student enrollment to compliance reporting.

As an administrator, you'll have visibility into every aspect of your programs: who's enrolled, how they're progressing, what funding sources are being used, and whether you're meeting compliance requirements.`,
        why_it_matters: 'Centralized visibility reduces administrative overhead and ensures nothing falls through the cracks.',
        role: 'demo_admin',
        route: '/demo/admin/dashboard',
        completion_check: 'manual',
        next_button_label: 'View the Dashboard',
      },
      {
        id: 'applications',
        title: 'Application Pipeline',
        narrative: `This is where new student applications arrive. Each application goes through a structured review process:

1. **Initial Review** - Basic eligibility screening
2. **Document Collection** - Required documents like ID, transcripts, funding eligibility
3. **Approval** - Final review and enrollment decision

Notice how applications are organized by status. You can see at a glance how many are pending review, waiting for documents, or ready for approval.

The system automatically flags applications that have been waiting too long, ensuring timely processing.`,
        why_it_matters: 'A structured pipeline prevents applications from getting lost and ensures fair, consistent processing.',
        role: 'demo_admin',
        route: '/demo/admin/applications',
        completion_check: 'manual',
        next_button_label: 'Review Applications',
      },
      {
        id: 'enrollments',
        title: 'Active Enrollments',
        narrative: `Once approved, students become enrollments. This view shows everyone currently in your programs.

Each enrollment record tracks:
- **Program assignment** - Which training track they're in
- **Funding source** - WIOA, self-pay, employer-sponsored, etc.
- **Progress** - Hours completed, courses finished, milestones reached
- **Status** - Active, on hold, completed, withdrawn

You can filter by program, funding type, or status to quickly find specific groups of students.`,
        why_it_matters: 'Real-time enrollment visibility enables proactive intervention when students fall behind.',
        role: 'demo_admin',
        route: '/demo/admin/enrollments',
        completion_check: 'manual',
        next_button_label: 'View Enrollments',
      },
      {
        id: 'compliance',
        title: 'Compliance Dashboard',
        narrative: `For WIOA-funded programs, compliance isn't optional—it's required for continued funding.

This dashboard shows your compliance status across key metrics:
- **Documentation rates** - Are required documents on file?
- **Progress reporting** - Are students meeting hour requirements?
- **Outcome tracking** - Employment placements, wage gains, credential attainment

Red flags indicate areas needing immediate attention. Yellow indicates approaching deadlines.

The system generates the reports your workforce board needs, formatted to their specifications.`,
        why_it_matters: 'Automated compliance tracking prevents funding clawbacks and audit findings.',
        role: 'demo_admin',
        route: '/demo/admin/compliance',
        completion_check: 'manual',
        next_button_label: 'Check Compliance',
      },
      {
        id: 'audit_logs',
        title: 'Audit Trail',
        narrative: `Every action in the system is logged. This isn't just for compliance—it's for accountability and troubleshooting.

The audit log shows:
- **Who** performed the action
- **What** they did
- **When** it happened
- **What changed** (before/after values)

This is essential for WIOA audits, where you may need to demonstrate that proper procedures were followed for funding decisions.

You can filter by user, action type, date range, or affected record.`,
        why_it_matters: 'Complete audit trails protect your organization during compliance reviews and investigations.',
        role: 'demo_admin',
        route: '/demo/admin/audit-logs',
        completion_check: 'manual',
        next_button_label: 'View Audit Logs',
      },
      {
        id: 'reports',
        title: 'Reporting & Analytics',
        narrative: `Data-driven decisions require good reports. This section provides:

- **Enrollment reports** - Trends, demographics, program distribution
- **Outcome reports** - Completion rates, employment placements, wage data
- **Financial reports** - Funding utilization, cost per student
- **Custom exports** - Pull the data you need in the format you need

Reports can be scheduled to run automatically and emailed to stakeholders.`,
        why_it_matters: 'Accurate reporting demonstrates program effectiveness and justifies continued funding.',
        role: 'demo_admin',
        route: '/demo/admin/reports',
        completion_check: 'manual',
        next_button_label: 'Generate Reports',
      },
      {
        id: 'purchase',
        title: 'Ready to Get Started?',
        narrative: `You've seen how the Institution/Admin license gives you complete control over your training operation.

**What you get:**
- Unlimited admin users
- Full enrollment management
- Compliance automation
- Custom reporting
- Dedicated support

**Pricing starts at $1,500/month** for the managed platform, with volume discounts available.

Ready to bring this to your organization?`,
        why_it_matters: 'The right tools transform administrative burden into operational efficiency.',
        role: 'demo_admin',
        route: '/store/licenses/managed-platform',
        completion_check: 'manual',
        next_button_label: 'Get Started',
      },
    ],
  },

  partner_employer: {
    id: 'partner_employer',
    name: 'Partner / Employer License Tour',
    licenseType: 'partner_employer',
    description: 'See how employers access the talent pipeline, manage apprenticeships, and track hiring incentives.',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to the Employer Portal',
        narrative: `As an employer partner, you have direct access to a pipeline of trained, job-ready candidates.

This portal is designed for hiring managers and HR teams who want to:
- Find qualified candidates from training programs
- Manage apprenticeship placements
- Track hiring incentives and tax credits
- Coordinate with training providers

You're not just posting jobs—you're connecting with candidates who have verified skills and credentials.`,
        why_it_matters: 'Direct pipeline access reduces time-to-hire and ensures candidate quality.',
        role: 'demo_partner',
        route: '/demo/employer/dashboard',
        completion_check: 'manual',
        next_button_label: 'View Employer Dashboard',
      },
      {
        id: 'candidates',
        title: 'Candidate Pipeline',
        narrative: `This is your talent pipeline. Candidates here have completed (or are completing) verified training programs.

Each candidate profile shows:
- **Training completed** - Programs, certifications, credentials
- **Skills verified** - Assessments passed, competencies demonstrated
- **Availability** - When they can start, location preferences
- **Funding eligibility** - OJT subsidies, WOTC credits available

You can filter by program, skill, location, or availability to find exactly who you need.`,
        why_it_matters: 'Pre-screened candidates with verified credentials reduce hiring risk.',
        role: 'demo_partner',
        route: '/demo/employer/candidates',
        completion_check: 'manual',
        next_button_label: 'Browse Candidates',
      },
      {
        id: 'apprenticeships',
        title: 'Apprenticeship Management',
        narrative: `If you're running apprenticeship programs, this is your command center.

Track each apprentice's:
- **OJT hours** - Logged and verified by supervisors
- **Wage progression** - Scheduled increases as skills develop
- **Related instruction** - Classroom training completion
- **Competency sign-offs** - Skills demonstrated on the job

The system ensures you're meeting Department of Labor requirements for registered apprenticeships.`,
        why_it_matters: 'Proper apprenticeship tracking ensures program compliance and maximizes available subsidies.',
        role: 'demo_partner',
        route: '/demo/employer/apprenticeships',
        completion_check: 'manual',
        next_button_label: 'Manage Apprenticeships',
      },
      {
        id: 'incentives',
        title: 'Hiring Incentives',
        narrative: `Hiring from workforce programs often comes with financial incentives:

- **On-the-Job Training (OJT)** - Wage subsidies during training period
- **Work Opportunity Tax Credit (WOTC)** - Federal tax credits for eligible hires
- **State incentives** - Additional credits and grants vary by state

This dashboard tracks which incentives apply to each hire and helps you maximize your benefits.

The system can generate the documentation needed to claim these incentives.`,
        why_it_matters: 'Unclaimed incentives are money left on the table. Tracking ensures you capture every dollar.',
        role: 'demo_partner',
        route: '/demo/employer/incentives',
        completion_check: 'manual',
        next_button_label: 'View Incentives',
      },
      {
        id: 'documents',
        title: 'MOU & Compliance Documents',
        narrative: `Partnership agreements and compliance documents are managed here.

This includes:
- **Memoranda of Understanding (MOUs)** - Partnership agreements with training providers
- **OJT contracts** - Wage subsidy agreements
- **Apprenticeship standards** - DOL-required documentation
- **Verification letters** - Employment and wage verification

Documents can be signed electronically and are stored securely for audit purposes.`,
        why_it_matters: 'Organized documentation protects both parties and ensures smooth audits.',
        role: 'demo_partner',
        route: '/demo/employer/documents',
        completion_check: 'manual',
        next_button_label: 'View Documents',
      },
      {
        id: 'purchase',
        title: 'Ready to Access the Pipeline?',
        narrative: `You've seen how the Partner/Employer license connects you directly to trained talent.

**What you get:**
- Direct candidate pipeline access
- Apprenticeship tracking tools
- Incentive management
- Electronic document signing
- Dedicated partner support

**Pricing starts at $500/month** with volume discounts for multiple locations.

Ready to start hiring?`,
        why_it_matters: 'The right hiring tools reduce time-to-fill and improve retention.',
        role: 'demo_partner',
        route: '/store/licenses/managed-platform',
        completion_check: 'manual',
        next_button_label: 'Get Started',
      },
    ],
  },

  workforce_program: {
    id: 'workforce_program',
    name: 'Workforce / Program License Tour',
    licenseType: 'workforce_program',
    description: 'Experience the complete workforce development platform with funding integration and multi-stakeholder coordination.',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to the Workforce Operating System',
        narrative: `This is the complete platform for workforce development programs—designed for workforce boards, state agencies, and large training networks.

Unlike single-organization tools, this system coordinates across multiple stakeholders:
- Training providers delivering instruction
- Employers providing jobs and apprenticeships
- Funding agencies managing WIOA and other sources
- Case managers supporting participants

Everything connects. A participant's journey from intake to employment is tracked end-to-end.`,
        why_it_matters: 'Coordinated systems eliminate data silos and enable true outcome tracking.',
        role: 'demo_admin',
        route: '/demo/admin/dashboard',
        completion_check: 'manual',
        next_button_label: 'View System Dashboard',
      },
      {
        id: 'eligibility',
        title: 'Eligibility Determination',
        narrative: `WIOA funding requires eligibility determination. This module handles:

- **Barrier documentation** - Low income, disability, veteran status, etc.
- **Priority of service** - Veterans, public assistance recipients
- **Program eligibility** - Adult, Dislocated Worker, Youth criteria
- **Document verification** - Required supporting documentation

The system guides case managers through the eligibility process, ensuring all required documentation is collected and properly stored.`,
        why_it_matters: 'Proper eligibility determination prevents disallowed costs and audit findings.',
        role: 'demo_admin',
        route: '/demo/admin/wioa',
        completion_check: 'manual',
        next_button_label: 'Review Eligibility',
      },
      {
        id: 'funding',
        title: 'Funding Management',
        narrative: `Multiple funding sources, one system. Track:

- **WIOA Title I** - Adult, Dislocated Worker, Youth
- **WIOA Title II** - Adult Education
- **State funds** - Varies by state
- **Employer contributions** - OJT, apprenticeship
- **Grants** - Federal, state, foundation

Each participant can have multiple funding sources. The system tracks obligations, expenditures, and remaining balances.`,
        why_it_matters: 'Accurate funding tracking ensures compliance and maximizes resource utilization.',
        role: 'demo_admin',
        route: '/demo/admin/funding',
        completion_check: 'manual',
        next_button_label: 'View Funding',
      },
      {
        id: 'outcomes',
        title: 'Outcome Tracking',
        narrative: `WIOA performance measures require tracking outcomes:

- **Employment** - Entered employment, retained employment
- **Earnings** - Median earnings, wage gains
- **Credentials** - Credential attainment rate
- **Measurable skill gains** - Progress indicators

The system automatically calculates performance against negotiated levels and projects year-end outcomes.

Early warning indicators flag when performance is trending below target.`,
        why_it_matters: 'Meeting performance measures ensures continued funding and demonstrates program value.',
        role: 'demo_admin',
        route: '/demo/admin/outcomes',
        completion_check: 'manual',
        next_button_label: 'Track Outcomes',
      },
      {
        id: 'partners',
        title: 'Partner Network',
        narrative: `Workforce development is a team sport. This module manages your partner network:

- **Training providers** - Approved providers, performance data
- **Employers** - Hiring partners, apprenticeship sponsors
- **Support services** - Transportation, childcare, housing partners
- **Co-enrollment partners** - Other programs serving shared participants

Each partner has their own portal access with appropriate permissions.`,
        why_it_matters: 'Strong partnerships expand capacity and improve participant outcomes.',
        role: 'demo_admin',
        route: '/demo/admin/partners',
        completion_check: 'manual',
        next_button_label: 'View Partners',
      },
      {
        id: 'reporting',
        title: 'Federal & State Reporting',
        narrative: `Compliance reporting is automated:

- **PIRL** - Participant Individual Record Layout for federal reporting
- **State reports** - Formatted to your state's requirements
- **Performance reports** - Quarterly and annual performance
- **Custom reports** - Board reports, stakeholder updates

Reports are generated automatically from system data—no manual data entry or reconciliation.`,
        why_it_matters: 'Automated reporting saves hundreds of hours and eliminates data entry errors.',
        role: 'demo_admin',
        route: '/demo/admin/reports',
        completion_check: 'manual',
        next_button_label: 'Generate Reports',
      },
      {
        id: 'purchase',
        title: 'Ready to Transform Your Workforce System?',
        narrative: `You've seen how the Workforce/Program license provides end-to-end workforce development infrastructure.

**What you get:**
- Multi-stakeholder coordination
- Complete WIOA compliance
- Automated federal reporting
- Partner network management
- Outcome tracking & analytics
- Dedicated implementation support

**Enterprise pricing starts at $75,000** for source-use license, or managed platform options available.

Ready to modernize your workforce system?`,
        why_it_matters: 'Modern infrastructure enables better outcomes for participants and communities.',
        role: 'demo_admin',
        route: '/store/licenses/source-use',
        completion_check: 'manual',
        next_button_label: 'Get Started',
      },
    ],
  },
};

/**
 * Get a tour by license type
 */
export function getTour(licenseType: DemoLicenseType): Tour {
  return TOURS[licenseType];
}

/**
 * Get a specific step from a tour
 */
export function getTourStep(licenseType: DemoLicenseType, stepIndex: number): TourStep | null {
  const tour = TOURS[licenseType];
  if (!tour || stepIndex < 1 || stepIndex > tour.steps.length) {
    return null;
  }
  return tour.steps[stepIndex - 1];
}

/**
 * Get total steps in a tour
 */
export function getTourStepCount(licenseType: DemoLicenseType): number {
  return TOURS[licenseType]?.steps.length || 0;
}
