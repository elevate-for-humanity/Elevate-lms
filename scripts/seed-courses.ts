// scripts/seed-courses.ts
//
// One-time script to seed modules + lessons for all programs
// Run in Gitpod or locally with:  npx ts-node scripts/seed-courses.ts
//
// REQUIREMENTS:
// - env var NEXT_PUBLIC_SUPABASE_URL
// - env var SUPABASE_SERVICE_ROLE_KEY  (NOT the anon key)
// - tables: programs(id, slug, title), modules(id, program_id, title, description, order_index),
//           lessons(id, program_id, module_id, title, description, order_index)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------- COURSE TEMPLATES ----------

type LessonTemplate = {
  title: string;
  description: string;
};

type ModuleTemplate = {
  title: string;
  description: string;
  lessons: LessonTemplate[];
};

type CourseTemplate = {
  code: string;
  modules: ModuleTemplate[];
};

// Healthcare (CNA, MA, Phlebotomy, DSP, CCHW, etc.)
const healthcareTemplate: CourseTemplate = {
  code: "healthcare",
  modules: [
    {
      title: "Program Orientation & Professionalism",
      description:
        "Welcome to healthcare training, expectations, professionalism, and how to navigate your courses.",
      lessons: [
        {
          title: "Welcome & How This Program Works",
          description:
            "Overview of the program, dashboards, progress tracking, and support available.",
        },
        {
          title: "Role of the Healthcare Support Professional",
          description:
            "Understanding your role on the care team, scope of practice, and collaboration with nurses and providers.",
        },
        {
          title: "Ethics, Confidentiality & Patient Rights",
          description:
            "HIPAA basics, respect, dignity, and protecting patient information.",
        },
      ],
    },
    {
      title: "Safety, Infection Control & Emergencies",
      description:
        "Core safety practices to protect you and your patients in any healthcare setting.",
      lessons: [
        {
          title: "Infection Control & Standard Precautions",
          description:
            "Hand hygiene, PPE, and breaking the chain of infection in everyday tasks.",
        },
        {
          title: "Workplace Safety & Fall Prevention",
          description:
            "Identifying hazards, preventing falls, and keeping patient environments safe.",
        },
        {
          title: "Recognizing & Responding to Emergencies",
          description:
            "What to do when you see changes in condition, choking, or other emergencies.",
        },
      ],
    },
    {
      title: "Basic Clinical & Daily Care Skills",
      description:
        "Core skills used every day in direct patient care and support.",
      lessons: [
        {
          title: "Vital Signs & Observation Basics",
          description:
            "Temperature, pulse, respirations, blood pressure, and what to report.",
        },
        {
          title: "Hygiene, Bathing & Personal Care",
          description:
            "Assisting with bathing, grooming, and maintaining dignity and comfort.",
        },
        {
          title: "Mobility, Transfers & Body Mechanics",
          description:
            "Safe transfers, positioning, and protecting your own body while you work.",
        },
      ],
    },
    {
      title: "Special Populations & Communication",
      description:
        "Working with different age groups, conditions, and communication needs.",
      lessons: [
        {
          title: "Working With Dementia & Memory Loss",
          description:
            "Approaches for supporting individuals with dementia and related conditions.",
        },
        {
          title: "Mental Health Awareness in Healthcare",
          description:
            "Recognizing stress, depression, anxiety, and how to support patients respectfully.",
        },
        {
          title: "Cultural Competence & Respect",
          description:
            "Serving diverse communities with sensitivity, respect, and awareness.",
        },
      ],
    },
    {
      title: "Career Readiness & Next Steps",
      description:
        "Preparing for exams, employment, and long-term growth in healthcare.",
      lessons: [
        {
          title: "Certification & Exam Preparation",
          description:
            "Reviewing key skills and knowledge for certification exams and clinical skills check-offs.",
        },
        {
          title: "Job Search, Resume & Interview Basics",
          description:
            "How to present your experience, training, and strengths to employers.",
        },
        {
          title: "Career Ladders in Healthcare",
          description:
            "Exploring next steps such as QMA, LPN, RN, or specialized roles.",
        },
      ],
    },
  ],
};

