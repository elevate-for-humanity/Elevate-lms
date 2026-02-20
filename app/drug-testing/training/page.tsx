import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowLeft, ExternalLink, GraduationCap, Award, Clock, Users, Star, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Drug Testing Training Courses | Elevate for Humanity',
  description: 'DOT and non-DOT drug testing training courses. Supervisor training, collector certification, DER training. Online courses with certification.',
};

export const dynamic = 'force-dynamic';

export default async function DrugTestingTrainingPage() {
  const supabase = await createClient();
  
  // Fetch NDS courses from database
  const { data: dbCourses } = await supabase
    .from('nds_training_courses')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');

  // Group courses by category
  const coursesByCategory = (dbCourses || []).reduce((acc: Record<string, any[]>, course: any) => {
    const category = course.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      name: course.name,
      price: course.elevate_price || course.nds_wholesale_cost * 2,
      description: course.description,
      duration: course.duration,
      certification: course.certification_name,
      link: course.nds_course_url,
      stripeProductId: course.stripe_product_id,
      stripePriceId: course.stripe_price_id,
      popular: course.is_popular,
      new: course.is_new,
    });
    return acc;
  }, {});

  const categories = Object.keys(coursesByCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Drug Testing Services', href: '/drug-testing' },
            { label: 'Training Courses' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image 
          src="/images/healthcare/drug-testing-training.jpg" 
          alt="Drug Testing Training" 
          fill 
          className="object-cover" 
          priority 
        />
        
      </section>

      {/* Partner Badge */}
      <section className="bg-white border-b py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-gray-600">
            <span className="text-sm">Training provided in partnership with</span>
            <Link href="https://mydrugtesttraining.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
              National Drug Screening <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses available at this time. Please check back later.</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {coursesByCategory[category].map((course: any, index: number) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{course.name}</h3>
                        <div className="flex items-center gap-2">
                          {course.new && (
                            <span className="px-2 py-1 bg-brand-green-100 text-brand-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> NEW
                            </span>
                          )}
                          {course.popular && (
                            <span className="px-2 py-1 bg-brand-orange-100 text-brand-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" /> Popular
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        {course.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {course.duration}
                          </span>
                        )}
                        {course.certification && (
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" /> {course.certification}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-2xl font-bold text-gray-900">${course.price}</span>
                        <Link 
                          href={course.link || '/contact'} 
                          target={course.link ? '_blank' : undefined}
                          rel={course.link ? 'noopener noreferrer' : undefined}
                          className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors flex items-center gap-2"
                        >
                          Enroll Now {course.link && <ExternalLink className="w-4 h-4" />}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Train With Us?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">DOT Compliant</h3>
              <p className="text-sm text-gray-600">All courses meet DOT regulatory requirements</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Certification</h3>
              <p className="text-sm text-gray-600">Download your certificate immediately upon completion</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Self-Paced</h3>
              <p className="text-sm text-gray-600">Complete training on your schedule, 24/7 access</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-brand-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Group Discounts</h3>
              <p className="text-sm text-gray-600">Volume pricing available for organizations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help Choosing a Course?</h2>
          <p className="text-brand-blue-100 mb-6">Our team can help you determine which training is right for your needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="px-8 py-3 bg-white text-brand-blue-600 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors">
              Contact Us
            </Link>
            <a href="/support" className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
