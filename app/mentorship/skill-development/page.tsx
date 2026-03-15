
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Wrench, ArrowRight, BookOpen, Target, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Skill Development Mentorship | Elevate for Humanity',
  description: 'Develop new skills with guidance from experienced mentors. Get hands-on coaching to accelerate your learning.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/skill-development' },
};

export default function SkillDevelopmentPage() {

  const skills = [
    { category: 'Technical Skills', examples: ['Industry certifications', 'Software proficiency', 'Trade skills'] },
    { category: 'Soft Skills', examples: ['Communication', 'Leadership', 'Problem-solving'] },
    { category: 'Professional Skills', examples: ['Time management', 'Project management', 'Client relations'] },
  ];

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Skill Development" }]} />
      </div>
<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Skill Development</span>
          </nav>
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/mentorship-page-4.jpg" alt="Skill Development" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Skills We Help Develop</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {skills.map((skill, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{skill.category}</h3>
                <ul className="space-y-3">
                  {skill.examples.map((example, j) => (
                    <li key={j} className="flex items-center">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-gray-700">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Personalized Learning Plans</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Your mentor will work with you to identify skill gaps and create a customized development plan that fits your goals and schedule.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Target className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Goal Setting</h3>
              <p className="text-sm text-gray-600">Define clear, achievable objectives</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <BookOpen className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Guided Practice</h3>
              <p className="text-sm text-gray-600">Learn by doing with expert feedback</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Award className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Track Progress</h3>
              <p className="text-sm text-gray-600">Measure and celebrate your growth</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-green-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Building Your Skills</h2>
          <p className="text-xl text-brand-green-100 mb-8">Get matched with a mentor who can help you grow.</p>
          <Link href="/start" className="bg-white hover:bg-white text-brand-green-700 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
