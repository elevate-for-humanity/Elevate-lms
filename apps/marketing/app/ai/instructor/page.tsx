import { Metadata } from 'next';
import Link from 'next/link';
import { Brain, MessageSquare, BookOpen, Clock, Users, CheckCircle, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Instructor | 24/7 Personalized Learning Support',
  description: 'AI-powered tutoring for every student, 24/7. Personalized learning assistance, instant feedback, and adaptive instruction powered by Claude AI.',
};

const features = [
  { icon: Brain, title: 'Adaptive Learning', desc: 'AI adjusts difficulty and pace based on student performance.' },
  { icon: Clock, title: '24/7 Availability', desc: 'Students get help anytime, day or night.' },
  { icon: MessageSquare, title: 'Natural Conversations', desc: 'Students ask questions naturally. AI explains concepts in multiple ways.' },
  { icon: BookOpen, title: 'Curriculum Aligned', desc: 'AI instructor knows your specific curriculum, lessons, and assessments.' },
  { icon: Users, title: 'Multimodal Support', desc: 'Text, explanations, examples, and step-by-step guidance.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Track which concepts students struggle with.' },
];

export default function AIInstructorPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-400/30 rounded-full text-sm mb-6">
                <Brain className="w-4 h-4" />
                AI-Powered Tutoring
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">AI Instructor</h1>
              <p className="text-xl text-slate-300 mb-8">
                24/7 personalized learning support for every student. 
                AI-powered tutoring that adapts to individual needs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="https://app.elevateforhumanity.org/ai-tutor" className="px-8 py-4 bg-violet-600 rounded-lg font-semibold hover:bg-violet-500 transition">
                  Try AI Instructor
                </Link>
                <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                  See Demo
                </Link>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-6">
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4 text-sm">
                  <p>Can you explain systolic vs diastolic blood pressure?</p>
                </div>
                <div className="bg-violet-600/30 rounded-lg p-4 text-sm">
                  <p><strong>Systolic</strong> (top number): When heart squeezes.</p>
                  <p><strong>Diastolic</strong> (bottom number): When heart relaxes.</p>
                  <p className="mt-2">Normal: Below 120/80 mmHg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Intelligent Tutoring at Scale</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Give every student a personal tutor.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <Icon className="w-8 h-8 text-violet-600 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Every Student Deserves a Great Tutor</h2>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link href="https://app.elevateforhumanity.org/ai-tutor" className="px-8 py-4 bg-white text-violet-600 rounded-lg font-semibold hover:bg-violet-50 transition">
              Try AI Instructor
            </Link>
            <Link href="/platform/enterprise" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Enterprise Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
