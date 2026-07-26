import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ExternalLink, ChevronRight, Newspaper, Award, Users, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'News & Announcements',
  description: 'Latest news, announcements, and press releases from Elevate for Humanity. Stay informed about workforce development initiatives.',
};

const NEWS_ITEMS = [
  {
    id: 1,
    title: 'Elevate Partners with Indiana Workforce Board to Expand WIOA Training Programs',
    date: 'July 20, 2026',
    category: 'Partnership',
    excerpt: 'New partnership increases training capacity by 500 students annually across healthcare and trades programs.',
    content: 'Elevate for Humanity has announced a strategic partnership with the Indiana Workforce Development Board to expand access to WIOA-funded training programs...',
  },
  {
    id: 2,
    title: '1000th Student Graduates from Healthcare Certification Program',
    date: 'July 15, 2026',
    category: 'Milestone',
    excerpt: 'Milestone achievement as graduate lands Medical Assistant position at IU Health.',
    content: 'Elevate for Humanity celebrates a major milestone as our 1000th student graduates from the Healthcare Certification Program...',
  },
  {
    id: 3,
    title: 'DOL Approves New Registered Apprenticeship Programs',
    date: 'July 10, 2026',
    category: 'Certification',
    excerpt: 'New apprenticeship pathways in Barber, Cosmetology, and Esthetics receive federal approval.',
    content: 'The Department of Labor has approved three new registered apprenticeship programs...',
  },
  {
    id: 4,
    title: 'Workforce Ready Grant Extended Through 2027',
    date: 'June 28, 2026',
    category: 'Funding',
    excerpt: 'Indiana Governor extends workforce training funding program.',
    content: 'Governor Holcomb has announced the continuation of the Workforce Ready Grant through December 2027...',
  },
];

const PRESS_RELEASES = [
  { title: 'Elevate Opens New Training Center in Fort Wayne', date: 'June 15, 2026' },
  { title: 'Partnership with WorkOne Expands Career Services', date: 'May 22, 2026' },
  { title: 'Launch of AI-Powered Career Assessment Tool', date: 'April 10, 2026' },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Announcements</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Stay informed about Elevate for Humanity's latest initiatives, partnerships, and workforce development news.
          </p>
        </div>
      </section>

      {/* Featured News */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Featured Article */}
            <div className="lg:col-span-2">
              <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-brand-blue-700 text-white p-8">
                  <span className="inline-block px-3 py-1 bg-white/20 text-sm font-medium rounded-full mb-4">
                    {NEWS_ITEMS[0].category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{NEWS_ITEMS[0].title}</h2>
                  <div className="flex items-center gap-4 text-blue-200 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {NEWS_ITEMS[0].date}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-lg text-slate-600 mb-6">{NEWS_ITEMS[0].excerpt}</p>
                  <p className="text-slate-700 mb-6">{NEWS_ITEMS[0].content}</p>
                  <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700">
                    Contact for More Information <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-brand-blue-600" />
                  Latest Updates
                </h3>
                <div className="space-y-4">
                  {NEWS_ITEMS.slice(1).map((item) => (
                    <article key={item.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <span className="text-xs text-brand-blue-600 font-medium">{item.category}</span>
                      <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-2">{item.title}</h4>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </article>
                  ))}
                </div>
              </div>

              {/* Press Contact */}
              <div className="bg-slate-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Press Contact</h3>
                <p className="text-slate-600 text-sm mb-4">
                  For media inquiries, interview requests, or press information:
                </p>
                <Link href="/contact" className="text-brand-blue-600 font-semibold text-sm hover:underline">
                  media@elevateforhumanity.org
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Press Releases</h2>
          <div className="space-y-4">
            {PRESS_RELEASES.map((release, index) => (
              <article key={index} className="bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-500 mb-1 block">{release.date}</span>
                    <h3 className="font-semibold text-slate-900">{release.title}</h3>
                  </div>
                  <Link href="/contact" className="text-brand-blue-600 hover:text-brand-blue-700">
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Media Resources */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Media Resources</h2>
          <p className="text-blue-200 mb-8">
            Download our brand guidelines, logos, and high-resolution photos for media use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
              <Building2 className="w-5 h-5" />
              Brand Assets
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors">
              <Users className="w-5 h-5" />
              Media Kit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
