// components/home/Hero.tsx
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Lightbulb, CheckCircle2, Calendar, FileText, TrendingUp } from 'lucide-react';

export function Hero() {
  return (
    <>
      {/* FULL-WIDTH HERO BANNER AT TOP */}
      <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[500px]">
        <Image
          src="/images/pages/admin-dashboard-hero.webp"
          alt="Elevate For Humanity - Career Training and Partnerships"
          fill
          priority
          className="object-cover"
          sizes="100vw" placeholder="empty"
        />
      </div>

      {/* HERO SECTION WITH TEXT AND IMAGE */}
      <section className="">
        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-16 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] items-center">
          {/* LEFT – TEXT */}
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
              Your Training is Funded. Your Support is Real. Your Future Starts Here.
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black leading-tight">
              Build Real Careers
              <br className="hidden sm:block" />
              <span className="text-brand-orange-600"> With Real Support</span>
            </h1>
            <p className="text-sm sm:text-base text-black max-w-3xl leading-relaxed">
              Welcome to Elevate For Humanity — where adult learners, returning citizens, and
              working families can build real careers with real support. Our programs are{' '}
              <strong>
                fully funded through WIOA, WRG, JRI, employer partnerships, apprenticeships, OJT and
                WEX
              </strong>{' '}
              — so you can train with no out-of-pocket cost.
            </p>

            <p className="text-sm sm:text-base text-black max-w-3xl leading-relaxed">
              Choose from high-demand pathways in{' '}
              <strong>
                healthcare, HVAC, CDL, business, esthetics, barbering, reentry careers, workforce
                readiness, and more
              </strong>
              . Learn hands-on in real shops, labs, clinics and workplaces, guided by instructors
              and employer partners who actually hire.
            </p>

            <p className="text-sm sm:text-base text-black max-w-3xl leading-relaxed">
              At Elevate For Humanity, you don&apos;t just enroll — <strong>you gain a team</strong>
              . Your career coach helps you navigate barriers, stay motivated, and unlock funding
              and paid training. Our portals keep you on track, and our employer network connects
              you to job opportunities as soon as you&apos;re ready.
            </p>

            <p className="text-sm sm:text-base text-black max-w-3xl leading-relaxed font-semibold">
              Whether you&apos;re starting over, starting out, or simply ready for something better
              — this is your pathway to a stable, meaningful career.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/apply"
                className="px-5 py-2.5 rounded-full bg-brand-orange-600 text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-700 transition-colors"
              >
                Apply Now
              </Link>
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm text-slate-900 text-sm font-bold hover:bg-white hover:text-brand-orange-600 transition-colors shadow-lg"
              >
                Schedule at Indiana Career Connect
              </a>
            </div>

            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
              If IndianaCareerConnect.com doesn&apos;t load, call your local WorkOne office and ask
              for a WIOA/WRG appointment. Tell them Elevate For Humanity is your training provider.
            </p>

            <div className="flex flex-wrap gap-6 text-xs text-black pt-4 border-t border-slate-200">
              <div>
                <p className="font-bold text-black text-sm">• Fully Funded Training</p>
                <p>WIOA • WRG • JRI • OJT • WEX</p>
              </div>
              <div>
                <p className="font-bold text-black text-sm">• Career Coach Support</p>
                <p>Navigate barriers, unlock funding</p>
              </div>
              <div>
                <p className="font-bold text-black text-sm">• Real Job Connections</p>
                <p>Employer partners who hire</p>
              </div>
              <div>
                <p className="font-bold text-black text-sm">• Hands-On Learning</p>
                <p>Real shops, labs, clinics, workplaces</p>
              </div>
            </div>
          </div>

          {/* RIGHT – IMAGE */}
          <div className="relative h-56 sm:h-72 lg:h-80 rounded-3xl overflow-hidden shadow-md">
            <Image
              src="/images/pages/admin-dashboard-hero.webp"
              alt="Elevate For Humanity - Healthcare Programs"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover" placeholder="empty"
            />
          </div>
        </div>

        {/* How to Get Started Section */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-orange-600" />
              How to Get Started:
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-black">Schedule Your Appointment</h3>
                </div>
                <p className="text-sm text-black mb-3">
                  <strong>Option 1:</strong> Visit{' '}
                  <a
                    href="https://www.indianacareerconnect.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-orange-600 underline hover:text-brand-red-700 font-semibold"
                  >
                    www.IndianaCareerConnect.com
                  </a>{' '}
                  to create an account and schedule your appointment online.
                </p>
                <p className="text-sm text-black mb-3">
                  <strong>Option 2:</strong> Call your local WorkOne office directly to schedule an
                  appointment with a career counselor.
                </p>
                <p className="text-xs text-slate-500 italic flex items-start gap-1">
                  <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Tip: Have your ID, proof of income, and employment history ready for your appointment.</span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-black">Get Approved for Funded Training</h3>
                </div>
                <p className="text-sm text-black mb-2">Your WorkOne counselor will:</p>
                <ul className="text-sm text-black space-y-1 ml-4 mb-2">
                  <li className="flex items-start gap-1"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Complete your intake and eligibility assessment</li>
                  <li className="flex items-start gap-1"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Process all funding paperwork (WIOA, WRG, or JRI)</li>
                  <li className="flex items-start gap-1"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Check your eligibility for no-cost training</li>
                  <li className="flex items-start gap-1"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Enroll you in your chosen program</li>
                </ul>
                <p className="text-xs text-slate-500 italic flex items-start gap-1">
                  <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Most appointments take 30-60 minutes. Same-day approval is common!</span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-black">Start Your Training</h3>
                </div>
                <p className="text-sm text-black mb-2">Once approved, you'll:</p>
                <ul className="text-sm text-black space-y-1 ml-4 mb-2">
                  <li className="flex items-start gap-1"><TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Begin training immediately (most programs start within 1-2 weeks)</li>
                  <li className="flex items-start gap-1"><TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Get connected to real shops, clinics, and job sites</li>
                  <li className="flex items-start gap-1"><TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Receive hands-on training from industry professionals</li>
                  <li className="flex items-start gap-1"><TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Earn certifications and credentials</li>
                  <li className="flex items-start gap-1"><TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Get job placement assistance upon completion</li>
                </ul>
                <p className="text-xs text-slate-500 italic flex items-start gap-1">
                  <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>No tuition for eligible participants through WIOA, WRG, or JRI funding.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
