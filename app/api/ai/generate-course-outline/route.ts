import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // In production, use OpenAI API
    // For now, generate intelligent outline based on prompt analysis
    const outline = await generateCourseOutline(prompt);

    return NextResponse.json(outline);
  } catch (err: any) {
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to generate course outline' },
      { status: 500 }
    );
  }
}

async function generateCourseOutline(prompt: string) {
  // Analyze prompt to determine course type
  const promptLower = prompt.toLowerCase();

  // Detect course type
  let courseType = 'general';
  let title = 'Professional Training Course';
  let duration = '40 hours';
  let level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';

  if (promptLower.includes('hvac')) {
    courseType = 'hvac';
    title = 'HVAC Technician Certification Training';
    duration = '120 hours';
  } else if (
    promptLower.includes('cna') ||
    promptLower.includes('nursing assistant')
  ) {
    courseType = 'cna';
    title = 'Certified Nursing Assistant (CNA) Training';
    duration = '75 hours';
  } else if (
    promptLower.includes('cdl') ||
    promptLower.includes('commercial driver')
  ) {
    courseType = 'cdl';
    title = 'Commercial Driver License (CDL) Training';
    duration = '160 hours';
  } else if (promptLower.includes('barber')) {
    courseType = 'barber';
    title = 'Professional Barber Apprenticeship';
    duration = '2000 hours';
  } else if (
    promptLower.includes('medical assistant') ||
    promptLower.includes('direct support professional') ||
    promptLower.includes('dsp')
  ) {
    courseType = 'direct-support-professional';
    title = 'Direct Support Professional (DSP) Training Program';
    duration = '720 hours';
  }

  // Detect level
  if (
    promptLower.includes('beginner') ||
    promptLower.includes('basic') ||
    promptLower.includes('introduction')
  ) {
    level = 'beginner';
  } else if (
    promptLower.includes('advanced') ||
    promptLower.includes('expert')
  ) {
    level = 'advanced';
  }

  // Generate modules based on course type
  const modules = generateModules(courseType, level);

  return {
    title,
    description: `A comprehensive ${level} level training program designed to provide students with the knowledge and skills needed for professional certification and career success.`,
    duration,
    level,
    modules,
  };
}

