/**
 * @legacy Static healthcare course landing page.
 * This page is NOT DB-driven. It predates the DB-driven course engine.
 * Do not add new static course pages inside app/lms/. All new courses must
 * be DB-driven and accessible via /lms/courses/[courseId].
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Clock,
  Award,
  Users,
  ArrowRight,
  Video,
  FileText,
  Star,
  Calendar,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Healthcare Fundamentals Course | LMS | Elevate For Humanity',
  description:
    'Learn healthcare fundamentals with our comprehensive online course. 4-6 weeks, beginner-friendly, earn your certificate.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/courses/healthcare-fundamentals',
  },
};

export default function HealthcareFundamentalsCoursePage() {

  const courseFeatures = [
    {
      icon: Video,
      title: '40+ Video Lessons',
      description: 'High-quality instructional videos',
    },
    {
      icon: FileText,
      title: 'Downloadable Resources',
      description: 'Study guides, worksheets, and references',
    },
    {
      icon: Users,
      title: 'Discussion Forums',
      description: 'Connect with classmates and instructors',
    },
    {
      icon: Award,
      title: 'Certificate of Completion',
      description: 'Industry-recognized credential',
    },
  ];

  const curriculum = [
    {
      module: 'Module 1',
      title: 'Introduction to Healthcare',
      lessons: 8,
      duration: '2 hours',
    },
    {
      module: 'Module 2',
      title: 'Medical Terminology',
      lessons: 10,
      duration: '3 hours',
    },
    {
      module: 'Module 3',
      title: 'Anatomy & Physiology Basics',
      lessons: 12,
      duration: '4 hours',
    },
    {
      module: 'Module 4',
      title: 'Patient Care Fundamentals',
      lessons: 10,
      duration: '3 hours',
    },
    {
      module: 'Module 5',
      title: 'Infection Control & Safety',
      lessons: 8,
      duration: '2 hours',
    },
    {
      module: 'Module 6',
      title: 'Healthcare Documentation',
      lessons: 6,
      duration: '2 hours',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'LMS', href: '/lms' }, { label: 'Courses', href: '/lms' }, { label: 'Healthcare Fundamentals' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-brand-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6">
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-bold">Beginner Level</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Healthcare Fundamentals
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Master the essential knowledge and skills needed to begin your
                healthcare career
              </p>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>4-6 weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Instructor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">4.9</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/start"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors shadow-2xl"
                >
                  Enroll Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/lms/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  Access Course (Login)
                </Link>
              </div>
            </div>

            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <Image
                src="/images/pages/lms-page-5.jpg"
                alt="Healthcare Fundamentals Course"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h2 className="text-4xl font-black text-black mb-6">
              Course Overview
            </h2>
            <div className="prose prose-lg max-w-none text-black">
              <p className="text-xl mb-6">
                This comprehensive course provides a solid foundation in
                healthcare fundamentals, preparing you for entry-level positions
                in the healthcare industry or further specialized training.
              </p>
              <p className="text-lg mb-6">
                You'll learn essential medical terminology, basic anatomy and
                physiology, patient care principles, infection control
                procedures, and healthcare documentation practices. The course
                combines video lessons, interactive quizzes, and practical
                exercises to ensure you master the material.
              </p>
              <p className="text-lg">
                Upon completion, you'll receive a certificate and be prepared to
                pursue certifications such as CNA (Certified Nursing Assistant),
                Medical Assistant, or other healthcare roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            What's Included
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courseFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200"
                >
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-black text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Course Curriculum
          </h2>

          <div className="max-w-4xl mx-auto space-y-4">
            {curriculum.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-black">
                    {item.module}: {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-black">
                    <span>{item.lessons} lessons</span>
                    <span>{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-black">
              <strong>Total:</strong> 54 lessons • 16 hours of content
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            What You'll Learn
          </h2>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">
                  Medical Terminology
                </h3>
                <p className="text-black text-sm">
                  Understand and use common medical terms and abbreviations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">Anatomy Basics</h3>
                <p className="text-black text-sm">
                  Learn body systems and their functions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">Patient Care</h3>
                <p className="text-black text-sm">
                  Master fundamental patient care techniques
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">Infection Control</h3>
                <p className="text-black text-sm">
                  Understand and apply infection prevention protocols
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">Documentation</h3>
                <p className="text-black text-sm">
                  Learn proper healthcare documentation practices
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-black mb-1">Safety Procedures</h3>
                <p className="text-black text-sm">
                  Understand workplace safety and emergency protocols
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Your Instructor
          </h2>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-32 h-32 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-16 h-16 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black mb-2">
                  Instructor, RN, BSN
                </h3>
                <p className="text-black mb-4">
                  Dr. Johnson has over 15 years of experience in healthcare
                  education and clinical practice. She has trained hundreds of
                  healthcare professionals and is passionate about helping
                  students succeed in their healthcare careers.
                </p>
                <div className="flex items-center gap-2 text-sm text-black">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">4.9 instructor rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            Ready to Start Your Healthcare Career?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Enroll now and begin learning today — funded for eligible participants
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-10 py-5 rounded-xl text-lg font-black shadow-2xl hover:bg-white transition-all"
            >
              Enroll Now
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              href="/lms/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-10 py-5 rounded-xl text-lg font-black hover:bg-white/10 transition-all"
            >
              View All Courses
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            Questions? Contact us at (317) 314-3757
          </p>
        </div>
      </section>
    </div>
  );
}
