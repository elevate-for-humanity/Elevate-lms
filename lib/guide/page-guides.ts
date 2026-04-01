/**
 * Universal Page Guide System
 * Every page explains itself - what it is, how to use it, why it matters
 */

export interface GuideMessage {
  id: string;
  type: 'welcome' | 'explain' | 'how-to' | 'tip' | 'upsell' | 'warning' | 'success';
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: string; // Function name to call
  };
}

export interface PageGuide {
  pageId: string;
  pageName: string;
  avatarName: string;
  avatarImage: string;
  messages: GuideMessage[];
  quickTips?: string[]; // Short tips shown in sidebar or tooltip
}

// ============================================
// STORE PAGES
// ============================================

export const STORE_GUIDES: Record<string, PageGuide> = {
  'store-landing': {
    pageId: 'store-landing',
    pageName: 'Store',
    avatarName: 'Maya',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Welcome to the Elevate Store! I'm Maya. Whether you're a student needing supplies, or an organization wanting to run training programs - I'll help you find what you need.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "We have five main sections: Shop (tools & gear), Marketplace (courses), Workbooks (free study materials), Platform Licenses (run your own training program), and Compliance Tools (WIOA, FERPA, grants).",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Not sure where to start? Most training providers choose the School License - it's a complete system to run WIOA-funded programs. One cohort pays for the whole thing!",
        action: { label: 'See School License', href: '/store/licenses/school-license' },
      },
    ],
    quickTips: [
      'Students: Check Workbooks for free study materials',
      'Training Providers: School License is most popular',
      'Need compliance help? We have WIOA & FERPA tools',
    ],
  },

  'licenses': {
    pageId: 'licenses',
    pageName: 'Platform Licenses',
    avatarName: 'Maya',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Welcome to Platform Licensing! This is how training providers, workforce boards, and agencies run their programs on our infrastructure - without building from scratch.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "We have two options: Managed Platform ($1,500-$3,500/month) where we host everything for you, or Source-Use License ($75,000+) for large agencies that need to deploy on their own infrastructure.",
      },
      {
        id: 'managed',
        type: 'how-to',
        message: "Managed Platform is our most popular. You get your own branded instance with your domain. We handle hosting, updates, security, and support. You focus on running programs. Launch in 2 weeks.",
      },
      {
        id: 'includes',
        type: 'explain',
        message: "Every license includes: Complete LMS with courses and certificates, student/instructor/employer portals, WIOA-compliant reporting, automated enrollment workflows, and dedicated support.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "The ROI: One WIOA-funded cohort of 15 students generates $75,000+ in funding. The platform pays for itself with your first cohort while saving 20+ hours per month on compliance.",
        action: { label: 'Watch Demo', href: '/store/demo' },
      },
      {
        id: 'cta',
        type: 'success',
        message: "Ready to see it in action? Try our interactive demo, or schedule a call to discuss your specific needs.",
        action: { label: 'Schedule a Call', href: '/contact?topic=licensing' },
      },
    ],
    quickTips: [
      'Managed Platform: We host, you manage programs',
      'Source-Use: For agencies with DevOps teams',
      'Launch in as little as 2 weeks',
      'WIOA compliance built in',
      'One cohort pays for the platform',
    ],
  },

  'compliance-wioa': {
    pageId: 'compliance-wioa',
    pageName: 'WIOA Compliance',
    avatarName: 'James',
    avatarImage: '/images/pages/store-guide-1.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "WIOA compliance can be a headache - I know, I've been there. Let me show you how our tools make it simple.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "WIOA (Workforce Innovation and Opportunity Act) requires tracking participant outcomes - employment rates, wages, credentials. Our toolkit automates all of this.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "The system tracks everything as participants move through your program. When it's time to report, you click one button and get a PIRL-compliant export. Done.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "This toolkit saves 40+ hours per quarter. What used to take a week of pulling data now takes 10 minutes.",
        action: { label: 'See Pricing', href: '#pricing' },
      },
      {
        id: 'upsell',
        type: 'upsell',
        message: "Pro tip: The School License includes WIOA compliance built in, plus the full LMS and white-label branding. Better value if you need the whole platform.",
        action: { label: 'Compare to School License', href: '/store/licenses/school-license' },
      },
    ],
    quickTips: [
      'One-click PIRL exports',
      'Automated performance tracking',
      'Pre-built quarterly report templates',
    ],
  },
};

