import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

const stories = [
  {
    name: 'Graduate',
    program: 'Public Safety & Reentry Specialist',
    image: '/images/pages/job-placement.jpg',
    beforeJob: 'Unemployed after incarceration',
    afterJob: 'Reentry Specialist',
    salary: '$45,000/year',
    quote: "This program gave me a second chance when I didn't think anyone would."
  },
  {
    name: 'Sarah Martinez',
    program: 'Medical Assistant',
    image: '/images/pages/healthcare-grad.jpg',
    beforeJob: 'Retail cashier, $12/hour',
    afterJob: 'Medical Assistant',
    salary: '$38,000/year',
    quote: "I went from minimum wage to a career with benefits. My kids are so proud."
  },
  {
    name: 'James Wilson',
    program: 'HVAC Technician',
    image: '/images/pages/comp-home-highlight-health.jpg',
    beforeJob: 'Fast food worker',
    afterJob: 'HVAC Technician',
    salary: '$52,000/year',
    quote: "I tripled my income in 6 months. This changed my family's life."
  }
];

export default function SuccessStoryCards() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4">
            Real People, Real Results
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto">
            See how our graduates transformed their lives and careers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div key={story.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition">
              <div className="relative h-48">
                <Image
                  src={story.image}
                  alt={story.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{story.name}</h3>
                <p className="text-sm text-brand-orange-600 font-semibold mb-4">{story.program}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 text-sm">Before:</span>
                    <span className="text-sm text-black">{story.beforeJob}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-green-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{story.afterJob}</div>
                      <div className="text-sm text-brand-green-600 font-semibold">{story.salary}</div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-black italic mb-4">"{story.quote}"</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-2 bg-brand-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-orange-700 transition"
          >
            Read More Success Stories
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
