import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  Settings, 
  GraduationCap, 
  Users, 
  ArrowRight, 
  Play,
  Lock,
  CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Demo Center | Elevate LMS Platform',
  description: 'Explore the Elevate LMS platform through guided demos. See admin, instructor, and student experiences before you buy.',
};

const DEMO_PATHS = [
  {
    id: 'admin',
    title: 'Admin Demo',
    icon: Settings,
    color: 'blue',
    description: 'See how administrators manage the platform, users, and reporting.',
    canDo: [
      'View organization dashboard',
      'Browse user management interface',
      'Explore reporting and analytics',
      'See compliance tracking tools',
      'Review enrollment workflows',
      'Check system settings',
    ],
    locked: [
      'Create real users or data',
      'Modify system configuration',
      'Access production databases',
      'Export real reports',
    ],
    href: '/store/demo/admin',
  },
  {
    id: 'instructor',
    title: 'Instructor Demo',
    icon: GraduationCap,
    color: 'purple',
    description: 'Experience the instructor view for course management and student tracking.',
    canDo: [
      'Browse course builder interface',
      'View assessment creation tools',
      'See gradebook and progress tracking',
      'Explore certificate templates',
      'Review student communication tools',
      'Check attendance tracking',
    ],
    locked: [
      'Create real courses',
      'Grade actual students',
      'Issue real certificates',
      'Send live communications',
    ],
    href: '/store/demo/instructor',
  },
  {
    id: 'student',
    title: 'Student Demo',
    icon: Users,
    color: 'green',
    description: 'Walk through the student experience from enrollment to certification.',
    canDo: [
      'View student dashboard',
      'Browse course catalog',
      'See lesson player interface',
      'Explore progress tracking',
      'View certificate display',
      'Check mobile PWA experience',
    ],
    locked: [
      'Enroll in real courses',
      'Submit actual assignments',
      'Earn real credentials',
      'Access paid content',
    ],
    href: '/store/demo/student',
  },
];

export default function DemoCenterPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Demo" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold mb-6">
            <Play className="w-4 h-4" />
            Interactive Demos
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Demo Center
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Explore the Elevate LMS platform from every perspective. 
            See exactly what you're getting before you commit.
          </p>
        </div>
      </section>

      {/* Demo Paths */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {DEMO_PATHS.map((demo) => {
              const Icon = demo.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                purple: 'bg-blue-100 text-blue-600 border-blue-200',
                green: 'bg-green-100 text-green-600 border-green-200',
              };
              const btnClasses = {
                blue: 'bg-blue-600 hover:bg-blue-700',
                purple: 'bg-blue-600 hover:bg-blue-700',
                green: 'bg-green-600 hover:bg-green-700',
              };
              
              return (
                <div key={demo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className={`p-6 ${colorClasses[demo.color as keyof typeof colorClasses]} border-b`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-8 h-8" />
                      <h2 className="text-2xl font-bold text-slate-900">{demo.title}</h2>
                    </div>
                    <p className="text-slate-600">{demo.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      What You Can Do
                    </h3>
                    <ul className="space-y-2 mb-6">
                      {demo.canDo.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-slate-400" />
                      Locked Until Onboarding
                    </h3>
                    <ul className="space-y-2 mb-6">
                      {demo.locked.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      href={demo.href}
                      className={`block w-full text-center text-white py-3 rounded-lg font-bold ${btnClasses[demo.color as keyof typeof btnClasses]} transition-colors`}
                    >
                      Start {demo.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            How Demos Work
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Choose a Role', desc: 'Select admin, instructor, or student perspective.' },
              { step: 2, title: 'Explore Features', desc: 'Click through real interfaces with sample data.' },
              { step: 3, title: 'Decide & Buy', desc: 'When ready, start your managed platform setup.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            After exploring the demos, set up your managed platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/licenses/managed"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
            >
              Start License Setup
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store/guides/licensing"
              className="inline-flex items-center justify-center gap-2 bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-900 transition-colors"
            >
              Read Licensing Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
