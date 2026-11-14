import { Metadata } from 'next';
import Link from 'next/link';
import { Play, Calendar, Users, Video, ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Webinars | Elevate for Humanity',
  description: 'Join our free webinars to learn about workforce training, career pathways, and funding options.',
};

const upcomingWebinars = [
  {
    title: 'Navigating WIOA Funding for Your Career',
    date: 'Every Tuesday at 2:00 PM ET',
    duration: '45 minutes',
    description: 'Learn how WIOA funding can cover your training costs and how to apply.',
    topics: ['WIOA eligibility requirements', 'Application process', 'Covered programs'],
  },
  {
    title: 'Career Pathways in Healthcare',
    date: 'Every Wednesday at 11:00 AM ET',
    duration: '60 minutes',
    description: 'Explore the various healthcare careers and the training required for each.',
    topics: ['Medical Assistant', 'Phlebotomy', 'Patient Care Tech'],
  },
  {
    title: 'Apprenticeship vs. Traditional Training',
    date: 'Every Thursday at 3:00 PM ET',
    duration: '45 minutes',
    description: 'Compare apprenticeship programs with traditional classroom training.',
    topics: ['On-the-job learning', 'Salary during training', 'Credential outcomes'],
  },
];

const pastWebinars = [
  { title: 'Introduction to Elevate Programs', date: 'View Recording' },
  { title: 'Funding Your Education with Pell Grants', date: 'View Recording' },
  { title: 'Healthcare Career Expo Recap', date: 'View Recording' },
  { title: 'Building Your Resume for Trade Jobs', date: 'View Recording' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Free Events</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Webinars & Events</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Join our free webinars to learn about workforce training, career pathways, and funding options. No commitment required.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Upcoming Webinars</h2>
            <p className="text-xl text-slate-600">Register for an upcoming session or watch past recordings</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {upcomingWebinars.map((webinar, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-brand-blue-600 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5" />
                    <span className="text-sm font-medium">Live Webinar</span>
                  </div>
                  <h3 className="text-xl font-bold">{webinar.title}</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{webinar.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{webinar.duration}</span>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">{webinar.description}</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm font-semibold text-slate-700">What you'll learn:</p>
                    <ul className="space-y-1">
                      {webinar.topics.map((topic, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="w-full bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                    Register Free
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Watch Past Webinars</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pastWebinars.map((webinar, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{webinar.title}</h4>
                      <p className="text-sm text-slate-500">{webinar.date}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Want to Host a Private Webinar?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">We can create custom webinars for your organization, workforce board, or community group.</p>
            <Link href="/contact" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
