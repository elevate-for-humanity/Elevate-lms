'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import HeroVideoWithVoiceover from '@/components/HeroVideoWithVoiceover';

interface Program {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  duration_weeks: number;
  price: number;
  certification: string;
  is_active: boolean;
}

const programImages: Record<string, string> = {
  'it-support-specialist': '/images/technology/hero-program-it-support.jpg',
  'it-support': '/images/technology/hero-program-it-support.jpg',
  'cybersecurity-analyst': '/images/technology/hero-program-cybersecurity.jpg',
  'cybersecurity': '/images/technology/hero-program-cybersecurity.jpg',
  'web-development': '/images/technology/hero-program-web-dev.jpg',
  'data-analytics': '/images/technology/hero-program-it-support.jpg',
  'default': '/images/technology/hero-programs-technology.jpg',
};

export default function TechnologyProgramsPage() {
  const [showContent, setShowContent] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs?category=technology');
        const data = await res.json();
        if (data.status === 'success' && data.programs?.length > 0) {
          setPrograms(data.programs);
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">


      {/* Hero */}
      <HeroVideoWithVoiceover
        videoSrc="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4"
        posterSrc="/images/technology-vibrant.jpg"
        voiceoverSrc="/videos/technology-welcome.mp3"
      >
        <div className="flex items-center min-h-[50vh] sm:min-h-[60vh]">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">Technology Programs</h1>
              <p className="text-xl text-white/90 max-w-2xl mb-8">Launch your tech career with free, WIOA-funded training programs</p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/apply?program=technology"
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors text-lg"
                >
                  Apply Now
                </Link>
                <Link 
                  href="/wioa-eligibility"
                  className="inline-flex items-center text-white text-lg border-b-2 border-white pb-1 hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
                >
                  Check Eligibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </HeroVideoWithVoiceover>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/ai-tutor.mp4" 
        title="Technology Programs Guide" 
      />

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Technology" programSlug="technology" />

      {/* Programs Grid */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Technology Programs</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Choose Your Tech Path</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">All programs are free for eligible participants through WIOA funding.</p>
          </div>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse shadow-lg" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Link
                  key={program.id || program.slug}
                  href={`/programs/${program.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${programImages[program.slug] || programImages['default']})` }}
                      role="img"
                      aria-label={program.name}
                    />
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {program.duration_weeks ? `${program.duration_weeks} Weeks` : 'Flexible'}
                    </div>
                    {program.price === 0 && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Free
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{program.description}</p>
                    <span className="text-blue-600 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn More <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">What You&apos;ll Learn</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Industry-recognized skills and certifications for in-demand tech careers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">IT Support</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Hardware troubleshooting</li>
                <li>• Operating systems (Windows, Mac, Linux)</li>
                <li>• Network fundamentals</li>
                <li>• Help desk procedures</li>
                <li>• CompTIA A+ certification prep</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Cybersecurity</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Security fundamentals</li>
                <li>• Threat detection and prevention</li>
                <li>• Network security</li>
                <li>• Compliance and regulations</li>
                <li>• CompTIA Security+ prep</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Professional Skills</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Technical documentation</li>
                <li>• Customer service</li>
                <li>• Problem-solving methodology</li>
                <li>• Team collaboration</li>
                <li>• Project management basics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Requirements</h2>
            <p className="text-lg text-slate-600">What you need to start technology training.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-green-700 mb-4">Basic Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">18 years or older</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">High school diploma or GED</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Basic computer literacy</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Access to a computer for coursework</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-blue-600 mb-4">For Free Training (WIOA)</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Indiana resident</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unemployed or underemployed</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">OR receiving public assistance</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">OR veteran status</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 lg:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Career Outcomes</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Tech careers offer strong wages, growth potential, and job security.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">$18-$28</div>
              <p className="text-slate-400">Starting hourly wage</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">85%+</div>
              <p className="text-slate-400">Job placement rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">8-16 wks</div>
              <p className="text-slate-400">Typical program duration</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">Growing</div>
              <p className="text-slate-400">Industry demand</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 text-center">Technology Program FAQ</h2>
          
          <div className="space-y-4">
            {[
              { q: 'What technology programs do you offer?', a: 'IT Support Specialist, Cybersecurity Analyst, and related tech programs. Availability varies by funding and demand.' },
              { q: 'Do I need prior tech experience?', a: 'No prior experience required. We start with fundamentals and build your skills. Basic computer literacy (using email, web browsing) is helpful.' },
              { q: 'What certifications will I earn?', a: 'Depends on your program. IT Support leads to CompTIA A+. Cybersecurity leads to CompTIA Security+. These are industry-recognized credentials.' },
              { q: 'Is the training really free?', a: 'Yes, for eligible participants. WIOA funding covers tuition, certification exams, and materials. Check your eligibility to see if you qualify.' },
              { q: 'How long are the programs?', a: 'Most programs are 8-16 weeks. Some include additional lab time and exam preparation.' },
              { q: 'What if I have a criminal record?', a: 'Many tech employers are open to candidates with records. We work with justice-involved individuals and can help identify opportunities.' },
              { q: 'Do you help with job placement?', a: 'Yes! We have partnerships with IT companies, help desks, and managed service providers. We provide resume help and interview preparation.' },
              { q: 'Can I work while in training?', a: 'Yes, many students work part-time while in training. Some programs offer evening or weekend options.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-slate-900">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Tech Career?</h2>
          <p className="text-blue-100 mb-8">Free training available for eligible Indiana residents.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=technology"
              className="inline-block bg-white text-blue-600 px-8 py-4 font-semibold rounded-full hover:bg-blue-50 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-block border-2 border-white text-white px-8 py-4 font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