function generateModules(courseType: string, level: string) {
  const moduleTemplates: Record<string, any[]> = {
    hvac: [
      {
        id: 'mod-1',
        title: 'HVAC Fundamentals',
        description:
          'Introduction to heating, ventilation, and air conditioning systems',
        duration: 480,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Introduction to HVAC Systems',
            type: 'video',
            content: '',
            duration: 45,
            objectives: [
              'Understand the basic principles of HVAC',
              'Identify major system components',
              'Recognize different system types',
            ],
          },
          {
            id: 'lesson-1-2',
            title: 'Thermodynamics Basics',
            type: 'reading',
            content: '',
            duration: 60,
            objectives: [
              'Understand heat transfer principles',
              'Learn about temperature and pressure relationships',
              'Apply thermodynamic concepts to HVAC',
            ],
          },
          {
            id: 'lesson-1-3',
            title: 'System Components Overview',
            type: 'video',
            content: '',
            duration: 50,
            objectives: [
              'Identify compressors, condensers, and evaporators',
              'Understand refrigerant flow',
              'Recognize control systems',
            ],
          },
          {
            id: 'lesson-1-4',
            title: 'Module 1 Assessment',
            type: 'quiz',
            content: '',
            duration: 30,
            objectives: ['Demonstrate understanding of HVAC fundamentals'],
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Electrical Systems',
        description: 'Understanding electrical components and circuits in HVAC',
        duration: 540,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Electrical Safety',
            type: 'video',
            content: '',
            duration: 40,
            objectives: [
              'Follow electrical safety protocols',
              'Use proper PPE',
              'Understand lockout/tagout procedures',
            ],
          },
          {
            id: 'lesson-2-2',
            title: 'Reading Electrical Schematics',
            type: 'video',
            content: '',
            duration: 60,
            objectives: [
              'Interpret wiring diagrams',
              'Identify electrical symbols',
              'Trace circuit paths',
            ],
          },
          {
            id: 'lesson-2-3',
            title: 'Troubleshooting Electrical Issues',
            type: 'assignment',
            content: '',
            duration: 90,
            objectives: [
              'Use multimeters effectively',
              'Diagnose common electrical problems',
              'Repair faulty circuits',
            ],
          },
          {
            id: 'lesson-2-4',
            title: 'Module 2 Assessment',
            type: 'quiz',
            content: '',
            duration: 30,
            objectives: ['Demonstrate electrical system knowledge'],
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Refrigeration Cycle',
        description: 'Deep dive into refrigeration principles and applications',
        duration: 600,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Refrigeration Fundamentals',
            type: 'video',
            content: '',
            duration: 50,
            objectives: [
              'Understand the refrigeration cycle',
              'Learn about refrigerants',
              'Identify cycle stages',
            ],
          },
          {
            id: 'lesson-3-2',
            title: 'Refrigerant Handling',
            type: 'video',
            content: '',
            duration: 45,
            objectives: [
              'Follow EPA regulations',
              'Handle refrigerants safely',
              'Recover and recycle refrigerants',
            ],
          },
          {
            id: 'lesson-3-3',
            title: 'System Charging',
            type: 'assignment',
            content: '',
            duration: 90,
            objectives: [
              'Calculate proper refrigerant charge',
              'Charge systems correctly',
              'Verify system performance',
            ],
          },
          {
            id: 'lesson-3-4',
            title: 'Module 3 Assessment',
            type: 'quiz',
            content: '',
            duration: 30,
            objectives: ['Demonstrate refrigeration knowledge'],
          },
        ],
      },
      {
        id: 'mod-4',
        title: 'EPA 608 Certification Prep',
        description: 'Preparation for EPA Section 608 certification exam',
        duration: 480,
        lessons: [
          {
            id: 'lesson-4-1',
            title: 'Core Exam Preparation',
            type: 'video',
            content: '',
            duration: 60,
            objectives: [
              'Understand EPA regulations',
              'Learn about ozone depletion',
              'Study Clean Air Act requirements',
            ],
          },
          {
            id: 'lesson-4-2',
            title: 'Type I Certification',
            type: 'reading',
            content: '',
            duration: 45,
            objectives: [
              'Small appliance regulations',
              'Recovery requirements',
              'Disposal procedures',
            ],
          },
          {
            id: 'lesson-4-3',
            title: 'Type II Certification',
            type: 'reading',
            content: '',
            duration: 45,
            objectives: [
              'High-pressure system requirements',
              'Recovery techniques',
              'Leak detection',
            ],
          },
          {
            id: 'lesson-4-4',
            title: 'Type III Certification',
            type: 'reading',
            content: '',
            duration: 45,
            objectives: [
              'Low-pressure system requirements',
              'Recovery procedures',
              'Safety protocols',
            ],
          },
          {
            id: 'lesson-4-5',
            title: 'EPA 608 Practice Exam',
            type: 'quiz',
            content: '',
            duration: 60,
            objectives: ['Pass EPA 608 certification exam'],
          },
        ],
      },
      {
        id: 'mod-5',
        title: 'Installation and Maintenance',
        description: 'Hands-on installation and preventive maintenance',
        duration: 720,
        lessons: [
          {
            id: 'lesson-5-1',
            title: 'System Installation',
            type: 'video',
            content: '',
            duration: 90,
            objectives: [
              'Install residential systems',
              'Follow installation best practices',
              'Test system operation',
            ],
          },
          {
            id: 'lesson-5-2',
            title: 'Preventive Maintenance',
            type: 'assignment',
            content: '',
            duration: 120,
            objectives: [
              'Perform routine maintenance',
              'Clean and inspect components',
              'Document service work',
            ],
          },
          {
            id: 'lesson-5-3',
            title: 'Troubleshooting Common Issues',
            type: 'video',
            content: '',
            duration: 90,
            objectives: [
              'Diagnose system problems',
              'Repair common failures',
              'Optimize system performance',
            ],
          },
          {
            id: 'lesson-5-4',
            title: 'Final Practical Assessment',
            type: 'assignment',
            content: '',
            duration: 120,
            objectives: ['Demonstrate complete HVAC competency'],
          },
        ],
      },
    ],
    cna: [
      {
        id: 'mod-1',
        title: 'Introduction to Nursing Assistance',
        description:
          'Role and responsibilities of a Certified Nursing Assistant',
        duration: 240,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'CNA Role and Responsibilities',
            type: 'video',
            content: '',
            duration: 45,
            objectives: [
              'Understand CNA scope of practice',
              'Learn professional standards',
              'Recognize ethical responsibilities',
            ],
          },
          {
            id: 'lesson-1-2',
            title: 'Healthcare Team Communication',
            type: 'reading',
            content: '',
            duration: 30,
            objectives: [
              'Communicate effectively with team',
              'Document patient information',
              'Report changes in condition',
            ],
          },
          {
            id: 'lesson-1-3',
            title: 'Patient Rights and Privacy',
            type: 'video',
            content: '',
            duration: 40,
            objectives: [
              'Understand HIPAA regulations',
              'Respect patient dignity',
              'Maintain confidentiality',
            ],
          },
          {
            id: 'lesson-1-4',
            title: 'Module 1 Assessment',
            type: 'quiz',
            content: '',
            duration: 25,
            objectives: ['Demonstrate understanding of CNA role'],
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Basic Nursing Skills',
        description: 'Essential patient care skills and procedures',
        duration: 480,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Vital Signs Measurement',
            type: 'video',
            content: '',
            duration: 60,
            objectives: [
              'Measure temperature, pulse, respiration',
              'Take blood pressure accurately',
              'Document vital signs',
            ],
          },
          {
            id: 'lesson-2-2',
            title: 'Personal Care and Hygiene',
            type: 'video',
            content: '',
            duration: 75,
            objectives: [
              'Assist with bathing and grooming',
              'Provide oral care',
              'Maintain patient dignity',
            ],
          },
          {
            id: 'lesson-2-3',
            title: 'Mobility and Positioning',
            type: 'assignment',
            content: '',
            duration: 90,
            objectives: [
              'Transfer patients safely',
              'Use proper body mechanics',
              'Prevent pressure injuries',
            ],
          },
          {
            id: 'lesson-2-4',
            title: 'Module 2 Skills Check',
            type: 'assignment',
            content: '',
            duration: 60,
            objectives: ['Demonstrate basic nursing skills'],
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Infection Control',
        description:
          'Preventing the spread of infection in healthcare settings',
        duration: 300,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Standard Precautions',
            type: 'video',
            content: '',
            duration: 45,
            objectives: [
              'Follow standard precautions',
              'Use PPE correctly',
              'Practice hand hygiene',
            ],
          },
          {
            id: 'lesson-3-2',
            title: 'Isolation Procedures',
            type: 'video',
            content: '',
            duration: 40,
            objectives: [
              'Understand isolation types',
              'Follow isolation protocols',
              'Prevent cross-contamination',
            ],
          },
          {
            id: 'lesson-3-3',
            title: 'Infection Control Assessment',
            type: 'quiz',
            content: '',
            duration: 30,
            objectives: ['Demonstrate infection control knowledge'],
          },
        ],
      },
      {
        id: 'mod-4',
        title: 'Clinical Skills',
        description: 'Advanced patient care procedures',
        duration: 600,
        lessons: [
          {
            id: 'lesson-4-1',
            title: 'Nutrition and Feeding',
            type: 'video',
            content: '',
            duration: 60,
            objectives: [
              'Assist with meals',
              'Monitor fluid intake',
              'Recognize nutritional needs',
            ],
          },
          {
            id: 'lesson-4-2',
            title: 'Elimination Care',
            type: 'video',
            content: '',
            duration: 50,
            objectives: [
              'Assist with toileting',
              'Provide catheter care',
              'Maintain patient dignity',
            ],
          },
          {
            id: 'lesson-4-3',
            title: 'Emergency Procedures',
            type: 'video',
            content: '',
            duration: 75,
            objectives: [
              'Recognize emergency situations',
              'Perform CPR',
              'Use AED',
            ],
          },
          {
            id: 'lesson-4-4',
            title: 'Clinical Skills Competency',
            type: 'assignment',
            content: '',
            duration: 120,
            objectives: ['Demonstrate clinical competency'],
          },
        ],
      },
      {
        id: 'mod-5',
        title: 'State Certification Prep',
        description: 'Preparation for state CNA certification exam',
        duration: 360,
        lessons: [
          {
            id: 'lesson-5-1',
            title: 'Written Exam Review',
            type: 'reading',
            content: '',
            duration: 90,
            objectives: [
              'Review all course content',
              'Practice test questions',
              'Identify knowledge gaps',
            ],
          },
          {
            id: 'lesson-5-2',
            title: 'Skills Exam Preparation',
            type: 'assignment',
            content: '',
            duration: 120,
            objectives: [
              'Practice required skills',
              'Perfect technique',
              'Build confidence',
            ],
          },
          {
            id: 'lesson-5-3',
            title: 'Practice Certification Exam',
            type: 'quiz',
            content: '',
            duration: 90,
            objectives: ['Pass state certification exam'],
          },
        ],
      },
    ],
    general: [
      {
        id: 'mod-1',
        title: 'Course Introduction',
        description: 'Overview and learning objectives',
        duration: 180,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Welcome and Course Overview',
            type: 'video',
            content: '',
            duration: 30,
            objectives: ['Understand course structure and expectations'],
          },
          {
            id: 'lesson-1-2',
            title: 'Learning Objectives',
            type: 'reading',
            content: '',
            duration: 20,
            objectives: ['Identify key learning outcomes'],
          },
          {
            id: 'lesson-1-3',
            title: 'Getting Started',
            type: 'video',
            content: '',
            duration: 25,
            objectives: ['Navigate the learning platform'],
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Core Concepts',
        description: 'Fundamental principles and theories',
        duration: 360,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Foundational Knowledge',
            type: 'video',
            content: '',
            duration: 60,
            objectives: ['Understand core concepts'],
          },
          {
            id: 'lesson-2-2',
            title: 'Key Principles',
            type: 'reading',
            content: '',
            duration: 45,
            objectives: ['Apply fundamental principles'],
          },
          {
            id: 'lesson-2-3',
            title: 'Practical Applications',
            type: 'assignment',
            content: '',
            duration: 60,
            objectives: ['Demonstrate understanding through practice'],
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Advanced Topics',
        description: 'In-depth exploration of subject matter',
        duration: 480,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Advanced Concepts',
            type: 'video',
            content: '',
            duration: 75,
            objectives: ['Master advanced topics'],
          },
          {
            id: 'lesson-3-2',
            title: 'Case Studies',
            type: 'reading',
            content: '',
            duration: 60,
            objectives: ['Analyze real-world scenarios'],
          },
          {
            id: 'lesson-3-3',
            title: 'Hands-On Project',
            type: 'assignment',
            content: '',
            duration: 90,
            objectives: ['Apply knowledge to practical projects'],
          },
        ],
      },
      {
        id: 'mod-4',
        title: 'Final Assessment',
        description: 'Comprehensive evaluation of learning',
        duration: 240,
        lessons: [
          {
            id: 'lesson-4-1',
            title: 'Review and Preparation',
            type: 'reading',
            content: '',
            duration: 60,
            objectives: ['Review all course material'],
          },
          {
            id: 'lesson-4-2',
            title: 'Final Exam',
            type: 'quiz',
            content: '',
            duration: 90,
            objectives: ['Demonstrate mastery of course content'],
          },
        ],
      },
    ],
  };

  return moduleTemplates[courseType] || moduleTemplates.general;
}
export const POST = withApiAudit('/api/ai/generate-course-outline', _POST);
