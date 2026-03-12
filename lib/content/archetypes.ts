/**
 * Content Archetype System
 *
 * Defines structured content for each page type.
 * Enforces quality gates: no generic language, specific purpose, clear actions.
 */

export interface PageContent {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  actions?: Array<{
    label: string;
    href: string;
    variant: 'primary' | 'secondary';
  }>;
  breadcrumbs?: Array<{
    label: string;
    href: string;
  }>;
}

/**
 * Dashboard Archetype
 * For role-specific control panels
 */
export function getDashboardContent(role: string): PageContent {
  const configs: Record<string, PageContent> = {
    student: {
      title: 'Your Learning Dashboard',
      description:
        'Track your program progress, view assignments, access course materials, and manage your career development pathway.',
      imageSrc: '/images/pages/cna-clinical.jpg',
      imageAlt: 'Student reviewing course materials and tracking progress',
      actions: [
        { label: 'View My Courses', href: '/lms/courses', variant: 'primary' },
        {
          label: 'Check Progress',
          href: '/lms/progress',
          variant: 'secondary',
        },
      ],
    },
    admin: {
      title: 'Administrative Control Panel',
      description:
        'Manage applications, review enrollments, oversee program compliance, and generate reports for state workforce agencies.',
      imageSrc: '/images/pages/hvac-technician.jpg',
      imageAlt: 'Administrator reviewing applications and compliance reports',
      actions: [
        {
          label: 'Review Applications',
          href: '/admin/applications',
          variant: 'primary',
        },
        { label: 'View Reports', href: '/admin/reports', variant: 'secondary' },
      ],
    },
    staff: {
      title: 'Staff Operations Dashboard',
      description:
        'Process student applications, coordinate with training providers, track participant outcomes, and maintain program documentation.',
      imageSrc: '/images/pages/cdl-truck-highway.jpg',
      imageAlt: 'Staff member coordinating with training providers',
      actions: [
        {
          label: 'Process Applications',
          href: '/staff-portal/applications',
          variant: 'primary',
        },
        {
          label: 'Manage Students',
          href: '/staff-portal/students',
          variant: 'secondary',
        },
      ],
    },
    employer: {
      title: 'Employer Partnership Portal',
      description:
        'Post job opportunities, review qualified candidates, coordinate work-based learning placements, and track apprentice progress.',
      imageSrc: '/images/pages/barber-hero-main.jpg',
      imageAlt: 'Employer reviewing candidate profiles',
      actions: [
        {
          label: 'Post Opportunity',
          href: '/employer/opportunities/new',
          variant: 'primary',
        },
        {
          label: 'View Candidates',
          href: '/employer/candidates',
          variant: 'secondary',
        },
      ],
    },
    partner: {
      title: 'Training Provider Dashboard',
      description:
        'Manage program enrollments, submit progress reports, coordinate with employers, and maintain compliance with state requirements.',
      imageSrc: '/images/pages/it-helpdesk-desk.jpg',
      imageAlt: 'Training provider managing program enrollments',
      actions: [
        {
          label: 'View Enrollments',
          href: '/partner/enrollments',
          variant: 'primary',
        },
        {
          label: 'Submit Reports',
          href: '/partner/reports',
          variant: 'secondary',
        },
      ],
    },
    'program-holder': {
      title: 'Program Holder Portal',
      description:
        'Manage apprentice enrollments, submit weekly reports, track compliance requirements, and coordinate with state workforce agencies.',
      imageSrc: '/images/pages/welding-sparks.jpg',
      imageAlt: 'Program holder reviewing apprentice progress reports',
      actions: [
        {
          label: 'Manage Students',
          href: '/program-holder/students',
          variant: 'primary',
        },
        {
          label: 'Submit Report',
          href: '/program-holder/reports/new',
          variant: 'secondary',
        },
      ],
    },
  };

  return configs[role] || configs.student;
}

/**
 * Program Archetype
 * For training program pages
 */
export function getProgramContent(programSlug: string): PageContent {
  // This would typically fetch from database
  // For now, return structured template
  return {
    title: 'Registered Apprenticeship Program',
    description:
      'Earn while you learn through our DOL-registered apprenticeship program. Receive hands-on training, industry credentials, and job placement support.',
    imageSrc: '/images/pages/training-classroom.jpg',
    imageAlt:
      'Apprentice receiving hands-on training from experienced instructor',
    actions: [
      {
        label: 'Apply Now',
        href: `/programs/${programSlug}/apply`,
        variant: 'primary',
      },
      {
        label: 'View Requirements',
        href: `/programs/${programSlug}/requirements`,
        variant: 'secondary',
      },
    ],
    breadcrumbs: [
      { label: 'Programs', href: '/programs' },
      { label: 'Apprenticeships', href: '/programs/apprenticeships' },
    ],
  };
}

/**
 * Policy Archetype
 * For legal/compliance pages
 */
export function getPolicyContent(policyType: string): PageContent {
  const configs: Record<string, PageContent> = {
    privacy: {
      title: 'Privacy Policy',
      description:
        'How we collect, use, and protect your personal information in compliance with federal and state privacy regulations.',
      imageSrc: '/images/pages/for-employers-page-1.jpg',
      imageAlt: 'Secure data protection and privacy compliance',
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Legal', href: '/legal' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      description:
        'Terms and conditions governing your use of Elevate for Humanity services, programs, and digital platforms.',
      imageSrc: '/images/pages/business-sector.jpg',
      imageAlt: 'Legal agreement and terms documentation',
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Legal', href: '/legal' },
      ],
    },
  };

  return configs[policyType] || configs.privacy;
}

/**
 * Validate content meets quality standards
 */
export function validateContent(content: PageContent): void {
  if (!content.title || content.title.length < 10) {
    throw new Error('Content validation failed: title too short or missing');
  }
  if (!content.description || content.description.length < 50) {
    throw new Error(
      'Content validation failed: description too short or missing'
    );
  }
  if (!content.imageSrc || !content.imageAlt) {
    throw new Error('Content validation failed: image or alt text missing');
  }

  const forbidden = [
    'Available Now',
    'Content',
    'lorem ipsum',
    'tbd',
    'todo',
  ];
  const text = `${content.title} ${content.description}`.toLowerCase();

  for (const phrase of forbidden) {
    if (text.includes(phrase)) {
      throw new Error(
        `Content validation failed: forbidden phrase "${phrase}" detected`
      );
    }
  }
}
