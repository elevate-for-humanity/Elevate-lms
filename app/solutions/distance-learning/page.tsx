import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Wifi, Monitor, Clock, Shield, Users, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/solutions/distance-learning' },
  title: 'Distance Learning Solutions | Elevate For Humanity',
  description: 'Online and hybrid training delivery for workforce development programs. LMS, virtual classrooms, and remote assessment tools.',
};

const FEATURES = [
  { title: 'Virtual Classrooms', desc: 'Live instructor-led sessions with screen sharing, breakout rooms, and recording for students who miss class.', icon: Monitor },
  { title: 'Self-Paced Courses', desc: 'On-demand video lessons, reading materials, and interactive exercises students complete on their own schedule.', icon: Clock },
  { title: 'Online Assessments', desc: 'Quizzes, competency checks, and proctored exams delivered securely through the platform.', icon: Shield },
  { title: 'Discussion Forums', desc: 'Peer-to-peer learning through moderated discussion boards and group projects.', icon: Users },
  { title: 'Mobile Access', desc: 'Full platform access from any device — phone, tablet, or computer. No app download required.', icon: Wifi },
  { title: 'Digital Library', desc: 'Centralized access to textbooks, study guides, reference materials, and supplemental resources.', icon: BookOpen },
];

export default function DistanceLearningPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Solutions', href: '/solutions' }, { label: 'Distance Learning' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[300px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image src="/images/programs-hq/technology-hero.jpg" alt="Distance learning solutions" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Distance Learning</h1>
          <p className="text-lg md:text-xl text-gray-100">
            Deliver workforce training online, in-person, or hybrid — with the same quality and compliance.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">Platform Capabilities</h2>
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

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bring Your Programs Online</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">See how Elevate supports distance learning for workforce training providers.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Request a Demo</Link>
            <Link href="/store/licenses" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">View Licensing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
