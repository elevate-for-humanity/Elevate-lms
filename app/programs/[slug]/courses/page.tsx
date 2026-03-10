'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ProgramCoursesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/programs/${slug}/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async (courseId: string, price: number) => {
    if (price === 0) {
      window.location.href = `/courses/${courseId}/enroll`;
      return;
    }

    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        priceId: `price_${courseId}`,
        successUrl: `${window.location.origin}/courses/${courseId}/success`,
        cancelUrl: window.location.href
      })
    });

    const { url } = await response.json();
    if (url) window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Format program name from slug
  const programName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: programName, href: `/programs/${slug}` },
          { label: 'Courses' },
        ]}
      />
      {/* Hero Banner */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/programs-slug-courses-hero.jpg" alt="Professional training courses and certification programs" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-5 h-5 text-slate-300" />
              <span className="text-sm font-bold uppercase tracking-wide text-slate-300">{programName} Program</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Available Courses</h1>
            <p className="text-lg text-slate-300 mb-6 max-w-3xl mx-auto">
              Choose a course to start your learning journey. Get certified and advance your career.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="w-16 h-16 text-brand-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Enroll Through Our Admissions Team</h2>
            <p className="text-black mb-6">
              This program requires enrollment through our admissions process. 
              Apply now to get started with personalized guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                Apply Now
              </Link>
              <Link href="/programs" className="inline-block bg-white border-2 border-gray-300 hover:border-gray-400 text-black px-6 py-3 rounded-lg font-semibold transition">
                Browse Programs
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => {
              // Cycle through category images based on program
              const categoryImages: Record<string, string[]> = {
                'healthcare': [
                  '/images/pages/cna-patient-care.jpg',
                  '/images/pages/cna-vitals.jpg',
                  '/images/pages/medical-assistant-lab.jpg',
                  '/images/pages/phlebotomy-draw.jpg',
                  '/images/pages/healthcare-classroom.jpg',
                  '/images/pages/pharmacy-tech.jpg',
                ],
                'skilled-trades': [
                  '/images/pages/hvac-unit.jpg',
                  '/images/pages/hvac-tools.jpg',
                  '/images/pages/electrical-wiring.jpg',
                  '/images/pages/electrical-panel.jpg',
                  '/images/pages/welding-sparks.jpg',
                  '/images/pages/plumbing-pipes.jpg',
                ],
                'technology': [
                  '/images/pages/it-helpdesk-desk.jpg',
                  '/images/pages/it-hardware.jpg',
                  '/images/pages/it-networking.jpg',
                  '/images/pages/cybersecurity-screen.jpg',
                  '/images/pages/cybersecurity-code.jpg',
                  '/images/pages/tech-classroom.jpg',
                ],
                'business': [
                  '/images/pages/tax-prep-desk.jpg',
                  '/images/pages/tax-forms.jpg',
                  '/images/pages/bookkeeping-ledger.jpg',
                  '/images/pages/office-admin-desk.jpg',
                  '/images/pages/workforce-training.jpg',
                  '/images/pages/career-counseling.jpg',
                ],
                'transportation': [
                  '/images/pages/cdl-truck-highway.jpg',
                  '/images/pages/cdl-cab-interior.jpg',
                  '/images/pages/cdl-pretrip.jpg',
                  '/images/pages/cdl-loading-dock.jpg',
                  '/images/pages/cdl-driver-seat.jpg',
                  '/images/pages/cdl-truck-highway.jpg',
                ],
                'barber': [
                  '/images/pages/barber-fade.jpg',
                  '/images/pages/barber-shop-interior.jpg',
                  '/images/pages/barber-clippers.jpg',
                  '/images/pages/barber-lineup.jpg',
                  '/images/pages/barber-student.jpg',
                  '/images/pages/barber-gallery-1.jpg',
                ],
              };
              
              // Determine category from slug
              let category = 'healthcare';
              if (slug.includes('skilled') || slug.includes('hvac') || slug.includes('electrical') || slug.includes('building')) {
                category = 'skilled-trades';
              } else if (slug.includes('tech') || slug.includes('web') || slug.includes('cyber')) {
                category = 'technology';
              } else if (slug.includes('business') || slug.includes('tax') || slug.includes('accounting') || slug.includes('financial')) {
                category = 'business';
              } else if (slug.includes('cdl') || slug.includes('transport')) {
                category = 'transportation';
              } else if (slug.includes('barber') || slug.includes('beauty') || slug.includes('cosmetology')) {
                category = 'barber';
              }
              
              const images = categoryImages[category] || categoryImages['healthcare'];
              const courseImage = course.image || images[index % images.length];
              
              return (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <Image alt="Course lesson" 
                      src={courseImage} 
                      alt={course.title}
                      fill sizes="100vw"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/pages/workforce-training.jpg';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      {course.price === 0 && (
                        <span className="bg-brand-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                  <p className="text-black mb-4 line-clamp-3">{course.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-black">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration || '8 weeks'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-black">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessons || 24} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-black">
                      <Users className="w-4 h-4" />
                      <span>{course.enrolled || 0} enrolled</span>
                    </div>
                    {course.certification && (
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Award className="w-4 h-4" />
                        <span>Certificate included</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {course.price === 0 ? (
                          <div className="text-2xl font-bold text-brand-green-600">FREE</div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-black">${course.price}</div>
                            {course.originalPrice && (
                              <div className="text-sm text-black line-through">${course.originalPrice}</div>
                            )}
                          </>
                        )}
                      </div>
                      {course.funding && (
                        <div className="text-xs bg-brand-green-100 text-brand-green-800 px-2 py-1 rounded">
                          {course.funding}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleEnroll(course.id, course.price)}
                      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      {course.price === 0 ? (
                        <>
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          Enroll Free
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          Enroll Now
                        </>
                      )}
                    </button>
                  </div>

                  <Link 
                    href={`/courses/${course.id}`}
                    className="block text-center text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
                  >
                    View Course Details →
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