// ============================================
// PROGRAM PAGES
// ============================================

export const PROGRAM_GUIDES: Record<string, PageGuide> = {
  'programs-landing': {
    pageId: 'programs-landing',
    pageName: 'Training Programs',
    avatarName: 'Marcus',
    avatarImage: '/images/pages/store-guide-2.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Looking for career training? You're in the right place. I'm Marcus, and I'll help you find a program that fits your goals.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "We offer hands-on training in high-demand fields: Barbering, CNA (nursing assistant), HVAC, CDL (truck driving), and more. Most programs include job placement support.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Many of our programs are WIOA-eligible, which means they could be FREE for you if you qualify. Check your eligibility - it only takes 2 minutes.",
        action: { label: 'Check WIOA Eligibility', href: '/wioa-eligibility' },
      },
    ],
    quickTips: [
      'Most programs are WIOA-funded (could be free)',
      'Job placement support included',
      'Flexible schedules available',
    ],
  },

  'barber-apprenticeship': {
    pageId: 'barber-apprenticeship',
    pageName: 'Barber Apprenticeship',
    avatarName: 'Marcus',
    avatarImage: '/images/pages/store-guide-2.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Interested in becoming a barber? This is a 2,000-hour DOL-registered apprenticeship. You'll learn from master barbers and be ready to pass your state board exam.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "The program covers everything: cutting techniques, fades, beard work, sanitation, customer service, and business skills. You'll work on real clients under supervision.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "Here's how it works: 15-24 months of training, flexible scheduling, and you can earn while you learn. We help you find a shop placement.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "This program is WIOA-eligible. If you qualify, your training could be completely funded. Let's check your eligibility.",
        action: { label: 'Check If You Qualify', href: '/wioa-eligibility' },
      },
    ],
    quickTips: [
      '2,000 hours of hands-on training',
      'State board exam prep included',
      'WIOA funding available',
      'Job placement assistance',
    ],
  },

  'cna-training': {
    pageId: 'cna-training',
    pageName: 'CNA Training',
    avatarName: 'Sarah',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Want to work in healthcare? CNA (Certified Nursing Assistant) is one of the fastest paths in. 6 weeks of training and you're ready to work.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "You'll learn patient care, vital signs, medical terminology, and safety procedures. The program includes clinical rotations at real healthcare facilities.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "6 weeks of classroom and clinical training, then you take the state certification exam. We have a 95% pass rate. After that, you're job-ready.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "CNAs are in high demand - hospitals, nursing homes, and home health agencies are always hiring. Starting pay is $15-20/hour, more with experience.",
        action: { label: 'Apply Now', href: '/programs/cna/apply' },
      },
    ],
    quickTips: [
      '6 weeks to certification',
      '95% state exam pass rate',
      'Clinical rotations included',
      'High job demand',
    ],
  },
};

// ============================================
// TAX OFFICE PAGES
// ============================================

export const TAX_OFFICE_GUIDES: Record<string, PageGuide> = {
  'tax-office-landing': {
    pageId: 'tax-office-landing',
    pageName: 'Tax Office',
    avatarName: 'David',
    avatarImage: '/images/pages/store-guide-1.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Welcome to the Elevate Tax Office! I'm David. Whether you need your taxes done or want to become a tax preparer yourself, I'll guide you through.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "We offer two things: Tax preparation services (we do your taxes), and Tax Preparer Training (become a certified tax professional yourself).",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Thinking about a career in tax preparation? It's great side income - preparers earn $50-150 per return during tax season. Our training gets you certified in 8 weeks.",
        action: { label: 'See Tax Training', href: '/programs/tax-preparation' },
      },
    ],
    quickTips: [
      'Tax prep services available year-round',
      'Become a certified preparer in 8 weeks',
      'Earn $50-150 per return',
    ],
  },

  'tax-preparation-training': {
    pageId: 'tax-preparation-training',
    pageName: 'Tax Preparer Training',
    avatarName: 'David',
    avatarImage: '/images/pages/store-guide-1.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Want to become a tax preparer? This is one of the best side hustles out there. 8 weeks of training, then you can earn $50-150 per return during tax season.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "You'll learn federal and state tax law, how to use professional tax software, and how to handle different return types - W-2s, 1099s, self-employment, deductions.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "The training is 8 weeks, mostly online with some in-person sessions. You'll practice on real scenarios. After passing the exam, you get your PTIN and can start preparing returns.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Many of our graduates do 100+ returns per season. At $75 average per return, that's $7,500+ in extra income. Some go full-time and open their own tax offices.",
        action: { label: 'Enroll Now', href: '/programs/tax-preparation/enroll' },
      },
      {
        id: 'upsell',
        type: 'upsell',
        message: "Want to open your own tax office? We have a Tax Business Toolkit that includes everything - software, marketing materials, client management system.",
        action: { label: 'See Tax Business Toolkit', href: '/store/digital/tax-business-toolkit' },
      },
    ],
    quickTips: [
      '8 weeks to certification',
      'Earn $50-150 per return',
      'Work from home or office',
      'Great seasonal income',
    ],
  },
};

