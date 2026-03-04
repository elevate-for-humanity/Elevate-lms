import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, MessageCircle, BookOpen, Clock, Lightbulb, Shield } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/ai-tutor' },
  title: 'AI Tutor | Elevate For Humanity',
  description: 'Get personalized learning support from our AI tutor. Available 24/7 to help with coursework, exam prep, and study questions.',
};

const FEATURES = [
  { title: '24/7 Availability', desc: 'Get help anytime — evenings, weekends, and holidays. No scheduling required.', icon: Clock },
  { title: 'Course-Specific Help', desc: 'The AI tutor understands your program curriculum and can answer questions about your specific coursework.', icon: BookOpen },
  { title: 'Exam Preparation', desc: 'Practice questions, concept explanations, and study strategies tailored to your certification exam.', icon: Lightbulb },
  { title: 'Conversational Learning', desc: 'Ask questions in plain language and get clear, step-by-step explanations.', icon: MessageCircle },
  { title: 'Safe & Private', desc: 'Your conversations are private. The AI tutor does not share your data with other students or third parties.', icon: Shield },
  { title: 'Supplement, Not Replace', desc: 'The AI tutor supports your learning alongside your instructor — it does not replace classroom instruction.', icon: Bot },
];

export default function AiTutorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'AI Tutor' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/images/pages/ai-tutor-page-1.jpg" alt="AI Tutor" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Tutor</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Personalized learning support available around the clock.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Access */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Access</h2>
          <p className="text-gray-600 mb-6">
            The AI Tutor is available to enrolled students through the student portal. Log in to start a conversation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login" className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition">Student Login</Link>
            <Link href="/programs" className="bg-white text-brand-blue-600 border border-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition">Browse Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
