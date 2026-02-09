import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { CheckCircle, Clock, DollarSign, Award, Briefcase, Monitor, Users, ArrowRight, GraduationCap, Building2, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Free Through WRG | Elevate for Humanity',
  description: 'Free HVAC training through Indiana Workforce Ready Grant. No debt, no gimmicks. 12-16 weeks to a new career.',
};

export default function HVACProgramPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO VIDEO */}
      <section className="relative h-[60vh] min-h-[400px]">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/hvac-hero-final.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </section>

      {/* AVATAR */}
      <PageAvatar videoSrc="/videos/hero-hvac-avatar.mp4" title="Your HVAC Career Starts Here" />

      {/* NO DEBT BANNER */}
      <section className="bg-green-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xl font-bold">NO TUITION. NO DEBT. NO GIMMICKS.</p>
          <p className="text-green-100">100% funded through Indiana's Workforce Ready Grant for eligible participants</p>
        </div>
      </section>

      {/* TITLE + QUICK FACTS */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">HVAC Technician Training Program</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Become a certified HVAC technician in 12-16 weeks. We handle your funding through Indiana Career Connect. You focus on learning.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <DollarSign className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold">$0</div>
            <div className="text-slate-600">Your Cost</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold">12-16</div>
            <div className="text-slate-600">Weeks Total</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Briefcase className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold">Paid</div>
            <div className="text-slate-600">OJT Training</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Award className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold">EPA 608</div>
            <div className="text-slate-600">Certified</div>
          </div>
        </div>
      </section>

      {/* CTA 1 */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Change Your Life?</h2>
          <Link href="/inquiry?program=hvac" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50">
            Apply Now - Takes 5 Minutes <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* WRG SECTION */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-green-400 font-semibold">FUNDING SOURCE</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">What is the Workforce Ready Grant (WRG)?</h2>
              <p className="text-slate-300 text-lg mb-6">
                The Workforce Ready Grant is Indiana's flagship program for funding career training. Created by the state legislature, WRG pays 100% of tuition for eligible Hoosiers to train for high-demand jobs like HVAC.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" /><span>State-funded program - not a loan, not debt</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" /><span>Covers tuition, books, certification fees</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" /><span>Available at approved training providers like us</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" /><span>Administered through Indiana Career Connect</span></li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/programs/classroom-training.jpg" alt="WRG Funded Training" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* JRI SECTION */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden order-2 md:order-1">
              <Image src="/images/programs/employer-partnership.jpg" alt="JRI Employer Partnership" fill className="object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <span className="text-blue-600 font-semibold">EMPLOYER PARTNERSHIP</span>
              <h2 className="text-3xl font-bold mt-2 mb-6 text-slate-900">Job Ready Initiative (JRI)</h2>
              <p className="text-slate-600 text-lg mb-6">
                JRI connects our training directly to employer needs. Local HVAC companies help design our curriculum and commit to hiring graduates. This isn't training for training's sake - it's training that leads to jobs.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" /><span className="text-slate-700">Curriculum designed with employer input</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" /><span className="text-slate-700">Employers committed to interviewing graduates</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" /><span className="text-slate-700">Real skills employers actually need</span></li>
                <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" /><span className="text-slate-700">Direct pathway from training to employment</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM TIMELINE */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Your 12-16 Week Journey</h2>
            <p className="text-slate-600 mt-2">Here's exactly what to expect, week by week</p>
          </div>

          {/* Week 1-4 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/programs/online-learning.jpg" alt="Online Learning" fill className="object-cover" />
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-3">WEEKS 1-4</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Online Foundation Training</h3>
              <p className="text-slate-600 mb-4">Start from home. Our online platform teaches you HVAC fundamentals before you ever touch equipment.</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />HVAC theory and principles</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Electrical fundamentals</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Refrigeration basics</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Safety protocols and EPA regulations</li>
              </ul>
              <p className="text-sm text-slate-500 mt-4">20-25 hours/week • Self-paced • 24/7 access</p>
            </div>
          </div>

          {/* Week 5-8 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold mb-3">WEEKS 5-8</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Hands-On Lab Training</h3>
              <p className="text-slate-600 mb-4">Now you get hands-on. Work with real HVAC equipment in our training lab under instructor supervision.</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Equipment installation practice</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />System diagnostics and troubleshooting</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Repair techniques</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />EPA 608 certification exam</li>
              </ul>
              <p className="text-sm text-slate-500 mt-4">30-35 hours/week • In-person • Indianapolis area</p>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden order-1 md:order-2">
              <Image src="/images/programs/hands-on-training.jpg" alt="Hands-on Lab" fill className="object-cover" />
            </div>
          </div>

          {/* Week 9-16 */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/programs/ojt-work.jpg" alt="OJT Work Experience" fill className="object-cover" />
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-3">WEEKS 9-16</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Paid On-the-Job Training</h3>
              <p className="text-slate-600 mb-4">Get placed with an employer partner and earn wages while you learn. This is real work, real pay, real experience.</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Paid hourly wages</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Real job site experience</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Employer mentorship</li>
                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Path to full-time employment</li>
              </ul>
              <p className="text-sm text-slate-500 mt-4">40 hours/week • Paid wages • With employer partner</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 2 */}
      <section className="bg-green-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No Loans. No Debt. Just Opportunity.</h2>
          <p className="text-green-100 mb-6">See if you qualify for free training in 5 minutes</p>
          <Link href="/inquiry?program=hvac" className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-bold rounded-full hover:bg-green-50">
            Check My Eligibility <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Everything Included - No Hidden Costs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8">
              <GraduationCap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Training & Curriculum</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Complete HVAC training program</li>
                <li>• Online learning platform access</li>
                <li>• Hands-on lab instruction</li>
                <li>• All training materials</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8">
              <Award className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Certifications</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• EPA 608 certification exam</li>
                <li>• OSHA 10 safety certification</li>
                <li>• Program completion certificate</li>
                <li>• All exam fees covered</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Support Services</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Career coaching</li>
                <li>• Job placement assistance</li>
                <li>• Resume and interview prep</li>
                <li>• Supportive services available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Do You Qualify?</h2>
          <p className="text-center text-blue-200 mb-12 max-w-2xl mx-auto">WRG funding is available to Indiana residents who meet certain criteria</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Indiana Resident', desc: 'Must live in Indiana' },
              { title: '18+ Years Old', desc: 'Or 16+ with parent consent' },
              { title: 'HS Diploma/GED', desc: 'Or currently enrolled' },
              { title: 'Meet Income Guidelines', desc: 'Or receive public assistance' },
            ].map((item, i) => (
              <div key={i} className="bg-blue-800 rounded-xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-blue-200 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-blue-300 mt-8">Veterans, single parents, individuals with disabilities, and others may also qualify</p>
        </div>
      </section>

      {/* CAREER OUTCOMES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Your Future in HVAC</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div><div className="text-4xl font-bold text-blue-600">$45K+</div><div className="text-slate-600">Starting Salary</div></div>
            <div><div className="text-4xl font-bold text-green-600">90%</div><div className="text-slate-600">Job Placement</div></div>
            <div><div className="text-4xl font-bold text-purple-600">15%</div><div className="text-slate-600">Industry Growth</div></div>
            <div><div className="text-4xl font-bold text-orange-600">500+</div><div className="text-slate-600">Local Openings</div></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">No Risk. No Debt. Real Skills.</h2>
          <p className="text-xl text-slate-300 mb-8">Apply in 5 minutes. We'll verify your eligibility and handle your Indiana Career Connect enrollment.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry?program=hvac" className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400">
              Start Free Application <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/programs/hvac/apply" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 border border-slate-600">
              View Full Details
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