// ============================================
// DASHBOARD PAGES
// ============================================

export const DASHBOARD_GUIDES: Record<string, PageGuide> = {
  'student-dashboard': {
    pageId: 'student-dashboard',
    pageName: 'Student Dashboard',
    avatarName: 'Maya',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "This is your student dashboard - your home base for everything. Let me show you around.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "On the left, you'll see your enrolled courses. In the center, your progress and upcoming assignments. On the right, announcements and messages from instructors.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "To continue a course, just click on it. Your progress is saved automatically. You can also download materials, submit assignments, and message instructors from here.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Pro tip: Check the 'Resources' section for workbooks and study guides. They're free to download and really help with exam prep.",
        action: { label: 'Go to Resources', href: '/lms/resources' },
      },
    ],
    quickTips: [
      'Click any course to continue learning',
      'Progress saves automatically',
      'Download workbooks from Resources',
      'Message instructors anytime',
    ],
  },

  'instructor-dashboard': {
    pageId: 'instructor-dashboard',
    pageName: 'Instructor Dashboard',
    avatarName: 'James',
    avatarImage: '/images/pages/store-guide-1.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Welcome to your instructor dashboard. This is where you manage your courses, track student progress, and communicate with learners.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "The overview shows your active courses and student counts. Below that, you'll see students who need attention - late assignments, low engagement, or questions waiting.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "To grade assignments, click 'Submissions'. To message students, use the 'Messages' tab. To update course content, go to 'Course Editor'.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "The 'At Risk' section shows students who might be struggling. Reaching out early makes a big difference in completion rates.",
        action: { label: 'View At-Risk Students', href: '/instructor/at-risk' },
      },
    ],
    quickTips: [
      'Check "At Risk" students daily',
      'Grade submissions within 48 hours',
      'Use announcements for class-wide updates',
      'Office hours boost engagement',
    ],
  },

  'admin-dashboard': {
    pageId: 'admin-dashboard',
    pageName: 'Admin Dashboard',
    avatarName: 'Sarah',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "This is your admin command center. You can see everything happening across your platform - enrollments, completions, revenue, and compliance status.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "Top row shows key metrics: active students, completion rate, revenue this month, and compliance status. Below that, recent activity and items needing attention.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "Use the sidebar to navigate: Students (manage enrollments), Courses (content management), Reports (analytics), Settings (platform configuration).",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "The 'Compliance' section shows your WIOA reporting status. Green means you're current, yellow means reports are due soon, red means action needed.",
        action: { label: 'View Compliance Status', href: '/admin/compliance' },
      },
    ],
    quickTips: [
      'Check compliance status weekly',
      'Export reports before deadlines',
      'Review enrollments daily',
      'Monitor completion rates',
    ],
  },

  'partner-dashboard': {
    pageId: 'partner-dashboard',
    pageName: 'Partner Dashboard',
    avatarName: 'Marcus',
    avatarImage: '/images/pages/store-guide-2.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Welcome to your partner dashboard. This is where you track your sponsored students and see the ROI on your workforce investment.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "You'll see all students your organization has sponsored - their progress, completion status, and employment outcomes. This data helps with grant reporting.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "To sponsor a new student, click 'Add Student'. To export data for your reports, use 'Generate Report'. You can filter by program, date range, or status.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "The 'Outcomes' tab shows employment data for your completers - job placements, starting wages, retention. Great for demonstrating program impact.",
        action: { label: 'View Outcomes', href: '/partner/outcomes' },
      },
    ],
    quickTips: [
      'Track sponsored student progress',
      'Export data for grant reports',
      'View employment outcomes',
      'Add new sponsored students anytime',
    ],
  },

  'employer-dashboard': {
    pageId: 'employer-dashboard',
    pageName: 'Employer Dashboard',
    avatarName: 'David',
    avatarImage: '/images/pages/store-guide-1.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "This is your employer dashboard. Here you can find trained candidates, post job openings, and track hires from our programs.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "The 'Candidates' section shows graduates ready to work. You can filter by program, location, and availability. Each profile shows their training, certifications, and skills.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "To post a job, click 'Post Opening'. To contact a candidate, click their profile and send a message. To track your hires, use the 'My Hires' tab.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Hiring WIOA participants? You may qualify for On-the-Job Training (OJT) reimbursement - up to 50% of wages for the first 6 months.",
        action: { label: 'Learn About OJT', href: '/employers/ojt-program' },
      },
    ],
    quickTips: [
      'All candidates are trained and certified',
      'OJT reimbursement available',
      'Post jobs for free',
      'Direct message candidates',
    ],
  },
};

