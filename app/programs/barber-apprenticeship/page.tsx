// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import PageAvatar from '@/components/PageAvatar';
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Program | Become a Licensed Barber | Elevate for Humanity',
  description: 'Become a licensed barber through real-world apprenticeship training in Indianapolis. Train in approved barbershops, earn hours, track progress digitally, and graduate job-ready.',
  alternates: { canonical: `${SITE_URL}/programs/barber-apprenticeship` },
  openGraph: {
    title: 'Barber Apprenticeship Program | Elevate for Humanity',
    description: 'Become a licensed barber through real-world apprenticeship training. Train in approved barbershops, earn hours, and graduate job-ready.',
    url: `${SITE_URL}/programs/barber-apprenticeship`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/hero-images/barber-hero.jpg`, width: 1200, height: 630, alt: 'Barber Apprenticeship Program' }],
    type: 'website',
  },
};

const IMAGES = {
  training: "/images/barber/training.jpg",
  gallery1: "/images/barber/gallery-1.jpg",
  gallery2: "/images/barber/gallery-2.jpg",
  gallery3: "/images/barber/gallery-3.jpg",
};

async function getProgramStats() {
  try {
    const supabase = await createClient();
    if (!supabase) return { totalHours: 2000, enrolledCount: 0, completedCount: 0 };

    // Get program details
    const { data: program } = await supabase
      .from('programs')
      .select('id, total_hours, tuition')
      .or('slug.eq.barber-apprenticeship,code.eq.BARBER-2024')
      .single();

    // Get enrollment stats
    const { count: enrolledCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program?.id)
      .in('status', ['active', 'completed']);

    const { count: completedCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program?.id)
      .eq('status', 'completed');

    return {
      totalHours: program?.total_hours || 2000,
      tuition: program?.tuition || 4980,
      enrolledCount: enrolledCount || 0,
      completedCount: completedCount || 0,
    };
  } catch {
    return { totalHours: 2000, tuition: 4980, enrolledCount: 0, completedCount: 0 };
  }
}

export default async function BarberApprenticeshipPage() {
  const stats = await getProgramStats();
  
  return (
    <main className="min-h-screen bg-white text-black">
      {/* VIDEO HERO - Clean, no text overlay */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[500px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/barber/hero.jpg"
        >
          <source src="/videos/barber-training.mp4" type="video/mp4" />
        </video>
      </section>

      {/* Avatar Guide */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-3">Learn About the Barber Program</h2>
            <p className="text-lg text-black">Watch our guide explain the apprenticeship process</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <video
              autoPlay
              loop
              controls
              playsInline
              className="w-full"
            >
              <source src="/videos/avatars-heygen/avatar-5.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* CTA BUTTONS */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Start Your Barber Career?</h2>
            <p className="text-lg text-black mb-8">Apply now or request more information about the program</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/programs/barber-apprenticeship/apply"
                className="bg-brand-red-600 text-white px-10 py-5 rounded-lg font-semibold text-xl hover:bg-brand-red-700 transition-colors"
              >
                Apply Now
              </Link>
              <Link
                href="/inquiry?program=barber-apprenticeship"
                className="bg-white border-2 border-brand-red-600 text-brand-red-600 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-gray-50 transition-colors"
              >
                Request Information
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EARN WHILE YOU LEARN */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Earn While You Learn</h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              As a barber apprentice, you work in a real barbershop and get paid while completing your training hours.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold text-black mb-3">Get Placed in a Shop</h3>
              <p className="text-black">We match you with an approved partner barbershop where you'll train under a licensed barber.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold text-black mb-3">Work & Earn</h3>
              <p className="text-black">You work alongside experienced barbers, serve real clients, and earn money from day one.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold text-black mb-3">Complete 2,000 Hours</h3>
              <p className="text-black">Track your hours digitally, complete online coursework, and graduate ready for your state license.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[IMAGES.gallery1, IMAGES.gallery2, IMAGES.gallery3].map((src, idx) => (
            <div key={src} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={src}
                alt={`Barber apprenticeship gallery ${idx + 1}`}
                fill
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      </section>

      {/* WHAT IS THIS PROGRAM */}
      <section id="overview" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">What Is a Barber Apprenticeship?</h2>
            <p className="text-lg text-black mb-4">
              A barber apprenticeship is a state-approved pathway to becoming a licensed barber in Indiana. 
              Instead of attending a traditional barber school, you train directly in a working barbershop 
              under the supervision of licensed barbers.
            </p>
            <p className="text-lg text-black mb-4">
              This program is registered with the U.S. Department of Labor and approved by the Indiana 
              State Board of Cosmetology and Barber Examiners. You complete 2,000 hours of hands-on 
              training plus related instruction through Milady&apos;s online curriculum.
            </p>
            <p className="text-lg text-black">
              Upon completion, you are eligible to take the Indiana state barber licensing exam and 
              begin your career as a licensed barber.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-black mb-6">Program at a Glance</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-black">Total Hours Required</span>
                <span className="font-bold text-black">2,000 hours</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-black">Typical Duration</span>
                <span className="font-bold text-black">12-18 months</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-black">Training Format</span>
                <span className="font-bold text-black">In-shop + Online</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-black">Program Tuition</span>
                <span className="font-bold text-black">${stats.tuition?.toLocaleString() || '4,980'}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-black">Payment Options</span>
                <span className="font-bold text-black">Deposit + Weekly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Credential Earned</span>
                <span className="font-bold text-black">Indiana Barber License</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO SHOULD APPLY */}
      <section id="requirements" className="bg-white py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black text-center">Who Should Apply</h2>
          <p className="text-lg text-black text-center mb-12 max-w-2xl mx-auto">
            This program is designed for motivated individuals ready to commit to a career in barbering.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-green-700 mb-4">Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">At least 16 years old (18+ recommended)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">High school diploma or GED (or enrolled)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Reliable transportation to training site</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Ability to commit 20-40 hours per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Internet access for online coursework</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Good Fit If You...</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Prefer hands-on learning over classroom</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Want to earn while you learn</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Enjoy working with people</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Want to own your own business someday</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-black">Are looking for a second chance career</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section id="curriculum" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black text-center">What You&apos;ll Learn</h2>
          <p className="text-lg text-black text-center mb-12 max-w-2xl mx-auto">
            Our curriculum covers everything you need to pass the state exam and succeed as a professional barber.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-black mb-4">Cutting & Styling</h3>
              <ul className="space-y-2 text-black text-sm">
                <li>• Clipper techniques and fades</li>
                <li>• Scissor cutting methods</li>
                <li>• Beard trimming and shaping</li>
                <li>• Hair texturing and styling</li>
                <li>• Line-ups and edge work</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-black mb-4">Shaving & Grooming</h3>
              <ul className="space-y-2 text-black text-sm">
                <li>• Straight razor shaving</li>
                <li>• Hot towel treatments</li>
                <li>• Facial hair design</li>
                <li>• Skin care basics</li>
                <li>• Sanitation protocols</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-black mb-4">Business & Safety</h3>
              <ul className="space-y-2 text-black text-sm">
                <li>• Client consultation</li>
                <li>• Shop management basics</li>
                <li>• Indiana state regulations</li>
                <li>• Infection control</li>
                <li>• Professional ethics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      

      {/* VALUE PROPS */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue-900">Professional training, clean compliance.</h2>
            <p className="mt-5 text-lg text-black">
              You get a structured pathway with clear requirements, documented progress, and a dashboard that keeps everything organized.
            </p>
            <ul className="mt-8 space-y-4 text-lg text-black">
              <li>• Approved training sites + hour verification</li>
              <li>• Digital clock-in/out and progress tracking</li>
              <li>• Payment options available</li>
              <li>• Related instruction through Milady (Milady emails you access)</li>
            </ul>
          </div>
          <div className="relative aspect-[4/3] max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg">
            <Image src={IMAGES.training} alt="Hands-on barber training" fill className="object-cover object-center" />
          </div>
        </div>
      </section>

      {/* HOST SHOP HERO BANNER */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[400px]">
        <Image
          src="/images/barber/gallery-1.jpg"
          alt="Become a Host Barbershop"
          fill
          className="object-cover"
        />
      </section>

      {/* PARTNERSHIP SECTION */}
      <section id="partner-shops" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-4 py-2 bg-brand-red-600 text-white text-sm font-bold rounded-full">
                For Barbershop Owners
              </span>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold text-black">
                Become a Host Barbershop Partner
              </h2>
              <p className="mt-4 text-lg text-black">
                Join our network of approved training sites and help shape the next generation of licensed barbers. 
                We handle the paperwork, you provide the real-world training.
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Access Trained Apprentices</h3>
                    <p className="text-black text-sm">Get motivated learners ready to contribute to your shop</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">We Handle Compliance</h3>
                    <p className="text-black text-sm">Documentation, hour tracking, and state requirements managed for you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Build Your Legacy</h3>
                    <p className="text-black text-sm">Train future barbers and strengthen the profession</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/partners/barbershop-apprenticeship"
                  className="rounded-2xl bg-brand-red-600 text-white px-8 py-4 font-semibold hover:bg-brand-red-700 transition"
                >
                  Learn More
                </Link>
                <Link
                  href="/partners/barbershop-apprenticeship/apply"
                  className="rounded-2xl bg-white border-2 border-brand-red-600 text-brand-red-600 px-8 py-4 font-semibold hover:bg-gray-50 transition"
                >
                  Apply as Partner Shop
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-black">Host Shop Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Active Indiana barbershop license in good standing</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>At least one licensed barber to supervise apprentices</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Safe, professional training environment</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Commitment to apprentice development</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Willingness to use digital hour tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black text-center">Career Outcomes</h2>
          <p className="text-lg text-black text-center mb-12 max-w-2xl mx-auto">
            What happens after you complete the program and get licensed.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-black text-black mb-2">$35K-$60K</div>
              <p className="text-black">Average annual income for Indiana barbers</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-black mb-2">90%+</div>
              <p className="text-black">State exam pass rate for our apprentices</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-black mb-2">Flexible</div>
              <p className="text-black">Set your own schedule as a licensed barber</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-black mb-2">Unlimited</div>
              <p className="text-black">Earning potential with your own clientele</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-black mb-4 text-center">Career Paths After Licensure</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-black">Work at an established barbershop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-black">Rent a chair and build clientele</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-orange-500 rounded-full"></div>
                <span className="text-black">Open your own barbershop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-red-500 rounded-full"></div>
                <span className="text-black">Mobile barbering services</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black text-center">Frequently Asked Questions</h2>
          <p className="text-lg text-black text-center mb-12">
            Everything you need to know about the Barber Apprenticeship program.
          </p>
          
          <div className="space-y-4">
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                How much does the program cost?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                Total program tuition is ${stats.tuition?.toLocaleString() || '4,980'}. You pay a $1,743 setup fee to enroll, then $65/week during training. 
                Some employer-sponsored positions may cover part or all of the tuition. Payment plans are available.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                How long does it take to complete?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                Most apprentices complete the 2,000 required hours in 12-18 months, depending on how many hours per week they train. 
                Training 40 hours/week = about 12 months. Training 25 hours/week = about 18 months.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                Do I get paid during the apprenticeship?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                Pay arrangements vary by host shop. Some shops pay apprentices a small wage or commission on services. 
                Others provide unpaid training. We help match you with shops that fit your financial situation.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                Can I work another job while in the program?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                Yes. Many apprentices work part-time jobs while training. You set your training schedule with your host shop. 
                We recommend at least 20 hours per week of training to maintain progress.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                What if I have a criminal record?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                A criminal record does not automatically disqualify you. Indiana reviews license applications individually. 
                We have successfully helped justice-involved individuals complete the program and obtain their licenses.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                Where will I train?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                You train at one of our approved host barbershops in the Indianapolis area. We match you with a shop 
                based on location, schedule, and fit. You can also bring your own shop if they meet our requirements.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                What is Milady and how does it work?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                Milady is the industry-standard curriculum for barber education. You receive online access to complete 
                the &quot;related instruction&quot; portion of your apprenticeship. This covers theory, safety, and state exam prep.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-black flex justify-between items-center">
                What happens after I complete 2,000 hours?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-black">
                We submit your completion documentation to the Indiana State Board. You then schedule and take the state 
                licensing exam (written and practical). Once you pass, you receive your Indiana Barber License.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Your Barber Career?</h2>
          <p className="mt-4 text-lg text-black">
            Enroll today and begin your journey to becoming a licensed barber.
          </p>
          <p className="mt-2 text-sm text-black">
            $1,743 setup fee to start. Payment plans available.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-col sm:flex-row">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="rounded-2xl bg-brand-red-600 text-white px-8 py-4 font-semibold hover:bg-brand-red-700 transition"
            >
              Enroll & Pay Now
            </Link>
            <Link
              href="/inquiry?program=barber-apprenticeship"
              className="rounded-2xl bg-white text-black px-8 py-4 font-semibold hover:bg-white border border-gray-200 transition"
            >
              Request Information
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Questions? Call (317) 314-3757 or email elevate4humanityedu@gmail.com
          </p>
        </div>
      </section>
    </main>
  );
}
