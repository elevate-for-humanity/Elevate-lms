'use client';

import VisualDashboardOrientation from '@/components/orientation/VisualDashboardOrientation';


import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    title: 'Welcome to your student dashboard',
    image: '/images/pages/training-classroom.webp',
    alt: 'Learning and training classroom',
    text: 'This is your starting point for training. Review your assigned program, open your courses, and keep your completion records together.',
    action: 'View my courses',
    href: '/lms/courses',
  },
  {
    title: 'Your course and provider access',
    image: '/images/pages/office-admin-desk.jpg',
    alt: 'Computer workspace for online study',
    text: 'Open your assigned course from this dashboard. Partner courses may use a separate login. Follow the access instructions assigned to your account. Ask staff about an incorrect course or unexpected payment request.',
    action: 'Get course access help',
    href: '/lms/support',
  },
  {
    title: 'Your weekly expectations',
    image: '/images/pages/bookkeeping-ledger.webp',
    alt: 'Bookkeeping records and study materials',
    text: 'Follow the dates in your training plan. Complete your own lessons, practice activities, and assessments. Attend required meetings and contact your program staff before a missed deadline.',
    action: 'Review my schedule',
    href: '/lms/calendar',
  },
  {
    title: 'Assignments and progress',
    image: '/images/pages/finance-accounting.webp',
    alt: 'Financial accounting study workspace',
    text: 'Submit the required work and check its status. Keep a copy of your submissions. Report missing lessons or incorrect progress instead of repeating completed work without guidance.',
    action: 'Open assignments',
    href: '/lms/assignments',
  },
  {
    title: 'Certificates and completion',
    image: '/images/pages/comp-home-highlight-success.webp',
    alt: 'Training success and career development',
    text: 'Upload certificates and licenses you earn outside Elevate for staff verification. Course completion and certification testing can have separate requirements. Confirm your individual completion checklist with staff.',
    action: 'Upload a credential',
    href: '/lms/certification/upload',
  },
  {
    title: 'Your resume and career preparation',
    image: '/images/pages/career-services-page-5.webp',
    alt: 'Career preparation and professional support',
    text: 'Start your resume while you train. Add skills you can demonstrate and update your work history. Ask your program contact about career services and the approved way to submit your resume.',
    action: 'Open resume builder',
    href: '/lms/resume-builder',
  },
  {
    title: 'Help when you need it',
    image: '/images/pages/contact-hero.jpg',
    alt: 'Student communication and support',
    text: 'Select Need help? to open PARIS when you want guidance. For staff support, explain which page or lesson is blocked and include the exact error. Keep passwords and private financial information out of messages and screenshots. Ask staff about accessibility needs or changes to your schedule.',
    action: 'Contact learner support',
    href: '/lms/support',
  },
];

