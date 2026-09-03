/*
  Copyright (c) 2025 Elevate for Humanity
  Veteran Services and Accessibility System
  Commercial License. No resale, sublicensing, or redistribution allowed.
*/

const express = require('express');
const fs = require('fs');
const path = require('path');

class VeteranServicesSystem {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
    this.veteranData = this.loadVeteranData();
  }

  loadVeteranData() {
    return {
      benefits: {
        gibill: {
          chapter33: {
            name: 'Post-9/11 GI Bill (Chapter 33)',
            description:
              'Comprehensive education benefits for veterans with qualifying service after 9/11',
            coverage: {
              tuition: '100% of in-state tuition or up to private school cap',
              housing: 'Monthly housing allowance based on location',
              books: '$1,000 annual book stipend',
              duration: '36 months of benefits',
            },
            eligibility:
              '90+ days active duty after 9/10/2001 or 30+ days with service-connected discharge',
            transferability: 'Can transfer unused benefits to spouse/children',
          },
          chapter30: {
            name: 'Montgomery GI Bill (Chapter 30)',
            description: 'Education benefits for veterans who contributed to MGIB during service',
            coverage: {
              monthly: '$2,122 per month for full-time training',
              duration: '36 months of benefits',
              additional: 'Kicker payments if eligible',
            },
            eligibility: 'Contributed $1,200 during first year of service',
          },
          chapter31: {
            name: 'Vocational Rehabilitation (Chapter 31)',
            description:
              'Comprehensive rehabilitation for veterans with service-connected disabilities',
            coverage: {
              tuition: 'Full tuition and fees',
              housing: 'Monthly housing allowance',
              supplies: 'Books, supplies, and equipment',
              duration: 'Up to 48 months of benefits',
            },
            eligibility: 'Service-connected disability rating of 20% or higher',
          },
          vrrap: {
            name: 'Veteran Rapid Retraining Assistance Program',
            description:
              'Additional education benefits for unemployed veterans affected by COVID-19',
            coverage: {
              duration: 'Up to 12 months of additional benefits',
              amount: 'Equal to monthly housing allowance',
              programs: 'High-demand occupations only',
            },
            eligibility: 'Unemployed due to COVID-19, exhausted other GI Bill benefits',
          },
        },
        state: {
          indiana: {
            name: 'Indiana Veterans Education Benefits',
            programs: [
              'Purple Heart Scholarship',
              'Indiana National Guard Scholarship',
              'Child of Veteran Scholarship',
            ],
          },
          federal: {
            name: 'Federal Veterans Benefits',
            programs: [
              'Yellow Ribbon Program',
              'Scholarship for Military Children',
              'Veterans Education Success Scholarship',
            ],
          },
        },
      },
      services: {
        counseling: {
          name: 'Veteran Education Counseling',
          description: 'Dedicated counselors specializing in veteran education benefits',
          services: [
            'Benefits eligibility assessment',
            'Program selection guidance',
            'Career transition planning',
            'Academic support and tutoring',
            'Mental health and wellness resources',
          ],
          contact: {
            phone: '317-760-7908 ext. 101',
            email: 'veterans@elevateforhumanity.org',
            hours: 'Monday-Friday 8AM-6PM EST',
          },
        },
        accessibility: {
          name: 'Accessibility Services',
          description: 'Comprehensive accommodations for veterans with disabilities',
          services: [
            'Assistive technology training',
            'Alternative format materials',
            'Extended time for assessments',
            'Sign language interpreters',
            'Note-taking assistance',
            'Flexible scheduling options',
          ],
          compliance: [
            'Section 508 compliant',
            'ADA compliant facilities',
            'WCAG 2.1 AA web accessibility',
          ],
        },
        career: {
          name: 'Career Transition Services',
          description: 'Specialized career services for military-to-civilian transition',
          services: [
            'Military skills translation',
            'Resume writing for civilian jobs',
            'Interview preparation',
            'Networking opportunities',
            'Employer partnerships with veteran-friendly companies',
            'Apprenticeship and OJT placements',
          ],
        },
        financial: {
          name: 'Financial Support Services',
          description: 'Additional financial assistance beyond GI Bill benefits',
          services: [
            'Emergency financial assistance',
            'Textbook and supply vouchers',
            'Transportation assistance',
            'Childcare support',
            'Technology equipment loans',
          ],
        },
      },
      programs: {
        cybersecurity: {
          name: 'Cybersecurity Specialist Program',
          duration: '6 months',
          format: 'Hybrid (online + hands-on labs)',
          certifications: ['CompTIA Security+', 'CISSP Associate'],
          veteranFriendly: true,
          clearanceJobs: true,
          placement: {
            rate: 94,
            averageSalary: 75000,
            employers: ['Government contractors', 'Defense companies', 'Financial institutions'],
          },
        },
        dataScience: {
          name: 'Data Science and Analytics',
          duration: '8 months',
          format: 'Online with virtual labs',
          certifications: ['Google Data Analytics', 'Microsoft Azure Data Scientist'],
          veteranFriendly: true,
          placement: {
            rate: 89,
            averageSalary: 68000,
            employers: ['Tech companies', 'Healthcare', 'Government agencies'],
          },
        },
        projectManagement: {
          name: 'Project Management Professional',
          duration: '4 months',
          format: 'Evening and weekend options',
          certifications: ['PMP', 'Agile/Scrum Master'],
          veteranFriendly: true,
          leadership: true,
          placement: {
            rate: 92,
            averageSalary: 72000,
            employers: ['All industries', 'Government contractors', 'Consulting firms'],
          },
        },
      },
      partnerships: {
        va: {
          name: 'Department of Veterans Affairs',
          relationship: 'Approved education provider',
          services: ['GI Bill processing', 'VR&E coordination', 'Disability accommodations'],
        },
        sva: {
          name: 'Student Veterans of America',
          relationship: 'Chapter partner',
          services: ['Peer support', 'Networking events', 'Leadership development'],
        },
        corporatePartners: [
          {
            name: 'Lockheed Martin',
            type: 'Defense contractor',
            opportunities: ['Cybersecurity roles', 'Clearance positions', 'Apprenticeships'],
          },
          {
            name: 'Raytheon Technologies',
            type: 'Defense contractor',
            opportunities: ['Engineering roles', 'Project management', 'Technical positions'],
          },
          {
            name: 'Amazon Web Services',
            type: 'Technology',
            opportunities: ['Cloud computing', 'Data analytics', 'Technical support'],
          },
          {
            name: 'Microsoft',
            type: 'Technology',
            opportunities: ['Software development', 'Data science', 'Cybersecurity'],
          },
        ],
      },
      statistics: {
        enrollment: {
          total: 1247,
          veterans: 342,
          activeService: 89,
          spouses: 156,
          dependents: 78,
        },
        outcomes: {
          completionRate: 94,
          placementRate: 89,
          averageWageIncrease: 42,
          clearanceJobs: 67,
          governmentPositions: 34,
        },
        satisfaction: {
          overall: 4.8,
          instruction: 4.9,
          support: 4.7,
          careerServices: 4.6,
        },
      },
    };
  }

  setupRoutes() {
    // Veteran services overview
    this.router.get('/api/veterans/services', this.getVeteranServices.bind(this));

    // GI Bill and benefits information
    this.router.get('/api/veterans/benefits', this.getBenefitsInfo.bind(this));

    // Veteran-friendly programs
    this.router.get('/api/veterans/programs', this.getVeteranPrograms.bind(this));

    // Accessibility services
    this.router.get('/api/veterans/accessibility', this.getAccessibilityServices.bind(this));

    // Career transition services
    this.router.get('/api/veterans/career', this.getCareerServices.bind(this));

    // Veteran statistics and outcomes
    this.router.get('/api/veterans/statistics', this.getVeteranStatistics.bind(this));

    // Partner organizations
    this.router.get('/api/veterans/partners', this.getPartnerOrganizations.bind(this));

    // Benefits eligibility check
    this.router.post('/api/veterans/eligibility', this.checkEligibility.bind(this));

    // Request veteran services
    this.router.post('/api/veterans/request-services', this.requestServices.bind(this));
  }

  async getVeteranServices(req, res) {
    try {
      const services = {
        overview: {
          mission:
            'Supporting veterans, active service members, and military families in their educational and career goals',
          commitment: 'Dedicated veteran services with specialized support and accommodations',
          certifications: [
            'VA-approved for GI Bill benefits',
            'VR&E approved training provider',
            'Yellow Ribbon Program participant',
            'Military Friendly School designation',
          ],
        },
        services: this.veteranData.services,
        quickLinks: [
          {
            title: 'Check GI Bill Eligibility',
            url: '/veterans/eligibility',
            description: 'Verify your education benefits',
          },
          {
            title: 'Request Accommodations',
            url: '/veterans/accommodations',
            description: 'Disability and accessibility services',
          },
          {
            title: 'Career Transition Support',
            url: '/veterans/career',
            description: 'Military-to-civilian career guidance',
          },
          {
            title: 'Emergency Financial Aid',
            url: '/veterans/financial-aid',
            description: 'Additional financial support',
          },
        ],
        contact: {
          veteranServices: {
            phone: '317-760-7908 ext. 101',
            email: 'veterans@elevateforhumanity.org',
            hours: 'Monday-Friday 8AM-6PM EST',
          },
          accessibility: {
            phone: '317-760-7908 ext. 102',
            email: 'accessibility@elevateforhumanity.org',
            hours: 'Monday-Friday 8AM-5PM EST',
          },
        },
      };

      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBenefitsInfo(req, res) {
    try {
      const benefits = {
        gibill: this.veteranData.benefits.gibill,
        state: this.veteranData.benefits.state,
        application: {
          process: [
            'Apply for benefits at va.gov',
            'Receive Certificate of Eligibility',
            'Submit COE to our Veterans Services office',
            'Complete enrollment and benefit certification',
            'Begin classes with benefits active',
          ],
          timeline: '2-4 weeks for initial processing',
          support: 'Our veteran counselors assist with the entire process',
        },
        maximizing: {
          tips: [
            'Use Yellow Ribbon benefits for private school costs',
            'Consider VR&E for additional months if eligible',
            'Transfer unused benefits to family members',
            'Combine with state and private scholarships',
            'Use work-study programs for additional income',
          ],
        },
      };

      res.json(benefits);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getVeteranPrograms(req, res) {
    try {
      const programs = {
        featured: this.veteranData.programs,
        veteranAdvantages: [
          'Military experience credit toward program requirements',
          'Flexible scheduling for Guard/Reserve obligations',
          'Security clearance-eligible career tracks',
          'Leadership development opportunities',
          'Veteran-to-veteran mentorship',
          'Employer partnerships with veteran-friendly companies',
        ],
        specializations: {
          cybersecurity: {
            militaryRelevance: 'High demand for veterans with security clearances',
            careerPaths: [
              'Information Security Analyst',
              'Cybersecurity Specialist',
              'Security Consultant',
            ],
            clearanceRequired: 'Many positions require security clearance',
          },
          dataScience: {
            militaryRelevance: 'Analytical skills from military experience highly valued',
            careerPaths: ['Data Analyst', 'Business Intelligence Analyst', 'Data Scientist'],
            governmentOpportunities: 'Strong demand in government and defense sectors',
          },
          projectManagement: {
            militaryRelevance: 'Military leadership experience directly applicable',
            careerPaths: ['Project Manager', 'Program Manager', 'Scrum Master'],
            advancement: 'Fast track to senior management roles',
          },
        },
      };

      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAccessibilityServices(req, res) {
    try {
      const accessibility = {
        services: this.veteranData.services.accessibility,
        accommodations: {
          learning: [
            'Extended time for tests and assignments',
            'Alternative format materials (large print, audio, digital)',
            'Note-taking assistance',
            'Recording of lectures',
            'Preferential seating',
            'Reduced distraction environment',
          ],
          technology: [
            'Screen reading software',
            'Voice recognition software',
            'Magnification software',
            'Alternative keyboards and mice',
            'Closed captioning for videos',
            'Audio description for visual content',
          ],
          physical: [
            'Wheelchair accessible facilities',
            'Adjustable desks and seating',
            'Accessible parking',
            'Sign language interpreters',
            'Assistive listening devices',
            'Service animal accommodations',
          ],
        },
        process: {
          steps: [
            'Contact Accessibility Services office',
            'Provide documentation of disability',
            'Meet with accessibility counselor',
            'Develop accommodation plan',
            'Coordinate with instructors',
            'Monitor and adjust as needed',
          ],
          documentation: 'Medical, psychological, or educational documentation required',
          confidentiality: 'All information kept strictly confidential',
        },
        compliance: {
          section508: 'All digital content meets Section 508 standards',
          ada: 'Full compliance with Americans with Disabilities Act',
          wcag: 'Web Content Accessibility Guidelines 2.1 AA compliant',
        },
      };

      res.json(accessibility);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCareerServices(req, res) {
    try {
      const career = {
        services: this.veteranData.services.career,
        militaryTransition: {
          skillsTranslation: [
            'Military Occupational Specialty (MOS) to civilian job mapping',
            'Leadership experience documentation',
            'Technical skills certification',
            'Security clearance value assessment',
          ],
          resumeServices: [
            'Military-to-civilian resume conversion',
            'Federal resume writing',
            'LinkedIn profile optimization',
            'Cover letter development',
          ],
          interviewPrep: [
            'Civilian interview techniques',
            'Behavioral interview practice',
            'Technical interview preparation',
            'Salary negotiation strategies',
          ],
        },
        employerPartners: this.veteranData.partnerships.corporatePartners,
        jobPlacement: {
          process: [
            'Career assessment and goal setting',
            'Skills gap analysis',
            'Training program completion',
            'Job search strategy development',
            'Interview preparation and practice',
            'Job placement and follow-up support',
          ],
          support: '90-day post-placement support included',
          guarantee: 'Job placement assistance until successful placement',
        },
      };

      res.json(career);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getVeteranStatistics(req, res) {
    try {
      const statistics = {
        enrollment: this.veteranData.statistics.enrollment,
        outcomes: this.veteranData.statistics.outcomes,
        satisfaction: this.veteranData.statistics.satisfaction,
        demographics: {
          serviceEra: {
            'Post-9/11': 68,
            'Gulf War': 22,
            Vietnam: 8,
            Other: 2,
          },
          branch: {
            Army: 35,
            Navy: 22,
            'Air Force': 18,
            Marines: 15,
            'Coast Guard': 5,
            'Space Force': 3,
            'National Guard': 2,
          },
          gender: {
            Male: 72,
            Female: 26,
            'Non-binary': 2,
          },
        },
        trends: {
          enrollmentGrowth: 23,
          completionImprovement: 8,
          placementImprovement: 12,
          salaryGrowth: 15,
        },
      };

      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPartnerOrganizations(req, res) {
    try {
      const partners = {
        government: {
          va: this.veteranData.partnerships.va,
          dol: {
            name: 'Department of Labor',
            relationship: 'VETS program partner',
            services: ['Apprenticeship programs', 'Job placement assistance', 'Employer outreach'],
          },
          sba: {
            name: 'Small Business Administration',
            relationship: 'SCORE mentorship partner',
            services: [
              'Entrepreneurship training',
              'Business plan development',
              'Funding assistance',
            ],
          },
        },
        nonprofit: {
          sva: this.veteranData.partnerships.sva,
          iava: {
            name: 'Iraq and Afghanistan Veterans of America',
            relationship: 'Advocacy partner',
            services: ['Policy advocacy', 'Community building', 'Leadership development'],
          },
          ves: {
            name: 'Veterans Education Success',
            relationship: 'Education advocacy partner',
            services: ['Policy research', 'Student advocacy', 'Educational resources'],
          },
        },
        corporate: this.veteranData.partnerships.corporatePartners,
        benefits: [
          'Direct hiring partnerships',
          'Internship and apprenticeship opportunities',
          'Mentorship programs',
          'Networking events',
          'Job placement guarantees',
          'Continuing education support',
        ],
      };

      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async checkEligibility(req, res) {
    try {
      const { serviceType, serviceLength, dischargeType, serviceConnected, unemployed } = req.body;

      const eligibility = {
        gibill: {
          chapter33: serviceLength >= 90 && dischargeType === 'honorable',
          chapter30: serviceType === 'active' && dischargeType === 'honorable',
          chapter31: serviceConnected >= 20,
          vrrap: unemployed && serviceLength >= 90,
        },
        recommendations: [],
        nextSteps: [],
      };

      // Add recommendations based on eligibility
      if (eligibility.gibill.chapter33) {
        eligibility.recommendations.push({
          benefit: 'Post-9/11 GI Bill',
          reason: 'Best overall benefits for most veterans',
          action: 'Apply at va.gov',
        });
      }

      if (eligibility.gibill.chapter31) {
        eligibility.recommendations.push({
          benefit: 'Vocational Rehabilitation',
          reason: 'Additional months and comprehensive support',
          action: 'Contact VR&E counselor',
        });
      }

      if (eligibility.gibill.vrrap) {
        eligibility.recommendations.push({
          benefit: 'VRRAP',
          reason: 'Additional 12 months for high-demand training',
          action: 'Apply for approved programs',
        });
      }

      // Add next steps
      eligibility.nextSteps = [
        'Contact our Veteran Services office at 317-760-7908 ext. 101',
        'Schedule benefits counseling appointment',
        'Gather required documentation',
        'Apply for appropriate benefits',
        'Complete enrollment process',
      ];

      res.json(eligibility);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async requestServices(req, res) {
    try {
      const { serviceType, veteranInfo, accommodations, urgency } = req.body;

      const request = {
        id: 'VET-' + Date.now(),
        serviceType,
        veteranInfo,
        accommodations,
        urgency,
        status: 'received',
        submittedAt: new Date().toISOString(),
        expectedResponse: urgency === 'urgent' ? '24 hours' : '2-3 business days',
      };

      // Log the request (in production, save to database)

      res.json({
        success: true,
        requestId: request.id,
        message:
          'Your request has been received and will be processed within ' + request.expectedResponse,
        nextSteps: [
          'You will receive a confirmation email shortly',
          'A veteran services counselor will contact you within ' + request.expectedResponse,
          'Please have your DD-214 and any medical documentation ready',
          'Call 317-760-7908 ext. 101 if you have urgent questions',
        ],
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = VeteranServicesSystem;