// Trades (HVAC, Building Maintenance, Building Tech)
const tradesTemplate: CourseTemplate = {
  code: "trades",
  modules: [
    {
      title: "Orientation & Safety First",
      description:
        "Introduction to skilled trades with a strong focus on safety, tools, and expectations.",
      lessons: [
        {
          title: "Welcome to Skilled Trades Training",
          description:
            "Program overview, expectations, and how to navigate your learning path.",
        },
        {
          title: "Worksite Safety & OSHA Basics",
          description:
            "Core safety practices, PPE, and OSHA-aligned safety culture.",
        },
        {
          title: "Tools, Equipment & Basic Terminology",
          description:
            "Common tools, equipment, and trade language used on the job.",
        },
      ],
    },
    {
      title: "Core Technical Basics",
      description:
        "Foundational trade skills that apply across HVAC, building maintenance, and related fields.",
      lessons: [
        {
          title: "Measurements, Math & Blueprints",
          description:
            "Using measurements, basic trade math, and reading simple diagrams or plans.",
        },
        {
          title: "Materials & Systems Overview",
          description:
            "Common materials, systems, and components you will encounter in the field.",
        },
        {
          title: "Basic Troubleshooting Mindset",
          description:
            "How to think through problems and communicate clearly about what you see.",
        },
      ],
    },
    {
      title: "Customer Service & Professionalism On-Site",
      description:
        "How to interact with customers, supervisors, and team members professionally.",
      lessons: [
        {
          title: "Communicating With Customers",
          description:
            "Explaining work, answering questions, and representing your company well.",
        },
        {
          title: "Teamwork & Jobsite Expectations",
          description:
            "Following instructions, documenting work, and staying reliable.",
        },
        {
          title: "Documentation, Photos & Work Orders",
          description:
            "Basics of documenting jobs, using checklists, and closing out work orders.",
        },
      ],
    },
    {
      title: "Career Growth in the Trades",
      description:
        "Planning next steps for certifications, licensing, and higher-paying roles.",
      lessons: [
        {
          title: "Intro to Certifications & Licensing",
          description:
            "Overview of common credentials and why they matter for your earnings.",
        },
        {
          title: "Resume, Portfolio & References",
          description:
            "Pulling together your experiences into a simple, strong job portfolio.",
        },
        {
          title: "Long-Term Trade Careers",
          description:
            "Pathways from entry-level to advanced roles, supervision, or business ownership.",
        },
      ],
    },
  ],
};

// CDL
const cdlTemplate: CourseTemplate = {
  code: "cdl",
  modules: [
    {
      title: "CDL Program Orientation",
      description:
        "Introduction to CDL training, safety culture, and expectations on and off the road.",
      lessons: [
        {
          title: "Welcome to CDL Training",
          description:
            "How the program works, timelines, and what you need to succeed.",
        },
        {
          title: "Professional Driver Standards",
          description:
            "Appearance, communication, reliability, and professional conduct.",
        },
      ],
    },
    {
      title: "Safety, Regulations & Compliance",
      description:
        "Core safety principles, FMCSA rules, and compliance basics for commercial drivers.",
      lessons: [
        {
          title: "FMCSA Rules & Hours of Service",
          description:
            "Key regulations every CDL driver must know and follow.",
        },
        {
          title: "Vehicle Inspections & Safety Checks",
          description:
            "Pre-trip, en-route, and post-trip inspections to keep equipment safe.",
        },
        {
          title: "Defensive Driving & Risk Awareness",
          description:
            "Strategies to prevent accidents and handle changing conditions.",
        },
      ],
    },
    {
      title: "Vehicle Control & Road Skills (Theory)",
      description:
        "Core theory around maneuvering, backing, turning, and handling equipment.",
      lessons: [
        {
          title: "Basic Vehicle Control Concepts",
          description:
            "Understanding turning radius, blind spots, and vehicle handling.",
        },
        {
          title: "Backing, Coupling & Uncoupling Concepts",
          description:
            "Theory around backing procedures and connecting trailers safely.",
        },
      ],
    },
    {
      title: "Career Launch & Employer Expectations",
      description:
        "Preparing for exams, hiring, and life on the road as a new driver.",
      lessons: [
        {
          title: "CDL Exam Prep & Test Day Tips",
          description:
            "What to expect in written and skills exams and how to prepare.",
        },
        {
          title: "Working With Carriers & Dispatch",
          description:
            "Understanding dispatch, routes, communication, and expectations.",
        },
        {
          title: "Lifestyle, Health & Long-Term Success",
          description:
            "Managing health, rest, and work-life balance as a professional driver.",
        },
      ],
    },
  ],
};

