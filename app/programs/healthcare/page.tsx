'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';

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

// Map program slugs to images
const programImages: Record<string, string> = {
  'cna': '/images/healthcare/hero-program-patient-care.jpg',
  'cna-cert': '/images/healthcare/hero-program-patient-care.jpg',
  'cna-training-wrg': '/images/healthcare/hero-program-patient-care.jpg',
  'direct-support-professional': '/images/healthcare/hero-program-medical-assistant.jpg',
  'dsp-training': '/images/healthcare/hero-program-medical-assistant.jpg',
  'drug-collector': '/images/healthcare/hero-program-phlebotomy.jpg',
  'medical-assistant': '/images/healthcare/hero-program-medical-assistant.jpg',
  'phlebotomy-technician': '/images/healthcare/hero-program-phlebotomy.jpg',
  'pharmacy-technician': '/images/healthcare/hero-program-medical-assistant.jpg',
  'dental-assistant': '/images/healthcare/hero-program-patient-care.jpg',
  'default': '/images/healthcare/hero-program-patient-care.jpg',
};

export default function HealthcareProgramsPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showContent, setShowContent] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch programs from database
  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs?category=healthcare');
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  const getImageForProgram = (slug: string) => {
    return programImages[slug] || programImages['default'];
  };

  const formatDuration = (weeks: number) => {
    if (!weeks) return 'Flexible';
    if (weeks <= 2) return '1-2 Weeks';
    if (weeks <= 4) return '2-4 Weeks';
    if (weeks <= 6) return '4-6 Weeks';
    if (weeks <= 8) return '6-8 Weeks';
    return `${weeks} Weeks`;
  };

  return (
    <div className="min-h-screen bg-white">


      {/* Hero */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover brightness-110"
          loop
          muted
          playsInline
          autoPlay
          preload="metadata"
          poster="/images/healthcare-vibrant.jpg"
        >
          <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/cna-hero.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">Healthcare Programs</h1>
            <p className="text-xl text-white/90 max-w-2xl mb-8">Start your career in healthcare with free, WIOA-funded training programs</p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/apply?program=healthcare"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                Apply Now
              </Link>
              <Link 
                href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center text-white text-lg border-b-2 border-white pb-1 hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
              >
                Register at Indiana Career Connect
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/healthcare-guide.mp4" 
        title="Healthcare Guide" 
      />

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Healthcare" programSlug="healthcare" />

      {/* Programs Grid */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Healthcare Programs</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Choose Your Healthcare Path</h2>
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
                      style={{ backgroundImage: `url(${getImageForProgram(program.slug)})` }}
                      role="img"
                      aria-label={program.name}
                    />
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {formatDuration(program.duration_weeks)}
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
              Our healthcare programs prepare you for real-world patient care and clinical settings.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Patient Care Skills</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Vital signs monitoring</li>
                <li>• Patient hygiene assistance</li>
                <li>• Mobility and transfer techniques</li>
                <li>• Infection control procedures</li>
                <li>• Documentation and charting</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Clinical Procedures</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Blood draw techniques (Phlebotomy)</li>
                <li>• Specimen collection</li>
                <li>• Medical equipment operation</li>
                <li>• Emergency response basics</li>
                <li>• CPR and First Aid</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Professional Skills</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• HIPAA compliance</li>
                <li>• Medical terminology</li>
                <li>• Patient communication</li>
                <li>• Team collaboration</li>
                <li>• Healthcare ethics</li>
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
            <p className="text-lg text-slate-600">What you need to get started in healthcare training.</p>
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
                  <span className="text-gray-700">Pass background check</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Reliable transportation</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-blue-700 mb-4">For Free Training (WIOA)</h3>
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
              Healthcare is one of the fastest-growing industries with strong job security.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">$15-$22</div>
              <p className="text-slate-400">Starting hourly wage for CNAs</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">90%+</div>
              <p className="text-slate-400">Job placement rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">4-8 wks</div>
              <p className="text-slate-400">Typical program duration</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">High</div>
              <p className="text-slate-400">Demand for healthcare workers</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 text-center">Healthcare Program FAQ</h2>
          
          <div className="space-y-4">
            {[
              { q: 'What healthcare certifications can I earn?', a: 'CNA (Certified Nursing Assistant), Phlebotomy Technician, Medical Assistant, Direct Support Professional, and more depending on the program.' },
              { q: 'How long is CNA training?', a: 'CNA training is typically 4-6 weeks including classroom instruction and clinical hours. You must complete 75 hours of training to be eligible for the state exam.' },
              { q: 'Is the training really free?', a: 'Yes, for eligible participants. WIOA funding covers tuition, books, scrubs, and certification exam fees. Check your eligibility to see if you qualify.' },
              { q: 'Where will I do clinical training?', a: 'Clinical training takes place at approved healthcare facilities in the Indianapolis area, including nursing homes, hospitals, and clinics.' },
              { q: 'Can I work while in training?', a: 'Yes, many students work part-time while in training. Classes are scheduled to accommodate working adults when possible.' },
              { q: 'What if I have a criminal record?', a: 'Some healthcare positions have background check requirements. We can discuss your specific situation and help identify programs that may be available to you.' },
              { q: 'Do you help with job placement?', a: 'Yes! We have partnerships with healthcare employers throughout Indianapolis. We provide resume help, interview prep, and direct connections to hiring managers.' },
              { q: 'What is the state CNA exam like?', a: 'The Indiana CNA exam has two parts: a written test and a skills demonstration. We prepare you for both and our pass rate is over 90%.' },
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
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Healthcare Career?</h2>
          <p className="text-blue-100 mb-8">Free training available for eligible Indiana residents.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=healthcare"
              className="inline-block bg-white text-blue-600 px-8 py-4 font-semibold rounded-full hover:bg-white transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="inline-block border-2 border-white text-white px-8 py-4 font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Register at Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
