import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Video, FileText, Download, Headphones, Monitor } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/training/learning-center' },
  title: 'Learning Center | Elevate For Humanity',
  description: 'Access study materials, video tutorials, practice exams, and supplemental resources for your training program.',
};

const RESOURCES = [
  { title: 'Video Tutorials', desc: 'Step-by-step video lessons covering key concepts in your program area.', icon: Video },
  { title: 'Study Guides', desc: 'Downloadable study guides and reference sheets for certification exam preparation.', icon: FileText },
  { title: 'Practice Exams', desc: 'Timed practice tests that simulate the format and difficulty of your certification exam.', icon: Monitor },
  { title: 'Course Materials', desc: 'Textbook chapters, lecture notes, and supplemental readings organized by program.', icon: BookOpen },
  { title: 'Audio Resources', desc: 'Podcast-style lessons and audio study aids for learning on the go.', icon: Headphones },
  { title: 'Downloadable Forms', desc: 'Enrollment forms, financial aid applications, and program-specific documents.', icon: Download },
];

export default function LearningCenterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Training', href: '/training' }, { label: 'Learning Center' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[300px] md:h-[350px] flex items-center justify-center text-white overflow-hidden">
        <Image src="/images/artlist/hero-training-2.jpg" alt="Learning center resources" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-white/80" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Learning Center</h1>
          <p className="text-lg text-gray-100">Study materials, practice exams, and resources to support your training.</p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{r.title}</h3>
                  <p className="text-gray-600 text-sm">{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Access Note */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enrolled Students</h2>
          <p className="text-gray-600 mb-6">
            Full access to learning center resources is available through your student portal after enrollment. Log in to access your program-specific materials.
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
