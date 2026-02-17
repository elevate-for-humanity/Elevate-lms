"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export type AutoPolishedPageProps = {
  route: string;   // e.g. "/student/dashboard"
  label: string;   // e.g. "Student Dashboard"
  section: string; // e.g. "For Students"
};

type AutoConfig = {
  badge?: string;
  categoryLabel: string;
  audience: string;
  shortTagline: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  bullets: string[];
};

function normalizeSection(section: string): string {
  const s = section.toLowerCase();
  if (s.includes("program")) return "programs";
  if (s.includes("funding")) return "funding";
  if (s.includes("student")) return "students";
  if (s.includes("lms")) return "lms";
  if (s.includes("credential")) return "credentials";
  if (s.includes("employer")) return "employers";
  if (s.includes("program holder")) return "program-holders";
  if (s.includes("career")) return "career-services";
  if (s.includes("admin") || s.includes("staff")) return "admin-staff";
  if (s.includes("community")) return "community";
  if (s.includes("legal") || s.includes("policy")) return "legal";
  if (s.includes("hr") || s.includes("payroll")) return "hr-payroll";
  if (s.includes("case management")) return "case-management";
  if (s.includes("board")) return "boards";
  if (s.includes("special program")) return "special-programs";
  if (s.includes("tool")) return "tools";
  if (s.includes("builder")) return "builders";
  if (s.includes("document")) return "documents";
  if (s.includes("instructor")) return "instructor";
  if (s.includes("report") || s.includes("analytics")) return "reports";
  if (s.includes("main")) return "main-pages";
  return "other";
}

