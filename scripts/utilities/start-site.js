const express = require('express');
const path = require('path');
const app = express();
const PORT = 4000;

// Serve static files
app.use(express.static('.'));

// Government API routes
app.get('/api/government/contracts', (req, res) => {
  res.json({
    capabilities: [
      {
        title: 'Workforce Development Programs',
        description:
          'Comprehensive training and upskilling programs aligned with federal workforce development initiatives.',
        contractTypes: ['DOL', 'DWD', 'WIOA', 'TANF'],
      },
      {
        title: 'Educational Services',
        description:
          'Accredited educational programs and curriculum development for government agencies.',
        contractTypes: ['DOE', 'State Education', 'Community College'],
      },
      {
        title: 'Compliance & Accessibility',
        description:
          'Section 508 compliance, accessibility auditing, and inclusive design services.',
        contractTypes: ['GSA', 'Federal Agencies', 'State Government'],
      },
    ],
    metrics: [
      { value: '98%', label: 'Contract Performance', period: 'FY 2024' },
      { value: '$12.5M', label: 'Contract Value', period: 'Last 3 Years' },
      { value: '15', label: 'Active Contracts', period: 'Current' },
      { value: '4.9/5', label: 'Client Rating', period: 'Average' },
    ],
  });
});

app.get('/api/government/compliance', (req, res) => {
  res.json({
    standards: [
      {
        name: 'Section 508',
        description: 'Digital accessibility compliance',
        certified: true,
        certificationDate: 'January 2025',
      },
      {
        name: 'WIOA Compliance',
        description: 'Workforce development standards',
        certified: true,
        certificationDate: 'December 2024',
      },
      {
        name: 'FERPA',
        description: 'Educational privacy protection',
        certified: true,
        certificationDate: 'November 2024',
      },
      {
        name: 'Equal Opportunity',
        description: 'Non-discrimination compliance',
        certified: true,
        certificationDate: 'Ongoing',
      },
    ],
  });
});

app.get('/api/government/veterans', (req, res) => {
  res.json({
    services: [
      {
        title: 'Veteran Transition Programs',
        description:
          'Specialized workforce development programs for transitioning military personnel.',
        features: [
          'Skills translation and assessment',
          'Industry-specific training pathways',
          'Career placement assistance',
          'Ongoing mentorship support',
        ],
      },
      {
        title: 'Military Spouse Support',
        description: 'Flexible training programs designed for military families.',
        features: [
          'Remote learning options',
          'Portable certifications',
          'Childcare support services',
          'Flexible scheduling',
        ],
      },
      {
        title: 'Veteran Entrepreneurship',
        description: 'Business development and entrepreneurship training for veterans.',
        features: [
          'Business plan development',
          'Access to capital resources',
          'Mentorship networks',
          'Government contracting guidance',
        ],
      },
    ],
  });
});

// Philanthropy API routes
app.get('/api/philanthropy/overview', (req, res) => {
  res.json({
    mission:
      'Empowering communities through education, workforce development, and social impact initiatives that create lasting pathways to prosperity.',
    founder: {
      name: 'Elizabeth L. Greene',
      bio: 'A visionary leader committed to creating pathways to prosperity through education and workforce development.',
    },
    priorities: [
      {
        title: 'Workforce Development',
        description: 'Skills training and career pathways for underserved communities',
        icon: '💼',
      },
      {
        title: 'Justice-Involved Individuals',
        description: 'Reentry programs and second-chance opportunities',
        icon: '🔄',
      },
      {
        title: 'Youth Development',
        description: 'Educational and mentorship programs for at-risk youth',
        icon: '🌟',
      },
      {
        title: 'Health & Wellness',
        description: 'Community health initiatives and wellness programs',
        icon: '🏥',
      },
      {
        title: 'Entrepreneurship',
        description: 'Small business development and entrepreneurship training',
        icon: '🚀',
      },
    ],
    quickStats: [
      { value: '1,247', label: 'Learners Supported' },
      { value: '$2.85M', label: 'Funding Distributed' },
      { value: '87%', label: 'Program Completion' },
      { value: '82%', label: 'Job Placement Rate' },
    ],
    grantTypes: [
      {
        title: 'Individual Learner Grants',
        fundingRange: '$500 - $5,000',
        description: 'Direct support for individuals pursuing education and training programs.',
        eligibleRecipients: [
          'Low-income individuals',
          'Justice-involved individuals',
          'Veterans and military families',
          'Single parents',
          'Youth aging out of foster care',
        ],
      },
      {
        title: 'Organizational Grants',
        fundingRange: '$10,000 - $100,000',
        description:
          'Support for nonprofits and community organizations delivering impactful programs.',
        eligibleRecipients: [
          '501(c)(3) nonprofit organizations',
          'Community colleges',
          'Workforce development boards',
          'Faith-based organizations',
          'Community-based organizations',
        ],
      },
    ],
  });
});