// ============================================
// LMS PAGES
// ============================================

export const LMS_GUIDES: Record<string, PageGuide> = {
  'course-viewer': {
    pageId: 'course-viewer',
    pageName: 'Course Viewer',
    avatarName: 'Maya',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "You're in the course viewer. This is where the learning happens. Let me show you how to navigate.",
      },
      {
        id: 'explain',
        type: 'explain',
        message: "On the left is your course outline - all the modules and lessons. The main area shows the current lesson. Your progress bar is at the top.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "Click any lesson to jump to it. Mark lessons complete with the checkbox. For video lessons, you must watch 90% before it counts as complete.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Stuck on something? Click 'Ask AI Tutor' for instant help. It can explain concepts, answer questions, and help you work through problems.",
        action: { label: 'Try AI Tutor', onClick: 'openAITutor' },
      },
    ],
    quickTips: [
      'Progress saves automatically',
      'Download materials for offline study',
      'AI Tutor available 24/7',
      'Take notes in the Notes tab',
    ],
  },

  'assignment-submission': {
    pageId: 'assignment-submission',
    pageName: 'Submit Assignment',
    avatarName: 'Maya',
    avatarImage: '/images/pages/store-recommendations.jpg',
    messages: [
      {
        id: 'welcome',
        type: 'welcome',
        message: "Ready to submit your assignment? I'll walk you through it.",
      },
      {
        id: 'how-to',
        type: 'how-to',
        message: "Upload your file using the button below, or paste text directly. Make sure your name is on the document. Click 'Submit' when ready.",
      },
      {
        id: 'tip',
        type: 'tip',
        message: "Double-check the requirements before submitting. Once submitted, you can't edit - but you can message your instructor if you need to make changes.",
      },
      {
        id: 'warning',
        type: 'warning',
        message: "Submissions are checked for plagiarism. Make sure all work is your own and properly cited.",
      },
    ],
    quickTips: [
      'Check requirements before submitting',
      'Include your name on documents',
      'You can submit early',
      'Contact instructor for extensions',
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPageGuide(pageId: string): PageGuide | undefined {
  return {
    ...STORE_GUIDES,
    ...PROGRAM_GUIDES,
    ...TAX_OFFICE_GUIDES,
    ...DASHBOARD_GUIDES,
    ...LMS_GUIDES,
  }[pageId];
}

export function getAllGuides(): PageGuide[] {
  return [
    ...Object.values(STORE_GUIDES),
    ...Object.values(PROGRAM_GUIDES),
    ...Object.values(TAX_OFFICE_GUIDES),
    ...Object.values(DASHBOARD_GUIDES),
    ...Object.values(LMS_GUIDES),
  ];
}