// Barber / Beauty / Esthetician
const barberTemplate: CourseTemplate = {
  code: "barber_beauty",
  modules: [
    {
      title: "Orientation & Professional Image",
      description:
        "Welcome to the barber/beauty industry and your role as a licensed professional.",
      lessons: [
        {
          title: "Welcome to the Barber & Beauty Pathway",
          description:
            "Overview of program structure, expectations, and career opportunities.",
        },
        {
          title: "Professional Appearance & Client Experience",
          description:
            "How your image, station setup, and greeting shape the client experience.",
        },
      ],
    },
    {
      title: "Sanitation, Safety & State Board Readiness",
      description:
        "Sanitation, disinfection, and procedures that protect clients and your license.",
      lessons: [
        {
          title: "Sanitation & Disinfection Basics",
          description:
            "State board-level sanitation procedures and why they matter.",
        },
        {
          title: "Tool Safety & Blood Spill Procedures",
          description:
            "Safe tool handling and required response when incidents occur.",
        },
      ],
    },
    {
      title: "Client Consultation & Core Services (Theory)",
      description:
        "Building strong client relationships and understanding service fundamentals.",
      lessons: [
        {
          title: "Consultations & Client Communication",
          description:
            "Asking the right questions, managing expectations, and building trust.",
        },
        {
          title: "Service Planning & Time Management",
          description:
            "Structuring appointments and staying on schedule.",
        },
      ],
    },
    {
      title: "Business, Branding & Career Growth",
      description:
        "Building a long-term career through clients, brand, and professionalism.",
      lessons: [
        {
          title: "Building & Keeping a Clientele",
          description:
            "Customer service, follow-up, and simple retention strategies.",
        },
        {
          title: "Social Media & Professional Branding",
          description:
            "Simple ways to show your work and attract clients responsibly.",
        },
        {
          title: "Long-Term Career Paths in Barber & Beauty",
          description:
            "From new stylist/barber to educator, owner, or platform artist.",
        },
      ],
    },
  ],
};

// Business / Admin / Customer Service / Soft Skills
const businessTemplate: CourseTemplate = {
  code: "business_admin",
  modules: [
    {
      title: "Workplace Readiness & Mindset",
      description:
        "Core expectations for office, customer service, and administrative roles.",
      lessons: [
        {
          title: "Showing Up Ready for Work",
          description:
            "Attendance, reliability, and what employers look for day-to-day.",
        },
        {
          title: "Growth Mindset & Professional Attitude",
          description:
            "How attitude and willingness to learn impact your career.",
        },
      ],
    },
    {
      title: "Communication & Customer Service",
      description:
        "Everyday communication skills that translate into better service and teamwork.",
      lessons: [
        {
          title: "Professional Communication Basics",
          description:
            "Phone, email, chat, and in-person communication do's and don'ts.",
        },
        {
          title: "Customer Service Essentials",
          description:
            "Handling questions, complaints, and building positive experiences.",
        },
        {
          title: "Working With Diverse Customers & Teams",
          description:
            "Respectful communication across cultures, ages, and backgrounds.",
        },
      ],
    },
    {
      title: "Organization, Time Management & Tools",
      description:
        "Staying organized, managing tasks, and using basic digital tools.",
      lessons: [
        {
          title: "Planning Your Day & Priorities",
          description:
            "Using simple systems to manage tasks and deadlines.",
        },
        {
          title: "Intro to Office & Digital Tools",
          description:
            "Overview of email, calendars, documents, spreadsheets, and ticketing tools.",
        },
      ],
    },
    {
      title: "Career Advancement & Next Steps",
      description:
        "Preparing for interviews, growth, and long-term career movement.",
      lessons: [
        {
          title: "Resume, Applications & Online Profiles",
          description:
            "Presenting your skills and training clearly to employers.",
        },
        {
          title: "Interview Basics & Workplace Fit",
          description:
            "Answering common questions and understanding company culture.",
        },
        {
          title: "Planning Your Career Path",
          description:
            "Identifying next-level roles and skills to work toward.",
        },
      ],
    },
  ],
};