function getAutoConfig(section: string, label: string, route: string): AutoConfig {
  const cat = normalizeSection(section);
  const baseLabel = label || route.replace(/\//g, " ").trim() || "Page";

  // Default config (used as fallback)
  let cfg: AutoConfig = {
    categoryLabel: "Platform",
    audience: "Students, employers, and partners",
    shortTagline: "Part of the Elevate For Humanity workforce ecosystem.",
    description:
      "This page is part of the Elevate For Humanity platform, designed to connect real people to real opportunities with full support from our staff, partners, and technology.",
    primaryCta: { href: "/apply", label: "Apply Now" },
    secondaryCta: { href: "/contact", label: "Talk to our team" },
    bullets: [
      "Integrated with our workforce development and case management ecosystem",
      "Built to support WIOA, WRG, JRI, and apprenticeship-aligned pathways",
      "Connected to dashboards, reports, and tools that help you stay on track",
    ],
  };

  switch (cat) {
    case "programs":
      cfg = {
        categoryLabel: "Program Page",
        audience: "Students & job seekers",
        shortTagline: "Career training that leads to real jobs, not just certificates.",
        description:
          `The "${baseLabel}" page is part of our training pathway menu. Programs are designed with workforce boards and employers so students can move from the classroom into real work with support along the way.`,
        primaryCta: { href: "/apply", label: "Apply for this program" },
        secondaryCta: { href: "/funding", label: "See how funding works" },
        bullets: [
          "Aligned with in-demand careers in Central Indiana and beyond",
          "Designed to work with WIOA, Workforce Ready Grant, and employer funding",
          "Includes built-in support from career coaches and case managers",
        ],
      };
      break;

    case "funding":
      cfg = {
        categoryLabel: "Funding & Scholarships",
        audience: "Prospective students & case managers",
        shortTagline: "No out-of-pocket tuition for most eligible students.",
        description:
          `The "${baseLabel}" page explains one of the funding paths that can cover tuition and training costs at Elevate For Humanity. Our team partners with workforce boards and employers to make sure money is not the barrier.`,
        primaryCta: { href: "/funding", label: "View all funding options" },
        secondaryCta: { href: "/apply", label: "Start funding screening" },
        bullets: [
          "Connects WIOA, WRG, JRI, and other programs to real training seats",
          "Helps you understand what is covered, what isn't, and how to qualify",
          "Keeps workforce boards and training providers on the same page",
        ],
      };
      break;

    case "students":
      cfg = {
        categoryLabel: "Student Experience",
        audience: "Current & future students",
        shortTagline: "A single place to see where you are, what's next, and who's in your corner.",
        description:
          `The "${baseLabel}" page supports the student side of the Elevate For Humanity platform. It's built to keep you from feeling lost by putting courses, messages, documents, and support all in one place.`,
        primaryCta: { href: "/student/portal", label: "Go to Student Portal" },
        secondaryCta: { href: "/career-services", label: "Visit Career Services" },
        bullets: [
          "Quick access to courses, grades, and certificate progress",
          "Built-in messaging with coaches, case managers, and instructors",
          "Clear next steps so you always know what to do after today",
        ],
      };
      break;

    case "lms":
      cfg = {
        categoryLabel: "Learning Management System",
        audience: "Students, instructors, and admins",
        shortTagline: "Course delivery that matches the way workforce learners actually live and work.",
        description:
          `The "${baseLabel}" page is part of our LMS experience. It connects video, assignments, quizzes, and progress tracking with the case management and funding pieces behind the scenes.`,
        primaryCta: { href: "/courses/catalog", label: "Browse course catalog" },
        secondaryCta: { href: "/lms/dashboard", label: "Go to LMS Dashboard" },
        bullets: [
          "Modern course player with video, downloads, and transcripts",
          "Progress tracking you can share with employers and workforce boards",
          "Integrated with reports so leadership can see what's working",
        ],
      };
      break;

    case "credentials":
      cfg = {
        categoryLabel: "Credentials & Verification",
        audience: "Employers, boards, and graduates",
        shortTagline: "Proof of learning that means something in the real world.",
        description:
          `The "${baseLabel}" page focuses on credentials, verification, or certification tracking so employers and workforce partners can trust the outcomes from Elevate For Humanity programs.`,
        primaryCta: { href: "/credentials/verify", label: "Verify a credential" },
        secondaryCta: { href: "/credentials", label: "View all credentials" },
        bullets: [
          "Credential pages connect training outcomes to real job requirements",
          "Verification tools help employers confirm skills quickly and securely",
          "Supports stacking credentials over time as students level up",
        ],
      };
      break;

    case "employers":
      cfg = {
        categoryLabel: "Employer & Talent Partners",
        audience: "Employers, HR leaders, talent partners",
        shortTagline: "A faster way to hire job-ready talent with wraparound support.",
        description:
          `The "${baseLabel}" page supports employers using Elevate For Humanity to find, train, and retain talent. It brings job postings, candidate pipelines, and support services into one consistent experience.`,
        primaryCta: { href: "/employers/hire-graduates", label: "Hire graduates" },
        secondaryCta: { href: "/employers", label: "Employer overview" },
        bullets: [
          "Reduce time- with pre-screened, supported candidates",
          "Align job descriptions with training and credential pathways",
          "Use data and reports to see the impact of your partnership",
        ],
      };
      break;

    case "program-holders":
      cfg = {
        categoryLabel: "Program Holders & Training Providers",
        audience: "Schools, training providers, and host sites",
        shortTagline: "Bring your program into a larger ecosystem without losing your identity.",
        description:
          `The "${baseLabel}" page is for program holders who host training, apprenticeships, or specialized pathways on the Elevate For Humanity platform.`,
        primaryCta: { href: "/program-holders/apply", label: "Become a Program Holder" },
        secondaryCta: { href: "/program-holders/universal-mou", label: "View Universal MOU" },
        bullets: [
          "Digital MOUs, onboarding, and reporting in one place",
          "Shared LMS, compliance, and data tools across all programs",
          "Support to align with workforce boards and apprenticeship standards",
        ],
      };
      break;

    case "career-services":
      cfg = {
        categoryLabel: "Career Services",
        audience: "Students & alumni",
        shortTagline: "We don't just train you and disappear. We help you land and grow.",
        description:
          `The "${baseLabel}" page is part of the Career Center at Elevate For Humanity. It helps learners turn training into employment and advancement with real human support.`,
        primaryCta: { href: "/career-center/jobs", label: "Browse job board" },
        secondaryCta: { href: "/career-services", label: "Career services overview" },
        bullets: [
          "Resume, interview prep, and job search tools in one place",
          "Direct links to employers who understand your training",
          "Ongoing support as you change jobs or level up over time",
        ],
      };
      break;

    case "admin-staff":
      cfg = {
        categoryLabel: "Admin & Staff Tools",
        audience: "Internal staff & leadership",
        shortTagline: "The back-office engine that keeps everything moving.",
        description:
          `The "${baseLabel}" page supports the admin and staff side of the Elevate For Humanity ecosystem—intake, enrollment, approvals, certificates, and more.`,
        primaryCta: { href: "/admin/dashboard", label: "Open admin dashboard" },
        secondaryCta: { href: "/reports", label: "View key reports" },
        bullets: [
          "Consolidates tasks so staff aren't chasing 10 different systems",
          "Captures the data needed for audits, renewals, and board reports",
          "Keeps everything aligned with WIOA, WRG, and partner requirements",
        ],
      };
      break;

    case "community":
      cfg = {
        categoryLabel: "Community & Partnerships",
        audience: "Students, alumni, partners, and supporters",
        shortTagline: "A community of people who don't want anyone left behind.",
        description:
          `The "${baseLabel}" page is part of how we stay connected with alumni, partners, and supporters—sharing resources, events, and opportunities to plug in.`,
        primaryCta: { href: "/community", label: "Visit Community Hub" },
        secondaryCta: { href: "/partners", label: "Explore partnership options" },
        bullets: [
          "Events, webinars, and stories that keep momentum going",
          "Space for alumni and partners to reconnect and collaborate",
          "On-ramps for donors and sponsors who want to invest in people",
        ],
      };
      break;

    case "legal":
      cfg = {
        categoryLabel: "Legal & Policies",
        audience: "Students, staff, partners, and boards",
        shortTagline: "Clear, transparent policies that respect people and protect the mission.",
        description:
          `The "${baseLabel}" page documents legal terms, privacy, refunds, or accessibility commitments for Elevate For Humanity.`,
        primaryCta: { href: "/legal/privacy", label: "Read privacy policy" },
        secondaryCta: { href: "/legal/accessibility", label: "View accessibility statement" },
        bullets: [
          "Written with real people in mind, not just lawyers",
          "Keeps partners and boards confident in compliance",
          "Helps students understand their rights and responsibilities",
        ],
      };
      break;

    case "hr-payroll":
      cfg = {
        categoryLabel: "HR & Payroll",
        audience: "Internal staff & leadership",
        shortTagline: "People-first HR and payroll tools for a growing ecosystem.",
        description:
          `The "${baseLabel}" page helps manage HR, payroll, time tracking, and employee records across the Elevate For Humanity system.`,
        primaryCta: { href: "/hr/dashboard", label: "Open HR dashboard" },
        secondaryCta: { href: "/hr/employees", label: "View employee records" },
        bullets: [
          "Brings HR tasks and payroll details together in one place",
          "Supports transparency and accuracy for staff and contractors",
          "Connects workforce grants, roles, and timekeeping where needed",
        ],
      };
      break;

    case "case-management":
      cfg = {
        categoryLabel: "Case Management",
        audience: "Case managers, delegates, and support staff",
        shortTagline: "No more sticky notes and scattered spreadsheets.",
        description:
          `The "${baseLabel}" page is part of Elevate For Humanity's case management tools—tracking students, notes, barriers, and wins in one system.`,
        primaryCta: { href: "/case-management", label: "Open case management" },
        secondaryCta: { href: "/delegate/dashboard", label: "Go to delegate dashboard" },
        bullets: [
          "Track caseloads, touchpoints, and outcomes without losing people",
          "Share information securely with the right staff and partners",
          "Aligns with reporting needs for workforce boards and funders",
        ],
      };
      break;

    case "boards":
      cfg = {
        categoryLabel: "Workforce Boards & Oversight",
        audience: "Workforce boards, governance, and oversight partners",
        shortTagline: "Give boards a clean, honest view of what's working.",
        description:
          `The "${baseLabel}" page helps workforce boards and oversight bodies see the programs, outcomes, and tools behind Elevate For Humanity.`,
        primaryCta: { href: "/boards/dashboard", label: "Board dashboard" },
        secondaryCta: { href: "/reports/workforce", label: "Workforce analytics" },
        bullets: [
          "Transparent reporting around enrollments, completions, and placements",
          "Clear links between funding streams and real outcomes",
          "Dashboards designed with oversight, not just marketing, in mind",
        ],
      };
      break;

    case "special-programs":
      cfg = {
        categoryLabel: "Special Programs",
        audience: "Students, community, and partners",
        shortTagline: "Mission-driven projects that meet very specific needs.",
        description:
          `The "${baseLabel}" page highlights a special initiative within Elevate For Humanity—often focused on targeted communities, industries, or impact areas.`,
        primaryCta: { href: "/programs", label: "View all programs" },
        secondaryCta: { href: "/community", label: "See community initiatives" },
        bullets: [
          "Pilots and special projects that expand what's possible",
          "Deep partnerships with community organizations and employers",
          "Room to test new ideas before scaling across the ecosystem",
        ],
      };
      break;

    case "tools":
      cfg = {
        categoryLabel: "Platform Tools",
        audience: "Students, staff, and partners",
        shortTagline: "Tools that make the work lighter and more organized.",
        description:
          `The "${baseLabel}" page is part of our internal and external tools—files, video, chat, calendar, directory, and more.`,
        primaryCta: { href: "/tools", label: "View all tools" },
        secondaryCta: { href: "/support", label: "Need help with a tool?" },
        bullets: [
          "Keeps communication and content in one connected platform",
          "Reduces the need for five different logins for simple things",
          "Supports documentation needed for grants and audits",
        ],
      };
      break;

    case "builders":
      cfg = {
        categoryLabel: "Content & Program Builders",
        audience: "Instructors, admins, and program designers",
        shortTagline: "Build once, reuse everywhere across the ecosystem.",
        description:
          `The "${baseLabel}" page is part of the builder toolkit—courses, quizzes, syllabi, and program blueprints for Elevate For Humanity and partner providers.`,
        primaryCta: { href: "/builders/course-builder", label: "Open course builder" },
        secondaryCta: { href: "/builders/ai-course-builder", label: "Try AI course builder" },
        bullets: [
          "Create courses and micro-classes that plug directly into the LMS",
          "Standardize documents and outcomes across multiple programs",
          "Use AI and templates to move faster without losing quality",
        ],
      };
      break;

    case "documents":
      cfg = {
        categoryLabel: "Document Center",
        audience: "Staff, partners, and students",
        shortTagline: "One home for the paperwork that used to live everywhere.",
        description:
          `The "${baseLabel}" page sits inside the Elevate For Humanity document center for MOUs, policies, templates, and learner documents.`,
        primaryCta: { href: "/documents", label: "Open document center" },
        secondaryCta: { href: "/documents/upload", label: "Upload a document" },
        bullets: [
          "Organizes MOUs, agreements, and compliance documents",
          "Keeps student-facing forms and handouts easy to find",
          "Connects to HR, case management, and program records where needed",
        ],
      };
      break;

    case "instructor":
      cfg = {
        categoryLabel: "Instructor & Educator Tools",
        audience: "Instructors, facilitators, and coaches",
        shortTagline: "Give educators the tools they deserve, not just a login.",
        description:
          `The "${baseLabel}" page supports instructors and facilitators managing classes, communication, and grading on the platform.`,
        primaryCta: { href: "/instructor/dashboard", label: "Open instructor dashboard" },
        secondaryCta: { href: "/instructor/analytics", label: "View teaching analytics" },
        bullets: [
          "Keep track of sections, assignments, and attendance in one place",
          "See which students may need additional support early",
          "Coordinate with admin and case management without extra systems",
        ],
      };
      break;

    case "reports":
      cfg = {
        categoryLabel: "Reports & Analytics",
        audience: "Leadership, boards, and data teams",
        shortTagline: "Turn activity into insight without a week of spreadsheet work.",
        description:
          `The "${baseLabel}" page is part of our reporting and analytics layer—turning program data into dashboards and stories that funders understand.`,
        primaryCta: { href: "/reports", label: "Open reports" },
        secondaryCta: { href: "/reports/analytics-dashboard", label: "Analytics dashboard" },
        bullets: [
          "Connects enrollments, completions, and placements in one view",
          "Supports grant reporting and board updates with real numbers",
          "Helps refine which programs to grow, adjust, or sunset over time",
        ],
      };
      break;

    case "main-pages":
      cfg = {
        categoryLabel: "Main Site Page",
        audience: "General visitors, students, partners",
        shortTagline: "The front door into the Elevate For Humanity ecosystem.",
        description:
          `The "${baseLabel}" page helps visitors understand what Elevate For Humanity is, who we serve, and how to get started.`,
        primaryCta: { href: "/get-started", label: "Get started" },
        secondaryCta: { href: "/apply", label: "Apply now" },
        bullets: [
          "Explains our mission in plain language",
          "Shows core pathways and who funds them",
          "Directs people quickly to apply, refer, or partner",
        ],
      };
      break;
  }

  return cfg;
}

export function AutoPolishedPage({ route, label, section }: AutoPolishedPageProps) {
  const config = getAutoConfig(section, label, route);

  // Get hero image based on section
  const getHeroImage = () => {
    const cat = normalizeSection(section);
    switch (cat) {
      case "programs": return "/images/artlist/hero-training-4.jpg";
      case "funding": return "/images/artlist/hero-training-2.jpg";
      case "students": return "/images/facilities-new/facility-2.jpg";
      case "lms": return "/images/gallery/image5.jpg";
      case "employers": return "/images/artlist/hero-training-5.jpg";
      case "community": return "/images/gallery/image7.jpg";
      case "admin-staff": return "/images/artlist/hero-training-1.jpg";
      default: return "/images/gallery/image1.jpg";
    }
  };

  return (
    <main className="bg-white">
      {/* TOP BANNER */}
      <section className="   py-3 sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-2 text-xs font-bold text-white animate-pulse">
                🔥 NOW ENROLLING
              </span>
              <p className="text-white font-semibold text-sm sm:text-base">
                Free Career Training - 100% Government Funded • Start in 2 Weeks
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-bold text-brand-orange-600 hover:bg-brand-orange-50 transition-all shadow-lg hover:scale-105 whitespace-nowrap"
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="relative h-[700px] overflow-hidden">
        <Image
          src={getHeroImage()}
          alt={label}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={100}
        />
        

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              {config.badge && (
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-orange-500 px-4 py-2 text-sm font-bold text-white mb-6">
                  {config.badge}
                </div>
              )}
              <h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
                {label}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 font-light mb-8 leading-relaxed">
                {config.shortTagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {config.primaryCta && (
                  <Link
                    href={config.primaryCta.href}
                    className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 text-white font-semibold rounded hover:bg-brand-orange-600 transition-colors shadow-lg"
                  >
                    {config.primaryCta.label}
                    <ArrowRight size={20} className="ml-2" />
                  </Link>
                )}
                {config.secondaryCta && (
                  <Link
                    href={config.secondaryCta.href}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded border-2 border-white hover:bg-slate-50 transition-colors shadow-lg"
                  >
                    {config.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOVERNMENT PARTNERS BAR */}
      <section className="bg-slate-50 border-y border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Approved Workforce Development Partner
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="text-center">
              <p className="font-semibold text-black">EmployIndy</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">WorkOne</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">Indiana DWD</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">US Dept of Labor</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-semibold text-brand-orange-600 uppercase tracking-wide mb-3">
                {config.categoryLabel}
              </p>
              <h2 className="text-4xl font-light text-black mb-6 leading-tight text-2xl md:text-3xl lg:text-4xl">
                Built for: {config.audience}
              </h2>
              <p className="text-lg text-black leading-relaxed mb-6">
                {config.description}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <h3 className="text-xl font-semibold text-black mb-4">
                How this page fits the ecosystem
              </h3>
              <ul className="space-y-3 text-black">
                {config.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="text-brand-orange-500 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
