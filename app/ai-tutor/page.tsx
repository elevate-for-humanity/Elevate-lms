import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { PolicyReference } from '@/components/compliance/PolicyReference';
import { POLICIES } from '@/lib/policies';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ai-tutor',
  },
  title: 'Ai Tutor | Elevate For Humanity',
  description:
    'Get personalized learning support from AI tutoring.',
};

export default async function AiTutorPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch AI tutor settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'ai_tutor')
    .single();
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Ai Tutor" }]} />
      </div>
{/* Hero Banner */}
      <ModernLandingHero
        badge="AI-Powered Learning"
        headline="Your Personal AI"
        accentText="Tutor"
        subheadline="24/7 Learning Support Powered by Artificial Intelligence"
        description="Get instant answers to your questions, personalized study help, and guided learning support anytime, anywhere. Our AI Tutor uses advanced language models to provide clear explanations, practice problems, and step-by-step guidance tailored to your learning style. Whether you're studying for certifications, learning new skills, or need homework help, your AI Tutor is always available."
        imageSrc="/images/business/professional-2.jpg"
        imageAlt="AI Tutor Learning Support"
        primaryCTA={{ text: "Start Learning Now", href: "/apply" }}
        secondaryCTA={{ text: "See How It Works", href: "#features" }}
        features={[
          "24/7 instant answers • Personalized explanations",
          "Practice problems and quizzes • Study guides",
          "Multi-subject support • Progress tracking"
        ]}
        imageOnRight={true}
      />

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-black mb-4">How AI Tutor Helps You Learn</h2>
              <p className="text-xl text-black max-w-3xl mx-auto">
                Advanced AI technology provides personalized learning support tailored to your needs
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="w-16 h-16 mb-4">
                  <Image src="/images/icons/book.png" alt="Instant Answers" width={64} height={64} />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Instant Answers</h3>
                <p className="text-black leading-relaxed">
                  Get immediate responses to your questions on any subject. No waiting for office hours or email replies.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <div className="w-16 h-16 mb-4">
                  <Image src="/images/icons/users.png" alt="Personalized Learning" width={64} height={64} />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Personalized Learning</h3>
                <p className="text-black leading-relaxed">
                  AI adapts to your learning style and pace, providing explanations that match your level of understanding.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <div className="w-16 h-16 mb-4">
                  <Image src="/images/icons/clock.png" alt="24/7 Availability" width={64} height={64} />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">24/7 Availability</h3>
                <p className="text-black leading-relaxed">
                  Study anytime, anywhere. Your AI Tutor is always available, even at 2 AM before your exam.
                </p>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl font-bold text-black mb-6">
                  What You Can Do With AI Tutor
                </h2>
                <p className="text-black mb-6 text-lg">
                  Your AI Tutor is a powerful learning companion that helps you master new skills, prepare for certifications, and succeed in your training programs.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Ask Questions:</strong> Get clear explanations on any topic in your coursework</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Practice Problems:</strong> Generate unlimited practice questions with step-by-step solutions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Study Guides:</strong> Create custom study materials for exams and certifications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Concept Review:</strong> Break down complex topics into easy-to-understand explanations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Exam Prep:</strong> Prepare for certification exams with targeted practice and review</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-1" />
                    <span className="text-black"><strong>Progress Tracking:</strong> Monitor your learning progress and identify areas for improvement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/heroes/training-provider-1.jpg"
                  alt="Ai Tutor"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Learn</h3>
                <p className="text-black">
                  Access quality training programs
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Certify</h3>
                <p className="text-black">Earn industry certifications</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Work</h3>
                <p className="text-black">Get hired in your field</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Join thousands who have launched successful careers through our
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
