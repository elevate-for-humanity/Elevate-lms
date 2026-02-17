import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  Target,
  Clock,
  Award,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Syllabi | Elevate for Humanity',
  description:
    'View detailed course syllabi with learning outcomes, assessments, and requirements',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/syllabi',
  },
};

const syllabi = [
  {
    program: 'Barbering/Cosmetology',
    slug: 'barbering',
    totalHours: 1500,
    courses: [
      {
        code: 'BARB-101',
        title: 'Fundamentals of Barbering',
        hours: 120,
        credits: 4,
        description:
          'Introduction to barbering profession, tools, equipment, and basic techniques.',
        learningOutcomes: [
          'Identify and properly use all barbering tools and equipment',
          'Demonstrate proper sanitation and sterilization procedures',
          'Explain the history and evolution of barbering',
          'Apply basic hair cutting techniques safely and effectively',
          'Demonstrate professional communication with clients',
        ],
        assessments: [
          'Written exam on tools and safety (20%)',
          'Practical demonstration of tool usage (30%)',
          'Sanitation procedures checklist (20%)',
          'Client consultation role-play (15%)',
          'Final practical exam (15%)',
        ],
        requiredMaterials: [
          'Professional barber kit (provided)',
          'Textbook: "Milady Standard Barbering"',
          'Safety equipment (provided)',
          'Practice mannequin head',
        ],
      },
      {
        code: 'BARB-102',
        title: 'Sanitation & Safety',
        hours: 60,
        credits: 2,
        description:
          'Comprehensive training in sanitation, sterilization, and safety protocols.',
        learningOutcomes: [
          'Apply OSHA safety standards in barbering environment',
          'Demonstrate proper sanitation of tools and workspace',
          'Identify and prevent cross-contamination',
          'Respond appropriately to accidents and emergencies',
          'Maintain compliance with state health regulations',
        ],
        assessments: [
          'Written safety exam (30%)',
          'Sanitation practical demonstration (40%)',
          'Emergency response scenarios (20%)',
          'Compliance checklist (10%)',
        ],
        requiredMaterials: [
          'State sanitation guidelines',
          'OSHA safety manual',
          'Sanitation supplies (provided)',
        ],
      },
    ],
  },
  {
    program: 'Certified Nursing Assistant (CNA)',
    slug: 'cna',
    totalHours: 120,
    courses: [
      {
        code: 'CNA-101',
        title: 'Introduction to Healthcare',
        hours: 30,
        credits: 1,
        description:
          'Overview of healthcare system, patient rights, and CNA role.',
        learningOutcomes: [
          'Explain the role and responsibilities of a CNA',
          'Describe patient rights under HIPAA and other regulations',
          'Demonstrate effective communication with patients and healthcare team',
          'Apply ethical principles in patient care',
          'Identify components of the healthcare delivery system',
        ],
        assessments: [
          'Written exam on healthcare systems (25%)',
          'HIPAA compliance quiz (20%)',
          'Communication skills assessment (25%)',
          'Ethics case study analysis (20%)',
          'Final comprehensive exam (10%)',
        ],
        requiredMaterials: [
          'Textbook: "Nursing Assistant Care"',
          'HIPAA training materials',
          'Patient rights handbook',
        ],
      },
      {
        code: 'CNA-102',
        title: 'Basic Patient Care',
        hours: 60,
        credits: 2,
        description: 'Hands-on training in essential patient care skills.',
        learningOutcomes: [
          'Perform activities of daily living (ADLs) assistance safely',
          'Demonstrate proper body mechanics and patient transfer techniques',
          'Take and record vital signs accurately',
          'Recognize and report changes in patient condition',
          'Provide compassionate, patient-centered care',
          'Maintain patient dignity and privacy',
        ],
        assessments: [
          'Skills checklist - ADLs (25%)',
          'Vital signs competency test (20%)',
          'Patient transfer practical exam (25%)',
          'Clinical observation assessment (20%)',
          'Final skills demonstration (10%)',
        ],
        requiredMaterials: [
          'Scrubs and appropriate footwear',
          'Stethoscope and blood pressure cuff',
          'Watch with second hand',
          'Clinical skills manual',
        ],
      },
      {
        code: 'CNA-201',
        title: 'Clinical Practicum',
        hours: 30,
        credits: 2,
        description: 'Supervised clinical experience in healthcare facility.',
        learningOutcomes: [
          'Apply classroom knowledge in real healthcare settings',
          'Demonstrate competency in all required CNA skills',
          'Work effectively as part of healthcare team',
          'Provide safe, quality patient care under supervision',
          'Document patient care accurately and timely',
          'Demonstrate professional behavior and work ethic',
        ],
        assessments: [
          'Clinical supervisor evaluation (40%)',
          'Skills competency checklist (30%)',
          'Professionalism assessment (15%)',
          'Documentation review (15%)',
        ],
        requiredMaterials: [
          'Clinical uniform',
          'Name badge',
          'Clinical documentation forms',
          'Liability insurance (provided)',
        ],
      },
    ],
  },
  {
    program: 'HVAC Technician',
    slug: 'hvac',
    totalHours: 360,
    courses: [
      {
        code: 'HVAC-101',
        title: 'HVAC Fundamentals',
        hours: 60,
        credits: 2,
        description:
          'Introduction to heating, ventilation, and air conditioning principles.',
        learningOutcomes: [
          'Explain basic thermodynamics and heat transfer principles',
          'Identify components of HVAC systems',
          'Read and interpret HVAC blueprints and schematics',
          'Use HVAC measurement tools and instruments',
          'Apply safety protocols for HVAC work',
        ],
        assessments: [
          'Written exam on HVAC principles (30%)',
          'Blueprint reading test (20%)',
          'Tool identification and usage (20%)',
          'Safety procedures demonstration (15%)',
          'Final comprehensive exam (15%)',
        ],
        requiredMaterials: [
          'HVAC tool kit (list provided)',
          'Textbook: "Modern Refrigeration and Air Conditioning"',
          'Safety equipment (provided)',
          'Calculator',
        ],
      },
      {
        code: 'HVAC-201',
        title: 'Refrigeration Principles',
        hours: 60,
        credits: 2,
        description:
          'Study of refrigeration cycle, refrigerants, and system components.',
        learningOutcomes: [
          'Explain the refrigeration cycle and its components',
          'Identify different types of refrigerants and their properties',
          'Demonstrate proper refrigerant handling and recovery',
          'Diagnose common refrigeration system problems',
          'Apply EPA regulations for refrigerant management',
        ],
        assessments: [
          'Refrigeration cycle exam (25%)',
          'Refrigerant handling practical (30%)',
          'System diagnosis scenarios (25%)',
          'EPA 608 practice test (20%)',
        ],
        requiredMaterials: [
          'Refrigerant recovery equipment (provided)',
          'EPA 608 study guide',
          'Pressure gauges',
          'Safety goggles and gloves',
        ],
      },
      {
        code: 'HVAC-301',
        title: 'Troubleshooting & Repair',
        hours: 80,
        credits: 3,
        description:
          'Advanced diagnostic and repair techniques for HVAC systems.',
        learningOutcomes: [
          'Systematically diagnose HVAC system failures',
          'Perform electrical troubleshooting on HVAC equipment',
          'Replace and repair HVAC components safely',
          'Test system performance and efficiency',
          'Document service calls and repairs professionally',
          'Provide accurate cost estimates for repairs',
        ],
        assessments: [
          'Diagnostic scenarios (30%)',
          'Electrical troubleshooting practical (25%)',
          'Component replacement demonstration (25%)',
          'Service documentation review (10%)',
          'Final comprehensive practical (10%)',
        ],
        requiredMaterials: [
          'Multimeter',
          'Complete HVAC tool set',
          'Service manual',
          'Documentation forms',
        ],
      },
    ],
  },
  {
    program: 'Tax Preparation',
    slug: 'tax-prep',
    totalHours: 240,
    courses: [
      {
        code: 'TAX-101',
        title: 'Tax Law Fundamentals',
        hours: 60,
        credits: 2,
        description:
          'Introduction to federal tax law and individual tax returns.',
        learningOutcomes: [
          'Explain the structure of the U.S. tax system',
          'Identify different types of income and their tax treatment',
          'Calculate standard and itemized deductions',
          'Determine filing status and exemptions',
          'Apply tax credits appropriately',
          'Complete Form 1040 accurately',
        ],
        assessments: [
          'Tax law written exam (30%)',
          'Form 1040 completion exercises (30%)',
          'Deduction calculation problems (20%)',
          'Tax credit scenarios (10%)',
          'Final comprehensive exam (10%)',
        ],
        requiredMaterials: [
          'IRS Publication 17',
          'Tax preparation textbook',
          'Calculator',
          'Practice tax forms',
        ],
      },
      {
        code: 'TAX-201',
        title: 'Business Tax Returns',
        hours: 60,
        credits: 2,
        description: 'Preparation of business tax returns and schedules.',
        learningOutcomes: [
          'Prepare Schedule C for sole proprietorships',
          'Complete partnership and S-corporation returns',
          'Calculate business deductions and depreciation',
          'Apply self-employment tax rules',
          'Advise clients on business tax strategies',
          'Maintain proper business tax records',
        ],
        assessments: [
          'Schedule C completion (25%)',
          'Business return scenarios (30%)',
          'Depreciation calculations (20%)',
          'Client advisory role-play (15%)',
          'Final exam (10%)',
        ],
        requiredMaterials: [
          'IRS business tax publications',
          'Business tax forms',
          'Depreciation tables',
          'Tax software access',
        ],
      },
      {
        code: 'TAX-301',
        title: 'Ethics & Professional Standards',
        hours: 30,
        credits: 1,
        description:
          'Professional ethics, IRS regulations, and tax preparer responsibilities.',
        learningOutcomes: [
          'Apply IRS Circular 230 regulations',
          'Identify and avoid conflicts of interest',
          'Maintain client confidentiality',
          'Recognize and report tax fraud',
          'Understand due diligence requirements',
          'Manage professional liability',
        ],
        assessments: [
          'Ethics case studies (40%)',
          'Circular 230 exam (30%)',
          'Due diligence scenarios (20%)',
          'Professional conduct assessment (10%)',
        ],
        requiredMaterials: [
          'IRS Circular 230',
          'Ethics handbook',
          'Case study materials',
        ],
      },
    ],
  },
  {
    program: "Commercial Driver's License (CDL)",
    slug: 'cdl',
    totalHours: 160,
    courses: [
      {
        code: 'CDL-101',
        title: 'CDL Regulations & Safety',
        hours: 30,
        credits: 1,
        description:
          'Federal and state regulations governing commercial driving.',
        learningOutcomes: [
          'Explain FMCSA regulations and compliance requirements',
          'Maintain accurate hours of service logs',
          'Identify and comply with weight and size restrictions',
          'Apply defensive driving techniques',
          'Respond appropriately to roadside inspections',
        ],
        assessments: [
          'FMCSA regulations exam (30%)',
          'Hours of service log exercises (25%)',
          'Safety procedures test (25%)',
          'Inspection preparation (20%)',
        ],
        requiredMaterials: [
          'CDL manual (state-specific)',
          'FMCSA regulations handbook',
          'Log book',
        ],
      },
      {
        code: 'CDL-102',
        title: 'Vehicle Inspection',
        hours: 30,
        credits: 1,
        description:
          'Pre-trip, en-route, and post-trip vehicle inspection procedures.',
        learningOutcomes: [
          'Perform complete pre-trip inspection',
          'Identify vehicle defects and safety hazards',
          'Complete vehicle inspection reports',
          'Determine when vehicle is out of service',
          'Demonstrate proper inspection sequence',
        ],
        assessments: [
          'Pre-trip inspection demonstration (50%)',
          'Defect identification test (25%)',
          'Inspection report completion (15%)',
          'State CDL inspection test (10%)',
        ],
        requiredMaterials: [
          'Inspection checklist',
          'Vehicle inspection forms',
          'Flashlight',
          'Gloves',
        ],
      },
      {
        code: 'CDL-201',
        title: 'Road Driving Skills',
        hours: 60,
        credits: 3,
        description:
          'Behind-the-wheel training in commercial vehicle operation.',
        learningOutcomes: [
          'Operate commercial vehicle safely in various conditions',
          'Execute proper shifting and speed management',
          'Navigate turns, intersections, and highway merging',
          'Perform backing and parking maneuvers',
          'Demonstrate space management and hazard perception',
          'Pass state CDL skills test',
        ],
        assessments: [
          'Driving skills evaluation (40%)',
          'Backing and parking test (30%)',
          'Road test scenarios (20%)',
          'State CDL skills exam (10%)',
        ],
        requiredMaterials: [
          'DOT physical card',
          "CDL learner's permit",
          'Appropriate clothing and footwear',
          'Driving log',
        ],
      },
    ],
  },
];

