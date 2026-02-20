import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Video, Calendar, Clock, Users, Play, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Webinars | Elevate For Humanity',
  description: 'Join live webinars and watch recordings on career development, industry trends, and skill building.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/webinars',
  },
};

const upcomingWebinars = [
  { title: 'Healthcare Career Paths in 2026', date: 'Feb 15, 2026', time: '2:00 PM EST', host: 'Dr. Sarah Johnson', attendees: 156 },
  { title: 'Resume Writing Workshop', date: 'Feb 18, 2026', time: '1:00 PM EST', host: 'Career Services Team', attendees: 89 },
  { title: 'WIOA Funding Explained', date: 'Feb 22, 2026', time: '11:00 AM EST', host: 'Funding Department', attendees: 234 },
];

const pastWebinars = [
  { title: 'Getting Started with CDL Training', views: 1250, duration: '45 min' },
  { title: 'Interview Tips for Healthcare Jobs', views: 890, duration: '38 min' },
  { title: 'Understanding Your Benefits', views: 567, duration: '52 min' },
];

export default function WebinarsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Webinars' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/how-it-works-hero.jpg" alt="Webinars" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Live Webinars</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Learn from experts, ask questions, and connect with the community</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Upcoming Webinars</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingWebinars.map((webinar, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center gap-2 text-brand-red-600 text-sm font-medium mb-3">
                  <Calendar className="w-4 h-4" /> {webinar.date}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{webinar.title}</h3>
                <p className="text-gray-600 text-sm mb-4">Hosted by {webinar.host}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {webinar.time}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {webinar.attendees}</span>
                </div>
                <button className="w-full py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" /> Register
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Past Recordings</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pastWebinars.map((webinar, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border hover:shadow-md transition-all cursor-pointer">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{webinar.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{webinar.views.toLocaleString()} views</span>
                  <span>{webinar.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
