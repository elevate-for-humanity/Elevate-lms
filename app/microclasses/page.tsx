import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Microclasses | Elevate for Humanity',
  description: 'Short, focused certification courses you can complete in days. CPR, First Aid, Food Handler, OSHA Safety and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/microclasses',
  },
};

const microclasses = [
  {
    title: 'CPR & First Aid (HSI)',
    description: 'American Heart Association aligned certification for healthcare and workplace safety.',
    duration: '4-6 hours',
    price: 'Free with WIOA',
    certification: 'HSI CPR/AED/First Aid',
    href: '/programs/cpr-first-aid-hsi',
    image: '/images/programs/cpr-certification-group-hd.jpg',
  },
  {
    title: 'Food Handler Certification',
    description: 'Required certification for food service workers in Indiana.',
    duration: '2-4 hours',
    price: 'Free with WIOA',
    certification: 'Indiana Food Handler Card',
    href: '/programs/food-handler',
    image: '/images/programs/default.jpg',
  },
  {
    title: 'OSHA 10-Hour Safety',
    description: 'Workplace safety certification for construction and general industry.',
    duration: '10 hours',
    price: 'Free with WIOA',
    certification: 'OSHA 10 Card',
    href: '/programs/osha-safety',
    image: '/images/trades/hero-program-welding.jpg',
  },
  {
    title: 'OSHA 30-Hour Safety',
    description: 'Advanced workplace safety certification for supervisors and managers.',
    duration: '30 hours',
    price: 'Free with WIOA',
    certification: 'OSHA 30 Card',
    href: '/programs/osha-30',
    image: '/images/trades/hero-program-welding.jpg',
  },
  {
    title: 'Forklift Certification',
    description: 'OSHA-compliant forklift operator training and certification.',
    duration: '4-8 hours',
    price: 'Free with WIOA',
    certification: 'Forklift Operator Card',
    href: '/programs/forklift',
    image: '/images/trades/program-building-construction.jpg',
  },
  {
    title: 'Bloodborne Pathogens',
    description: 'Required training for healthcare workers on infection control.',
    duration: '2 hours',
    price: 'Free with WIOA',
    certification: 'BBP Certificate',
    href: '/programs/bloodborne-pathogens',
    image: '/images/healthcare/hero-programs-healthcare.jpg',
  },
];

export default function MicroclassesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-brand-blue-600 text-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Quick Certifications
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Microclasses
            </h1>
            <p className="text-xl text-brand-blue-100 max-w-2xl mx-auto mb-8">
              Short, focused courses that give you job-ready certifications in hours or days, not months.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>2-30 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Industry Certifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Free with WIOA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Microclasses Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {microclasses.map((course, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group">
                <div className="h-48 bg-brand-blue-500 flex items-center justify-center">
                  <Award className="w-16 h-16 text-white/80" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{course.certification}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">{course.price}</span>
                    </div>
                  </div>

                  <Link 
                    href={course.href}
                    className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:text-brand-blue-700 group-hover:gap-3 transition-all"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Certified?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Most microclasses are free through WIOA funding. Check your eligibility today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/wioa-eligibility"
              className="bg-brand-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Check Eligibility
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