// Emergency / Safety / CPR / OSHA
const emergencyTemplate: CourseTemplate = {
  code: "emergency_safety",
  modules: [
    {
      title: "Program Overview & Safety Culture",
      description:
        "Introduction to emergency response, safety certifications, and professional expectations.",
      lessons: [
        {
          title: "Welcome to Emergency Health & Safety Training",
          description:
            "Program structure, certification goals, and career pathways.",
        },
        {
          title: "The Role of Emergency Responders",
          description:
            "Understanding your role in schools, workplaces, and community settings.",
        },
      ],
    },
    {
      title: "CPR & Basic Life Support",
      description:
        "Hands-on CPR training and life-saving response techniques.",
      lessons: [
        {
          title: "Adult, Child & Infant CPR",
          description:
            "Proper techniques for different age groups and scenarios.",
        },
        {
          title: "AED Use & Choking Response",
          description:
            "Using automated external defibrillators and responding to airway obstructions.",
        },
      ],
    },
    {
      title: "OSHA 10 & Workplace Safety",
      description:
        "Core OSHA standards and workplace hazard recognition.",
      lessons: [
        {
          title: "OSHA Standards & Worker Rights",
          description:
            "Understanding OSHA regulations and your rights as a worker.",
        },
        {
          title: "Hazard Recognition & Prevention",
          description:
            "Identifying common workplace hazards and prevention strategies.",
        },
      ],
    },
    {
      title: "Emergency Medical Response Basics",
      description:
        "Foundational emergency medical response skills and protocols.",
      lessons: [
        {
          title: "Patient Assessment & Vital Signs",
          description:
            "How to assess a patient and monitor vital signs in emergency situations.",
        },
        {
          title: "Bleeding Control & Shock Management",
          description:
            "Techniques for controlling bleeding and recognizing shock.",
        },
        {
          title: "Emergency Scene Management",
          description:
            "Scene safety, communication, and working with EMS professionals.",
        },
      ],
    },
  ],
};

// Peer Support / Recovery / Reentry
const peerSupportTemplate: CourseTemplate = {
  code: "peer_support",
  modules: [
    {
      title: "Introduction to Peer Support",
      description:
        "Understanding the peer support role and ethical foundations.",
      lessons: [
        {
          title: "What is Peer Support?",
          description:
            "Defining peer support and its role in recovery and community wellness.",
        },
        {
          title: "Ethics, Boundaries & Confidentiality",
          description:
            "Professional boundaries, confidentiality, and ethical decision-making.",
        },
      ],
    },
    {
      title: "Communication & Active Listening",
      description:
        "Core communication skills for effective peer support.",
      lessons: [
        {
          title: "Active Listening & Empathy",
          description:
            "Techniques for listening deeply and responding with empathy.",
        },
        {
          title: "Motivational Interviewing Basics",
          description:
            "Introduction to motivational interviewing and supporting change.",
        },
      ],
    },
    {
      title: "Recovery & Wellness Concepts",
      description:
        "Understanding recovery, wellness, and trauma-informed care.",
      lessons: [
        {
          title: "Recovery-Oriented Principles",
          description:
            "Core principles of recovery and person-centered support.",
        },
        {
          title: "Trauma-Informed Approaches",
          description:
            "Recognizing trauma and using trauma-informed practices.",
        },
        {
          title: "Self-Care & Preventing Burnout",
          description:
            "Strategies for maintaining your own wellness while supporting others.",
        },
      ],
    },
    {
      title: "Career Development & Certification",
      description:
        "Preparing for certification and building a career in peer support.",
      lessons: [
        {
          title: "Certification Exam Preparation",
          description:
            "Review of key concepts and exam strategies.",
        },
        {
          title: "Career Pathways in Peer Support",
          description:
            "Exploring roles in healthcare, community organizations, and recovery centers.",
        },
      ],
    },
  ],
};
};

const templates: Record<string, CourseTemplate> = {
  healthcare: healthcareTemplate,
  trades: tradesTemplate,
  cdl: cdlTemplate,
  barber_beauty: barberTemplate,
  business_admin: businessTemplate,
  emergency_safety: emergencyTemplate,
  peer_support: peerSupportTemplate,
};