app.get('/api/philanthropy/impact', (req, res) => {
  res.json({
    metrics: [
      { value: '1,247', label: 'Total Learners' },
      { value: '87%', label: 'Graduation Rate' },
      { value: '82%', label: 'Job Placement' },
      { value: '$2.85M', label: 'Total Funding' },
      { value: '156', label: 'Partner Organizations' },
      { value: '23', label: 'States Served' },
    ],
    stories: [
      {
        title: 'From Incarceration to IT Career',
        quote:
          "The program gave me the skills and confidence to build a new life. I'm now working as a network technician and supporting my family.",
        participant: 'Marcus Johnson',
        program: 'Justice-Involved IT Training',
        outcome: 'Employed as Network Technician, $45K salary',
      },
      {
        title: 'Single Mother Becomes Entrepreneur',
        quote:
          'With the grant support, I was able to start my catering business. Now I employ three other single mothers in my community.',
        participant: 'Sarah Martinez',
        program: 'Entrepreneurship Development',
        outcome: 'Started successful catering business',
      },
      {
        title: 'Veteran Transitions to Healthcare',
        quote:
          "The program helped me translate my military experience into healthcare skills. I'm now a certified medical assistant.",
        participant: 'David Thompson',
        program: 'Veteran Healthcare Training',
        outcome: 'Certified Medical Assistant, $38K salary',
      },
    ],
  });
});

app.get('/api/philanthropy/giving', (req, res) => {
  res.json({
    options: [
      {
        title: 'Monthly Sponsor',
        description: 'Provide ongoing support for learners in our programs',
        amount: '$25/month',
        impact: "Supports one learner's monthly materials",
        buttonText: 'Become a Sponsor',
        icon: '💝',
      },
      {
        title: 'Program Supporter',
        description: 'Fund a complete training program for one individual',
        amount: '$500',
        impact: 'Covers full program costs for one learner',
        buttonText: 'Support a Program',
        icon: '🎓',
      },
      {
        title: 'Community Champion',
        description: 'Support an entire cohort of learners',
        amount: '$2,500',
        impact: 'Funds training for 5 learners',
        buttonText: 'Champion a Cohort',
        icon: '🏆',
      },
      {
        title: 'Impact Partner',
        description: 'Create lasting change in a community',
        amount: '$10,000',
        impact: 'Establishes new program location',
        buttonText: 'Partner with Us',
        icon: '🤝',
      },
    ],
    recognition: [
      {
        title: 'Friend',
        amount: '$1 - $99',
        benefits: 'Newsletter updates',
        icon: '👋',
      },
      {
        title: 'Supporter',
        amount: '$100 - $499',
        benefits: 'Quarterly impact reports',
        icon: '🌟',
      },
      {
        title: 'Champion',
        amount: '$500 - $2,499',
        benefits: 'Annual recognition event invitation',
        icon: '🏆',
      },
      {
        title: 'Partner',
        amount: '$2,500+',
        benefits: 'Board meeting invitations, site visits',
        icon: '🤝',
      },
    ],
  });
});

// Catch-all for React Router
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {});
