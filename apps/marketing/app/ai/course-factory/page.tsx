import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Sparkles, FileText, CheckCircle, Clock, Award, Users, Zap, Video, FileQuestion, GraduationCap } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Course Factory | AI-Powered Curriculum Generation',
  description: 'Build credential-aligned curriculum for healthcare, trades, and workforce programs in minutes. AI-assisted lesson generation, quiz creation, and video scripting.',
};

const features = [
  {
    icon: Sparkles,
    title: 'AI Lesson Generation',
    description: 'Generate comprehensive lessons from topic outlines. AI creates content aligned to industry standards and credentials.',
  },
  {
    icon: Video,
    title: 'Video Scripting',
    description: 'Auto-generate video scripts for each lesson. Include key points, demonstrations, and assessments.',
  },
  {
    icon: FileQuestion,
    title: 'Quiz Builder',
    description: 'Create quizzes, practice exams, and assessments automatically. Multiple choice, true/false, and scenario-based questions.',
  },
  {
    icon: FileText,
    title: 'Blueprint Library',
    description: 'Access pre-built curriculum blueprints for HVAC, Healthcare, Barber, CDL, OSHA, and more.',
  },
  {
    icon: Award,
    title: 'Credential Alignment',
    description: 'Align curriculum to certifications and credentials. NHA, NCCER, EPA 608, and industry standards.',
  },
  {
    icon: Clock,
    title: 'Fast Production',
    description: 'Build complete courses in hours, not months. AI accelerates curriculum development by 10x.',
  },
];

const programs = [
  { name: 'Healthcare', programs: ['Medical Assistant', 'CNA', 'Phlebotomy', 'EKG', 'Pharmacy Tech'] },
  { name: 'Trades', programs: ['HVAC', 'Electrical', 'Plumbing', 'CDL', 'Welding'] },
  { name: 'Beauty', programs: ['Barber', 'Cosmetology', 'Esthetics', 'Nail Tech'] },
  { name: 'Safety', programs: ['OSHA 10/30', 'EPA 608', 'First Aid/CPR', 'CareerSafe'] },
];

const credentials = [
  'NHA Certifications',
  'NCCER Credentials',
  'EPA 608 Universal',
  'OSHA Safety',
  'State Board Licenses',
  'Industry Certifications',
];

export default function CourseFactoryPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-sm mb-6">
              <GraduationCap className="w-4 h-4" />
              AI Curriculum Generation
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Course Factory
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Build credential-aligned curriculum for healthcare, trades, and workforce programs 
              in minutes. AI-powered lesson generation, quiz creation, and video scripting.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={getAdminUrl("/studio/courses/create")} className="px-8 py-4 bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-500 transition">
                Create a Course
              </a>
              <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Build Courses 10x Faster</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Course Factory uses AI to generate comprehensive curriculum aligned to industry credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Supported Programs</h2>
            <p className="text-slate-600">Curriculum blueprints for in-demand career pathways</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((group) => (
              <div key={group.name} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">{group.name}</h3>
                <ul className="space-y-2">
                  {group.programs.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Credential-Aligned Curriculum</h2>
              <p className="text-slate-600 mb-8">
                Every course generated by Course Factory is aligned to industry-recognized credentials 
                and certifications. Students graduate ready for certification exams.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {credentials.map((cred) => (
                  <div key={cred} className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">{cred}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-emerald-600" />
                <span className="text-xl font-bold">Course Pipeline</span>
              </div>
              <div className="space-y-4">
                {['Draft', 'In Review', 'Published', 'Live'].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <span className={`font-medium ${i === 3 ? 'text-emerald-700' : 'text-slate-600'}`}>{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Building Curriculum Today</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Create credential-aligned courses in minutes, not months.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={getAdminUrl("/studio/courses/create")} className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition">
              Create Your First Course
            </a>
            <Link href="/ai/course-factory" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              View Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