export default function DashboardOrientation({
  bookkeeping = false,
  hvac = false,
  instructorEmail,
}: {
  bookkeeping?: boolean;
  hvac?: boolean;
  instructorEmail?: string;
}) {
  const emailHref = instructorEmail
    ? `/communications/email?to=${encodeURIComponent(instructorEmail)}&subject=${encodeURIComponent('Bookkeeping orientation introduction')}`
    : '/lms/support';
  const courseSlides = bookkeeping
    ? [
        {
          title: 'Your bookkeeping class',
          image: '/images/pages/bookkeeping.webp',
          alt: 'Bookkeeping learning workspace',
          text: 'The published pathway runs for 8 weeks and combines online study with guided practice. Your individual training dates appear above this slideshow. Email Dr. Wilkes to confirm your class meetings, weekly work, and assigned course-provider access.',
          action: 'Email Dr. Wilkes about my class',
          href: emailHref,
        },
        {
          title: 'Meet Dr. Carlina Wilkes',
          image: '/images/carlina-wilkes.jpg',
          alt: 'Dr. Carlina Wilkes',
          text: 'Dr. Wilkes leads financial operations and organizational compliance and supports business-program instruction. Her approved bio documents more than 24 years of federal financial management experience with the Defense Finance and Accounting Service and DoD Financial Management Certification Level II.',
          action: 'Read Dr. Wilkes’s background',
          href: 'https://www.elevateforhumanity.org/about/team/carlina-wilkes',
        },
        {
          title: 'What you will learn',
          image: '/images/pages/bookkeeping-ledger.webp',
          alt: 'Ledger and bookkeeping study materials',
          text: 'Week 1 introduces accounts, journal entries, and ledgers. Weeks 2–3 cover QuickBooks setup, invoicing, expenses, and reconciliation. Week 4 covers payroll and tax basics. Weeks 5–8 combine financial empowerment, Excel, certification preparation, and career preparation. Confirm your assigned pacing with Dr. Wilkes.',
          action: 'Open my assigned courses',
          href: '/lms/courses',
        },
        {
          title: 'Your first task: email Dr. Wilkes',
          image: '/images/pages/contact-hero.jpg',
          alt: 'Communication and course support',
          text: instructorEmail
            ? `Email ${instructorEmail}, the active Center of Destiny program mailbox managed by Dr. Wilkes. Introduce yourself, say you are enrolled in bookkeeping, and ask her to confirm your first assignment and meeting schedule. Use the button to open an addressed message, write your introduction, and select Send.`
            : 'Open learner support to confirm your assigned instructor’s active interoffice mailbox before sending your introduction.',
          action: instructorEmail
            ? 'Write my introduction to Dr. Wilkes'
            : 'Confirm my instructor contact',
          href: emailHref,
        },
        {
          title: 'How interoffice email works',
          image: '/images/pages/admin-live-chat-detail.webp',
          alt: 'Interoffice communication workspace',
          text: `Open Interoffice Email in Learning Tools. Select Compose. In To, enter ${instructorEmail || 'your confirmed instructor address'}. Add a clear subject and your message, then select Send. Open Sent to check its status. Check Inbox for replies and use Reply to keep the conversation together.`,
          action: 'Open interoffice email',
          href: '/communications/email',
        },
      ]
    : [];
  const allSlides = [
    slides[0],
    ...courseSlides,
    ...slides.slice(1),
    {
      title: 'Documents and enrollment records',
      image: '/images/pages/office-admin-desk.jpg',
      alt: 'Organized documents at a desk',
      text: 'Open Documents & Records to review required paperwork and upload requested files. Check each submission’s status and respond to staff requests. Keep your contact details current and use your own student account.',
      action: 'Open my documents',
      href: '/lms/documents',
    },
    {
      title: 'Messages, meetings, and deadlines',
      image: '/images/pages/resume-building-hero.webp',
      alt: 'Program guidance and planning',
      text: 'Open Calendar & Appointments in the sidebar. Select Request an appointment, add your preferred dates and time zone, then send the email to your program contact. Check the calendar for confirmed appointments. When your dashboard shows a scheduled video meeting, use its Join link at the scheduled time. Allow camera and microphone access when you choose to join. Ask staff about a missing invitation or a connection problem.',
      action: 'Review my schedule',
      href: '/lms/calendar',
    },
    {
      title: 'Career services and your next step',
      image: '/images/pages/career-services-page-5.webp',
      alt: 'Career development support',
      text: 'Open Career Services to begin career readiness and review job matches. Complete your resume, submit your credentials for review, and confirm remaining completion requirements with staff. Reading this slideshow does not mark your training or orientation records complete.',
      action: 'Start career readiness',
      href: '/lms/career',
    },
  ];
  const [index, setIndex] = useState(0);
  const slide = allSlides[index];
  return (
    <div className="space-y-5">
    <VisualDashboardOrientation audience={hvac ? 'hvac' : 'learner'} compact />
    <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="min-h-11 cursor-pointer font-bold">More program-specific instructions and instructor contact</summary>
    <section
      aria-label="Student orientation slideshow"
      aria-roledescription="carousel"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid min-w-0 md:grid-cols-2">
        <div className="relative aspect-[16/10] min-w-0 bg-slate-100 md:aspect-auto md:min-h-80">
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className={
              slide.image === '/images/carlina-wilkes.jpg'
                ? 'object-contain bg-white'
                : 'object-cover'
            }
          />
        </div>
        <div className="min-w-0 p-5 sm:p-8" aria-live="polite" aria-atomic="true">
          <p className="text-sm font-bold text-brand-blue-700">
            Orientation and expectations · Slide {index + 1} of {allSlides.length}
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">{slide.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-700">{slide.text}</p>
          <Link
            href={slide.href}
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand-blue-700 px-4 py-2 font-bold text-white hover:bg-brand-blue-800"
          >
            {slide.action}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
        <select
          aria-label="Orientation topic"
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
          className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-900"
        >
          {allSlides.map((item, slideIndex) => (
            <option key={item.title} value={slideIndex}>
              {slideIndex + 1}. {item.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-900 disabled:opacity-40"
        >
          Previous slide
        </button>
        <span className="text-sm font-semibold text-slate-600">
          {index + 1} / {allSlides.length}
        </span>
        <button
          type="button"
          onClick={() => setIndex(index === allSlides.length - 1 ? 0 : index + 1)}
          className="min-h-11 rounded-lg bg-slate-950 px-4 py-2 font-bold text-white"
        >
          {index === allSlides.length - 1 ? 'Restart orientation' : 'Next slide'}
        </button>
      </div>
      {index === allSlides.length - 1 ? (
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/lms/orientation"
            className="inline-flex min-h-11 items-center font-bold text-blue-800 underline"
          >
            Review orientation acknowledgement
          </Link>
          <p className="text-sm text-slate-600">
            Review the program requirements and submit the acknowledgement on the orientation page.
          </p>
        </div>
      ) : null}
    </section>
    </details>
    </div>
  );
}

export function DashboardOrientationPanel(props: {
  bookkeeping?: boolean;
  hvac?: boolean;
  instructorEmail?: string;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const openFromSidebar = () => {
      if (window.location.hash === '#orientation' && panel.current) panel.current.open = true;
    };
    openFromSidebar();
    window.addEventListener('hashchange', openFromSidebar);
    return () => window.removeEventListener('hashchange', openFromSidebar);
  }, []);
  return (
    <details
      ref={panel}
      id="orientation"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <summary className="min-h-11 cursor-pointer text-lg font-bold text-slate-950">
        Start orientation: your dashboard and class
      </summary>
      <div className="mt-4">
        <DashboardOrientation {...props} />
      </div>
    </details>
  );
}
