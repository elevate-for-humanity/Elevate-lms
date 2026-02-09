export const dynamic = 'force-static';
export const revalidate = 86400;

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Success Stories | Graduate Testimonials | Elevate for Humanity',
  description: 'Read inspiring stories from our graduates who transformed their careers through apprenticeship training. Real people, real results, real careers.',
  alternates: { canonical: `${SITE_URL}/success-stories` },
  openGraph: {
    title: 'Success Stories | Elevate for Humanity',
    description: 'Read inspiring stories from our graduates who transformed their careers through apprenticeship training.',
    url: `${SITE_URL}/success-stories`,
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
};

const SUCCESS_STORIES = [
  {
    name: "Marcus Johnson",
    program: "Barber Apprenticeship",
    image: "/images/testimonials/marcus.jpg",
    quote: "I went from working minimum wage jobs to owning my own chair at a premium barbershop. The apprenticeship gave me real skills and real confidence.",
    outcome: "Now earning $65K+ annually",
    graduationYear: "2024",
  },
  {
    name: "Sarah Williams",
    program: "Healthcare Training",
    image: "/images/testimonials/sarah.jpg",
    quote: "The program fit around my schedule as a single mom. Within 6 months, I had my certification and a job offer.",
    outcome: "Medical Assistant at IU Health",
    graduationYear: "2024",
  },
  {
    name: "David Chen",
    program: "IT Apprenticeship",
    image: "/images/testimonials/david.jpg",
    quote: "No college degree, no problem. The hands-on training prepared me better than any classroom could have.",
    outcome: "Help Desk Technician, promoted twice",
    graduationYear: "2023",
  },
  {
    name: "Maria Rodriguez",
    program: "Skilled Trades",
    image: "/images/testimonials/maria.jpg",
    quote: "I was skeptical at first, but the support system here is incredible. They didn't just train me - they helped me succeed.",
    outcome: "HVAC Technician, union member",
    graduationYear: "2024",
  },
  {
    name: "James Thompson",
    program: "Barber Apprenticeship",
    image: "/images/testimonials/james.jpg",
    quote: "The digital hour tracking made everything transparent. I always knew exactly where I stood in my training.",
    outcome: "Licensed Barber, shop owner",
    graduationYear: "2023",
  },
  {
    name: "Ashley Brown",
    program: "Healthcare Training",
    image: "/images/testimonials/ashley.jpg",
    quote: "From unemployed to employed in under a year. This program changed my life and my family's future.",
    outcome: "CNA at Community Hospital",
    graduationYear: "2024",
  },
];

export default function SuccessStoriesPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[400px] bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h1>
            <p className="text-xl md:text-2xl opacity-90">Real people. Real results. Real careers.</p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Success Stories', href: '/success-stories' },
          ]}
        />
      </div>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600">500+</p>
              <p className="text-black mt-2">Graduates</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">92%</p>
              <p className="text-black mt-2">Employment Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">$45K</p>
              <p className="text-black mt-2">Avg Starting Salary</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">4.8/5</p>
              <p className="text-black mt-2">Student Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Graduates</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SUCCESS_STORIES.map((story, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
                    <span className="text-6xl">👤</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {story.program}
                    </span>
                    <span className="text-sm text-gray-500">{story.graduationYear}</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{story.name}</h3>
                  <p className="text-gray-600 mb-4 italic">"{story.quote}"</p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-green-600">{story.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join hundreds of graduates who transformed their careers through our programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-900 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Explore Programs
            </Link>
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-900 transition"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
