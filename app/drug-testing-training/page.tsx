import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Phone, GraduationCap, Award, Users, CheckCircle } from 'lucide-react';


export const metadata: Metadata = {
  title: 'Drug Testing Training Courses | Elevate for Humanity',
  description:
    'Professional drug testing training courses. DOT and non-DOT collector training, supervisor training, DER training, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/drug-testing-training',
  },
};

// NDS Training Courses with 40% markup
const trainingCourses = {
  collector: [
    {
      name: 'DOT Urine Specimen Collector Training and Mocks',
      ndsPrice: 655,
      price: 917, // 40% markup
      description:
        'Complete DOT urine collector training with 5 required mock collections',
      duration: '4-6 hours + mocks',
      certificate: true,
      popular: true,
    },
    {
      name: 'DOT Urine Collector Mock Collections',
      ndsPrice: 330,
      price: 462,
      description: 'Mock collections only (for those already trained)',
      duration: '90 minutes',
      certificate: true,
    },
    {
      name: 'DOT Oral Fluid Collector Training Course (Mocks Included)',
      ndsPrice: 699,
      price: 979,
      description: 'Complete DOT oral fluid collector training with mocks',
      duration: '4-6 hours + mocks',
      certificate: true,
      new: true,
    },
    {
      name: 'Saliva-Oral Fluid Non-DOT Drug Testing Training',
      ndsPrice: 350,
      price: 490,
      description: 'Non-DOT oral fluid collection training',
      duration: '3-4 hours',
      certificate: true,
    },
  ],
  supervisor: [
    {
      name: 'DOT Supervisor Training Course',
      ndsPrice: 65,
      price: 91,
      description:
        'Required training for supervisors of DOT-regulated employees',
      duration: '60 minutes',
      certificate: true,
      popular: true,
    },
    {
      name: 'Non-DOT Supervisor Training Course',
      ndsPrice: 65,
      price: 91,
      description:
        'Supervisor training for non-DOT workplace drug testing programs',
      duration: '60 minutes',
      certificate: true,
    },
  ],
  der: [
    {
      name: 'DER Training Course - FMCSA',
      ndsPrice: 220,
      price: 308,
      description:
        'Designated Employer Representative training for FMCSA (trucking)',
      duration: '2-3 hours',
      certificate: true,
    },
    {
      name: 'DER Training Course - FAA',
      ndsPrice: 220,
      price: 308,
      description:
        'Designated Employer Representative training for FAA (aviation)',
      duration: '2-3 hours',
      certificate: true,
    },
    {
      name: 'Non-DOT General Designated Employer Representative Training (DER)',
      ndsPrice: 220,
      price: 308,
      description: 'DER training for non-DOT workplace programs',
      duration: '2-3 hours',
      certificate: true,
    },
  ],
  employee: [
    {
      name: 'Drug Free Workplace Training for Employees',
      ndsPrice: 22,
      price: 31,
      description: 'Employee education on drug-free workplace policies',
      duration: '30 minutes',
      certificate: true,
    },
  ],
  advanced: [
    {
      name: 'DOT Urine Specimen Collector Train the Trainer',
      ndsPrice: 1750,
      price: 2450,
      description: 'Become a qualified trainer for DOT urine collectors',
      duration: '2 days',
      certificate: true,
    },
    {
      name: 'Drug Testing Start-Up Overview',
      ndsPrice: 99,
      price: 139,
      description: 'Learn how to start and operate a drug testing business',
      duration: '2 hours',
      certificate: true,
    },
  ],
};