export default function SyllabiPage() {
  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Syllabi" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-10 h-10 text-brand-blue-600" />
            <h1 className="text-4xl font-bold text-black text-2xl md:text-3xl lg:text-4xl">
              Course Syllabi
            </h1>
          </div>
          <p className="text-lg text-black">
            Detailed course information including learning outcomes,
            assessments, and requirements
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-black mb-2">
                About Learning Outcomes
              </h2>
              <p className="text-black mb-2">
                Each course includes specific, measurable learning outcomes that
                define what you will be able to do upon successful completion.
                These outcomes align with industry standards and certification
                requirements.
              </p>
              <p className="text-black">
                All syllabi are subject to updates to reflect current industry
                practices and regulatory requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Programs */}
        <div className="space-y-12">
          {syllabi.map((program: any) => (
            <div
              key={program.slug}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Program Header */}
              <div className="bg-white text-white p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {program.program}
                </h2>
                <div className="flex items-center gap-6 text-brand-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{program.totalHours} Total Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{program.courses.length} Courses</span>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="p-8 space-y-8">
                {program.courses.map((course: any) => (
                  <div
                    key={course.code}
                    className="border border-slate-200 rounded-lg p-6"
                  >
                    {/* Course Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-bold">
                            {course.code}
                          </span>
                          <h3 className="text-lg md:text-lg font-bold text-black">
                            {course.title}
                          </h3>
                        </div>
                        <p className="text-black mb-3">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-black">
                          <span>{course.hours} hours</span>
                          <span>•</span>
                          <span>{course.credits} credits</span>
                        </div>
                      </div>
                      <a
                        href={`/downloads/syllabi/${program.slug}-${course.code}.pdf`}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-sm font-medium whitespace-nowrap"
                        download
                        aria-label={`Download ${course.code} syllabus`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>

                    {/* Learning Outcomes */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-brand-green-600" />
                        <h4 className="font-bold text-black">
                          Learning Outcomes
                        </h4>
                      </div>
                      <p className="text-sm text-black mb-3">
                        Upon successful completion of this course, students will
                        be able to:
                      </p>
                      <ul className="space-y-2">
                        {course.learningOutcomes.map((outcome, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            <span className="text-black">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Assessments */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-brand-blue-600" />
                        <h4 className="font-bold text-black">
                          Assessments & Grading
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {course.assessments.map((assessment, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-black"
                          >
                            <span className="text-brand-blue-600 font-bold">•</span>
                            <span>{assessment}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-black mt-3">
                        Minimum passing grade: 70% (C)
                      </p>
                    </div>

                    {/* Required Materials */}
                    <div>
                      <h4 className="font-bold text-black mb-3">
                        Required Materials
                      </h4>
                      <ul className="space-y-2">
                        {course.requiredMaterials.map((material, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-black"
                          >
                            <span className="text-brand-blue-600 font-bold">
                              •
                            </span>
                            <span>{material}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Program Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-200">
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/programs/${program.slug}`}
                    className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium"
                  >
                    View Full Program
                  </Link>
                  <Link
                    href={`/workbooks#${program.slug}`}
                    className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition font-medium"
                  >
                    Download Workbooks
                  </Link>
                  <Link
                    href="/apply"
                    className="px-6 py-3 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition font-medium"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-black mb-4">
            Accreditation & Standards
          </h2>
          <p className="text-black mb-4">
            All course syllabi are developed in accordance with industry
            standards and accreditation requirements. Learning outcomes are
            aligned with:
          </p>
          <ul className="space-y-2 text-black">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Council on Occupational Education (COE) standards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Industry certification requirements</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>State licensing board requirements</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Employer and workforce development needs</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-8">
          <h2 className="text-xl font-bold text-black mb-4">
            Questions About Course Content?
          </h2>
          <p className="text-black mb-4">
            Contact our academic advising team for detailed information about
            course requirements and learning outcomes.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:info@elevateforhumanity.org"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              info@elevateforhumanity.org
            </a>
            <span className="text-slate-400">|</span>
            <a
              href="/support"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              support center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
