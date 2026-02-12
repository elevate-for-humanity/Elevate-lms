export const dynamic = 'force-static';
export const revalidate = 86400;

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Youth Culinary Apprenticeship | Production Cook | Elevate for Humanity',
  description: 'DOL Registered Culinary Apprenticeship for aspiring production cooks. 2000-hour program with paid OJT. ServSafe certified. Learn professional kitchen skills.',
  alternates: { canonical: `${SITE_URL}/programs/culinary-apprenticeship` },
  openGraph: {
    title: 'Youth Culinary Apprenticeship | Elevate for Humanity',
    description: 'DOL Registered Culinary Apprenticeship for aspiring production cooks. 2000-hour program with paid OJT.',
    url: `${SITE_URL}/programs/culinary-apprenticeship`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/culinary/hero-program-culinary.jpg`, width: 1200, height: 630, alt: 'Culinary Apprenticeship' }],
    type: 'website',
  },
};

export default function CulinaryApprenticeshipPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[500px]">
        <Image
          src="/images/culinary/hero-program-culinary.jpg"
          alt="Culinary Apprenticeship"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <Breadcrumbs
              items={[
                { label: 'Programs', href: '/programs' },
                { label: 'Apprenticeships', href: '/programs/apprenticeships' },
                { label: 'Culinary Apprenticeship' },
              ]}
              className="text-white/80 mb-4"
            />
            <span className="inline-block px-4 py-2 bg-white0 text-white text-sm font-bold rounded-full mb-4">
              DOL REGISTERED APPRENTICESHIP
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Youth Culinary Apprenticeship
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Become a Production Cook through hands-on training in professional kitchens. Earn while you learn with paid on-the-job training.
            </p>
          </div>
        </div>
      </section>

      {/* CTA BUTTONS */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apply?program=culinary-apprenticeship"
            className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-white0 transition text-lg"
          >
            Apply Now
          </Link>
          <Link
            href="/inquiry?program=culinary-apprenticeship"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-full border-2 border-black hover:bg-gray-100 transition text-lg"
          >
            Request Information
          </Link>
        </div>
      </section>

      {/* PROGRAM QUICK FACTS */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-orange-600">2,000</div>
              <div className="text-slate-600">Training Hours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600">$10/hr</div>
              <div className="text-slate-600">Avg Journeyworker Wage</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600">500</div>
              <div className="text-slate-600">Probation Hours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600">8</div>
              <div className="text-slate-600">Journeyworkers</div>
            </div>
          </div>
        </div>
      </section>

      {/* EARN WHILE YOU LEARN */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Earn While You Learn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Get Hired</h3>
              <p className="text-slate-600">Start working in a professional kitchen from day one. You begin earning wages immediately as an apprentice.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Learn On-the-Job</h3>
              <p className="text-slate-600">Train alongside experienced chefs and cooks. Learn food prep, cooking techniques, kitchen safety, and food service operations.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Earn Credentials</h3>
              <p className="text-slate-600">Complete 2,000 hours and earn your DOL Journeyworker Certificate plus ServSafe Food Manager certification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/culinary/program-culinary-arts-training.jpg" alt="Culinary Training" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/culinary/program-culinary-overview.jpg" alt="Kitchen Operations" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/culinary/hero-program-hospitality.jpg" alt="Food Service" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* WHAT IS THIS PROGRAM */}
      <section id="overview" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-orange-600 font-semibold text-sm">RAPIDS CODE: 3010CB</span>
            <h2 className="text-3xl font-bold mt-2 mb-6">What is the Youth Culinary Apprenticeship?</h2>
            <p className="text-lg text-slate-700 mb-4">
              The Youth Culinary Apprenticeship is a DOL Registered Apprenticeship program designed to train aspiring Production Cooks through hands-on experience in professional kitchens. This competency-based program prepares you for a career in food service, restaurants, catering, and institutional food production.
            </p>
            <p className="text-lg text-slate-700 mb-4">
              Over 2,000 hours, you'll learn everything from basic food preparation and cooking techniques to kitchen management, food safety, and menu planning. You'll work alongside 8 experienced journeyworker chefs who will mentor you throughout your training.
            </p>
            <p className="text-lg text-slate-700">
              Upon completion, you'll receive a nationally recognized Journeyworker Certificate from the U.S. Department of Labor, plus industry certifications like ServSafe Food Manager.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <Image src="/images/culinary/program-culinary-arts-training.jpg" alt="Culinary Training" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* WHO SHOULD APPLY */}
      <section id="requirements" className="bg-slate-50 py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Who Should Apply?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8">
              <h3 className="font-bold text-xl mb-4">This Program is For You If:</h3>
              <ul className="space-y-3 text-slate-700">
                <li>• You have a passion for food and cooking</li>
                <li>• You enjoy working in fast-paced environments</li>
                <li>• You want to build a career in the culinary industry</li>
                <li>• You prefer hands-on learning over classroom study</li>
                <li>• You're a team player who works well under pressure</li>
                <li>• You want to earn while you learn</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8">
              <h3 className="font-bold text-xl mb-4">Basic Requirements:</h3>
              <ul className="space-y-3 text-slate-700">
                <li>• 16 years or older (Youth program)</li>
                <li>• High school diploma or GED (or currently enrolled)</li>
                <li>• Able to stand for extended periods</li>
                <li>• Able to work in hot kitchen environments</li>
                <li>• Committed to completing 2,000 hours</li>
                <li>• Willing to work flexible hours including weekends</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section id="curriculum" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Food Preparation</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Knife skills and cutting techniques</li>
                <li>• Ingredient preparation and mise en place</li>
                <li>• Measuring and portioning</li>
                <li>• Recipe reading and scaling</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Cooking Techniques</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Grilling, sautéing, and frying</li>
                <li>• Baking and roasting</li>
                <li>• Sauce preparation</li>
                <li>• Temperature control and timing</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Food Safety (ServSafe)</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Food handling and storage</li>
                <li>• Temperature danger zones</li>
                <li>• Cross-contamination prevention</li>
                <li>• Sanitation and cleaning procedures</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Kitchen Operations</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Station setup and breakdown</li>
                <li>• Equipment operation and care</li>
                <li>• Inventory management</li>
                <li>• Workflow optimization</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Menu & Production</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Menu planning basics</li>
                <li>• Batch cooking and production</li>
                <li>• Plating and presentation</li>
                <li>• Special dietary requirements</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Professional Skills</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Kitchen communication</li>
                <li>• Time management</li>
                <li>• Teamwork and collaboration</li>
                <li>• Customer service awareness</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Credentials You'll Earn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-white0 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-bold text-lg mb-2">DOL Journeyworker Certificate</h3>
              <p className="text-slate-400 text-sm">Nationally recognized credential upon completing 2,000 hours as a Production Cook</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-white0 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-bold text-lg mb-2">ServSafe Food Manager</h3>
              <p className="text-slate-400 text-sm">WRG-approved food safety certification required by employers</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-white0 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Competency Certificate</h3>
              <p className="text-slate-400 text-sm">Documentation of all culinary skills and competencies mastered</p>
            </div>
          </div>
        </div>
      </section>

      {/* WAGE PROGRESSION */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Wage Progression</h2>
          <p className="text-center text-slate-600 mb-8">Your wages increase as you gain skills and complete training milestones.</p>
          <div className="bg-slate-50 rounded-xl p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Probation (0-500 hours)</span>
                <span className="text-green-600 font-bold">Starting Wage</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Level 1 (500-1000 hours)</span>
                <span className="text-green-600 font-bold">Wage Increase #1</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Level 2 (1000-1500 hours)</span>
                <span className="text-green-600 font-bold">Wage Increase #2</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-semibold">Journeyworker (1500-2000 hours)</span>
                <span className="text-green-600 font-bold">Full Journeyworker Wage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAREER PATHS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Career Paths</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🍳</div>
              <h3 className="font-bold mb-2">Line Cook</h3>
              <p className="text-sm text-slate-600">Restaurants, hotels, resorts</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="font-bold mb-2">Institutional Cook</h3>
              <p className="text-sm text-slate-600">Hospitals, schools, cafeterias</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="font-bold mb-2">Catering Cook</h3>
              <p className="text-sm text-slate-600">Events, weddings, corporate</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">👨‍🍳</div>
              <h3 className="font-bold mb-2">Sous Chef</h3>
              <p className="text-sm text-slate-600">Kitchen management track</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">How long is the apprenticeship?</h3>
              <p className="text-slate-700">The program is 2,000 hours, which typically takes about 1 year working full-time or longer if part-time.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Do I get paid during training?</h3>
              <p className="text-slate-700">Yes! You're employed from day one and earn wages throughout the entire apprenticeship. Your pay increases as you progress.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Can I apply if I'm still in high school?</h3>
              <p className="text-slate-700">Yes! This is a Youth Apprenticeship program. You can start at 16 years old while still enrolled in school.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What certification will I earn?</h3>
              <p className="text-slate-700">You'll earn a DOL Journeyworker Certificate as a Production Cook, plus ServSafe Food Manager certification which is WRG-approved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Culinary Career?</h2>
          <p className="text-xl text-slate-300 mb-8">Join our Youth Culinary Apprenticeship and become a certified Production Cook.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=culinary-apprenticeship" className="inline-flex items-center justify-center px-8 py-4 bg-white0 text-white font-bold rounded-full hover:bg-orange-400">
              Apply Now
            </Link>
            <Link href="/inquiry?program=culinary-apprenticeship" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 border border-slate-600">
              Request Information
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            RAPIDS Program: 2025-IN-132301 | Occupation Code: 3010CB | Sponsor: 2Exclusive LLC
          </p>
        </div>
      </section>
    </main>
  );
}
