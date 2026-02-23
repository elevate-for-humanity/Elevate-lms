import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Elevate Apps | Elevate for Humanity',
  description: 'Installable apps for students, instructors, employers, and administrators.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pwa' },
};

const APPS = [
  {
    name: 'Student LMS',
    desc: 'Courses, progress tracking, and credentials',
    href: '/pwa/student',
    image: '/images/programs-hq/students-learning.jpg',
    tags: ['Courses', 'Progress', 'Credentials'],
  },
  {
    name: 'Admin Dashboard',
    desc: 'Manage users, applications, programs, and operations',
    href: '/pwa/admin',
    image: '/images/heroes-hq/about-hero.jpg',
    tags: ['Users', 'Applications', 'Programs'],
  },
  {
    name: 'Enrollment Center',
    desc: 'Apply, track status, and complete enrollment',
    href: '/pwa/enrollment',
    image: '/images/heroes-hq/success-hero.jpg',
    tags: ['Apply', 'Track Status', 'Funding'],
  },
  {
    name: 'Instructor Portal',
    desc: 'Manage courses, students, and grading',
    href: '/pwa/instructor',
    image: '/images/programs-hq/training-classroom.jpg',
    tags: ['Courses', 'Students', 'Grading'],
  },
  {
    name: 'Employer Portal',
    desc: 'Hire trained graduates and manage placements',
    href: '/pwa/employer',
    image: '/images/heroes-hq/employer-hero.jpg',
    tags: ['Hire', 'Candidates', 'Placements'],
  },
  {
    name: 'Elevate Store',
    desc: 'Training materials, toolkits, and licenses',
    href: '/pwa/store',
    image: '/images/heroes-hq/programs-hero.jpg',
    tags: ['Products', 'Toolkits', 'Licenses'],
  },
  {
    name: 'Barber Apprentice',
    desc: 'Track hours, access training, monitor progress',
    href: '/pwa/barber',
    image: '/images/programs-hq/barber-hero.jpg',
    tags: ['Log Hours', 'Training', 'Progress'],
  },
  {
    name: 'Shop Partner',
    desc: 'Manage apprentices, approve hours, view reports',
    href: '/pwa/shop-owner',
    image: '/images/programs-hq/barber-training.jpg',
    tags: ['Apprentices', 'Approve Hours', 'Reports'],
  },
];

export default function PWAIndexPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 px-6 pt-16 pb-8 text-center">
        <div className="w-20 h-20 bg-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg overflow-hidden">
          <Image src="/logo.png" alt="Elevate" width={48} height={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Elevate Apps</h1>
        <p className="text-slate-400">Choose your app to get started</p>
      </header>

      <main className="flex-1 px-4 py-6 space-y-3">
        {APPS.map((app) => (
          <Link key={app.href} href={app.href} className="block bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition-colors">
            <div className="flex items-center gap-4 p-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={app.image} alt={app.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{app.name}</h2>
                <p className="text-slate-400 text-sm">{app.desc}</p>
              </div>
              <span className="text-slate-500 text-lg">→</span>
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {app.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </main>

      <footer className="px-6 py-8 text-center">
        <p className="text-slate-500 text-sm mb-4">Part of the Elevate for Humanity platform</p>
        <Link href="/" className="text-slate-400 hover:text-white text-sm underline">Go to main website</Link>
      </footer>
    </div>
  );
}