export default async function DrugTestingTrainingPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing Training" }]} />
      </div>
{/* Hero */}
      <section className="bg-white text-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Drug Testing Training Courses
            </h1>
            <p className="text-xl text-brand-blue-100 mb-8 max-w-3xl mx-auto">
              Professional training for DOT and non-DOT drug testing. Collector
              training, supervisor training, DER training, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/support"
                className="inline-block px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-bold hover:bg-brand-blue-50"
              >
                Call Visit Support Center
              </a>
              <Link
                href="/contact"
                className="inline-block px-8 py-4 bg-brand-blue-700 text-white rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white"
              >
                Request Information
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Training
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Certified Training</h3>
              <p className="text-sm text-black">
                All courses include certificate of completion
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Expert Instructors</h3>
              <p className="text-sm text-black">
                Learn from industry professionals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="font-bold mb-2">DOT Compliant</h3>
              <p className="text-sm text-black">
                Meets all federal requirements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="font-bold mb-2">Self-Paced</h3>
              <p className="text-sm text-black">
                Complete training on your schedule
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Collector Training */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-8">
            Specimen Collector Training
          </h2>
          <p className="text-black mb-8">
            Become a qualified DOT or non-DOT specimen collector. Required for
            anyone performing drug test collections.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {trainingCourses.collector.map((course: any) => (
              <div
                key={course.name}
                className={`bg-white border-2 rounded-lg p-6 ${course.popular ? 'border-brand-blue-500' : course.new ? 'border-brand-blue-500' : 'border-gray-200'}`}
              >
                <div className="flex gap-2 mb-3">
                  {course.popular && (
                    <div className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-2 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  {course.new && (
                    <div className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-2 rounded-full">
                      NEW
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-black text-sm mb-3">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mb-4 text-sm text-black">
                  <span>⏱️ {course.duration}</span>
                  {course.certificate && <span>📜 Certificate</span>}
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-4">
                  ${course.price}
                </div>
                <a
                  href="/support"
                  className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supervisor Training */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-8">Supervisor Training</h2>
          <p className="text-black mb-8">
            Required training for supervisors who make reasonable suspicion
            determinations. DOT requires 60 minutes of training.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {trainingCourses.supervisor.map((course: any) => (
              <div
                key={course.name}
                className={`bg-white border-2 rounded-lg p-6 ${course.popular ? 'border-brand-blue-500' : 'border-gray-200'}`}
              >
                {course.popular && (
                  <div className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-2 rounded-full inline-block mb-3">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-black text-sm mb-3">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mb-4 text-sm text-black">
                  <span>⏱️ {course.duration}</span>
                  {course.certificate && <span>📜 Certificate</span>}
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-4">
                  ${course.price}
                </div>
                <a
                  href="/support"
                  className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DER Training */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-8">
            Designated Employer Representative (DER) Training
          </h2>
          <p className="text-black mb-8">
            Training for DERs who manage drug and alcohol testing programs.
            Learn DOT regulations, procedures, and compliance requirements.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {trainingCourses.der.map((course: any) => (
              <div
                key={course.name}
                className="bg-white border-2 border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-bold mb-2">{course.name}</h3>
                <p className="text-black text-sm mb-3">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mb-4 text-sm text-black">
                  <span>⏱️ {course.duration}</span>
                  {course.certificate && <span>📜 Certificate</span>}
                </div>
                <div className="text-2xl font-bold text-brand-blue-600 mb-4">
                  ${course.price}
                </div>
                <a
                  href="/support"
                  className="block w-full text-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700 text-sm"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employee Training */}
      <section className="py-16 bg-brand-blue-50">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold mb-8">Employee Training</h2>
          <p className="text-black mb-8">
            Educate employees on drug-free workplace policies, testing
            procedures, and their rights and responsibilities.
          </p>
          <div className="bg-white border-2 border-brand-blue-200 rounded-lg p-6 max-w-2xl">
            {trainingCourses.employee.map((course: any) => (
              <div key={course.name}>
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-black mb-3">{course.description}</p>
                <div className="flex items-center gap-4 mb-4 text-sm text-black">
                  <span>⏱️ {course.duration}</span>
                  {course.certificate && <span>📜 Certificate</span>}
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-4">
                  ${course.price}
                </div>
                <a
                  href="/support"
                  className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Training */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-8">Advanced Training</h2>
          <p className="text-black mb-8">
            Train-the-trainer programs and business development courses for drug
            testing professionals.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {trainingCourses.advanced.map((course: any) => (
              <div
                key={course.name}
                className="bg-white border-2 border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-black mb-3">{course.description}</p>
                <div className="flex items-center gap-4 mb-4 text-sm text-black">
                  <span>⏱️ {course.duration}</span>
                  {course.certificate && <span>📜 Certificate</span>}
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-4">
                  ${course.price}
                </div>
                <a
                  href="/support"
                  className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Training Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Enroll in Course</h3>
                <p className="text-black">
                  Call Visit Support Center to enroll. We'll set up your account and
                  provide access.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Complete Training</h3>
                <p className="text-black">
                  Self-paced online training. Complete modules at your
                  convenience.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Pass Assessment</h3>
                <p className="text-black">
                  Complete quizzes and final assessment to demonstrate
                  knowledge.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Complete Mocks (If Required)
                </h3>
                <p className="text-black">
                  For collector training, complete 5 error-free mock collections
                  via webcam.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Receive Certificate</h3>
                <p className="text-black">
                  Download your certificate of completion immediately upon
                  finishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Certified?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Contact us to enroll in training or get answers to your questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-bold hover:bg-brand-blue-50"
            >
              <Phone className="w-5 h-5" />
              Call Visit Support Center
            </a>
            <Link
              href="/contact"
              className="inline-block px-8 py-4 bg-brand-blue-700 text-white rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white"
            >
              Email Us
            </Link>
          </div>
          <p className="mt-8 text-brand-blue-100">
            <strong>Address:</strong> 8888 Keystone Xing, Suite 1300,
            Indianapolis, IN 46240
          </p>
        </div>
      </section>
    </div>
  );
}