// ---------- MAP YOUR PROGRAM SLUGS TO TEMPLATES HERE ----------
const programToTemplate: Record<string, string> = {
  // Healthcare programs
  "direct-support-professional": "healthcare",
  "certified-community-healthcare-worker": "healthcare",
  "medical-assistant": "healthcare",
  "cna": "healthcare",
  "cna-training-wrg": "healthcare",
  "certified-nursing-assistant": "healthcare",
  "healthcare-support": "healthcare",
  "phlebotomy": "healthcare",

  // Trades programs
  "hvac": "trades",
  "hvac-technician": "trades",
  "hvac-technician-wrg": "trades",
  "building-maintenance": "trades",
  "building-maintenance-wrg": "trades",
  "building-technician": "trades",

  // CDL programs
  "cdl-a-training": "cdl",
  "cdl-b-training": "cdl",
  "cdl-training-wrg": "cdl",

  // Barber/Beauty programs
  "barber": "barber_beauty",
  "barber-apprenticeship-wrg": "barber_beauty",
  "barber-apprenticeship-full": "barber_beauty",
  "professional-esthetician": "barber_beauty",
  "cosmetology-pathway": "barber_beauty",

  // Business/Admin programs
  "business-startup-marketing": "business_admin",
  "customer-service": "business_admin",
  "office-administration": "business_admin",
  "business-fundamentals": "business_admin",

  // Emergency/Safety programs
  "emergency-health-safety-tech": "emergency_safety",
  "cpr-certification": "emergency_safety",
  "osha-10-certification": "emergency_safety",

  // Peer Support/Recovery programs
  "certified-peer-recovery-coach": "peer_support",
  "certified-peer-support-professional": "peer_support",
  "public-safety-reentry-specialist": "peer_support",
  "peer-recovery-specialist-jri": "peer_support",
  "life-coach-certification-wioa": "peer_support",

};

// ---------- SEED LOGIC ----------

async function main() {

  // 1. Load all programs so we can match by slug
  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("id, title, slug");

  if (programsError) {
    process.exit(1);
  }

  if (!programs || programs.length === 0) {
    process.exit(1);
  }


  // 2. For each program that has a template mapping, create modules + lessons
  for (const program of programs) {
    const templateCode = programToTemplate[program.slug];

    if (!templateCode) {
      continue;
    }

    const template = templates[templateCode];
    if (!template) {
      console.warn(
        `⚠️ No template found for code "${templateCode}" — skipping program "${program.title}".`
      );
      continue;
    }


    // Optional: check if modules already exist (to avoid duplicates)
    const { data: existingModules, error: modulesError } = await supabase
      .from("modules")
      .select("id")
      .eq("program_id", program.id)
      .limit(1);

    if (modulesError) {
      continue;
    }

    if (existingModules && existingModules.length > 0) {
      continue;
    }

    // 2a. Insert modules for this program
    for (let mIndex = 0; mIndex < template.modules.length; mIndex++) {
      const mod = template.modules[mIndex];

      const { data: insertedModule, error: insertModuleError } = await supabase
        .from("modules")
        .insert({
          program_id: program.id,
          title: mod.title,
          description: mod.description,
          order_index: mIndex + 1,
        })
        .select("id")
        .single();

      if (insertModuleError || !insertedModule) {
        console.error(
          `❌ Error inserting module "${mod.title}" for ${program.title}:`,
          insertModuleError?.message
        );
        continue;
      }


      // 2b. Insert lessons for this module
      for (let lIndex = 0; lIndex < mod.lessons.length; lIndex++) {
        const lesson = mod.lessons[lIndex];

        const { error: insertLessonError } = await supabase.from("lessons").insert({
          program_id: program.id,
          module_id: insertedModule.id,
          title: lesson.title,
          description: lesson.description,
          order_index: lIndex + 1,
        });

        if (insertLessonError) {
          console.error(
            `      ❌ Error inserting lesson "${lesson.title}" for ${program.title}:`,
            insertLessonError.message
          );
        }
      }
    }
  }

}

main().catch((err) => {
  process.exit(1);
});
