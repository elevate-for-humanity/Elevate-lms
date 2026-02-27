import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import OrientationFormClient from './OrientationFormClient';


export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/orientation' },
  title: 'Orientation | Elevate For Humanity',
  description:
    'Attend a virtual orientation session to learn about our free career training programs, funding options, and what to expect as a student.',
};

export default async function OrientationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Orientation' }]} />
      </div>

      {/* Hero — image only, no text overlay */}
      <section className="relative h-[280px] md:h-[350px] lg:h-[400px] overflow-hidden">
        <Image
          src="/images/efh/sections/classroom.jpg"
          alt="Orientation session"
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
      </section>

      {/* Title + Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 text-center">
            Virtual Orientation
          </h1>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              Orientation is the first step after you apply. During this session you will learn how the program works,
              what funding covers your training, what to expect on your first day of class, and how our career services
              team helps you find employment after graduation.
            </p>
            <p>
              All orientation sessions are held virtually via Zoom. You do not need to come to a physical location.
              Sessions run approximately 45 minutes and include time for questions. You will receive a confirmation
              email with the Zoom link after you book your session below.
            </p>
          </div>
        </div>
      </section>

      {/* Schedule Your Orientation */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">
            Schedule Your Orientation
          </h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Pick a date and time below. Once you submit, you and our team will receive a Google Calendar invite
            with the Zoom meeting link by email.
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-xl mx-auto">
            <OrientationFormClient />
          </div>
        </div>
      </section>

      {/* Join via Zoom */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Join via Zoom</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            After you schedule your orientation above, you will receive a calendar invite
            with a unique Zoom meeting link. Use that link to join at your scheduled time.
          </p>
          <p className="text-slate-500 text-sm">
            Questions? Call <a href="tel:+13173143757" className="text-brand-blue-600 font-medium hover:underline">(317) 314-3757</a> or
            visit our <Link href="/contact" className="text-brand-blue-600 font-medium hover:underline">contact page</Link>.
          </p>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">What You&apos;ll Learn in Orientation</h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              <strong>How the program works:</strong> We explain the full process from enrollment to graduation.
              You will understand exactly what is covered by funding (tuition, books, supplies, certification fees)
              and what you are responsible for (showing up, completing assignments, passing your certification exam).
              There are no hidden costs.
            </p>
            <p>
              <strong>What to expect on day one:</strong> You will meet your instructors, receive your materials,
              and get a tour of the learning platform. Classes are structured with both classroom instruction and
              hands-on practice. Attendance is mandatory — most programs require 90% or higher attendance to maintain
              funding eligibility.
            </p>
            <p>
              <strong>How to get the most out of your training:</strong> Students who succeed treat this like a job.
              Show up on time, participate in class, ask questions, and complete all assignments. Your instructors
              are experienced professionals who want to see you pass your certification on the first attempt.
            </p>
            <p>
              <strong>What happens after graduation:</strong> Our career services team begins working with you
              before you graduate. They help with resume writing, interview preparation, and direct referrals to
              employer partners. Most graduates are placed in jobs within 30 days of completing their program.
              Career support is free and available to alumni for life.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-slate-900">
            What Students Say
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700 mb-4 italic">
                &quot;I thought I&apos;d be the oldest person there. I wasn&apos;t. I thought I&apos;d be behind.
                I wasn&apos;t. Everyone starts somewhere. The instructors actually care.&quot;
              </p>
              <p className="text-sm font-semibold text-slate-900">— Marcus, CNA Graduate</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700 mb-4 italic">
                &quot;I had a record. I thought no one would hire me. But they helped me with my resume,
                practiced interviews with me, and connected me with employers who gave me a chance.&quot;
              </p>
              <p className="text-sm font-semibold text-slate-900">— James, HVAC Technician</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700 mb-4 italic">
                &quot;I was working two part-time jobs with no benefits. Now I have a career. I have insurance.
                I can actually plan for the future.&quot;
              </p>
              <p className="text-sm font-semibold text-slate-900">— Sarah, Medical Assistant</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700 mb-4 italic">
                &quot;The best part? No student loans. I graduated and started working the next week.
                No debt hanging over me.&quot;
              </p>
              <p className="text-sm font-semibold text-slate-900">— David, Barber Apprentice</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-brand-red-100 text-lg mb-8">
            Apply online, then schedule your orientation above. Training may be free for eligible Indiana residents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply/student"
              className="bg-white text-brand-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-50 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="bg-slate-900 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


