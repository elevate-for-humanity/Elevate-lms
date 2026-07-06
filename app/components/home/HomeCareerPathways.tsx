import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PATHWAYS = [
  {
    title: 'Healthcare',
    description: 'Start a rewarding career in healthcare with certifications that matter.',
    icon: '🏥',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
    salary: '$35K - $55K',
    programs: ['CNA', 'Phlebotomy', 'Medical Assistant', 'EKG', 'Pharmacy Tech'],
    href: '/healthcare',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
  },
  {
    title: 'Skilled Trades',
    description: 'Build a solid career in HVAC, welding, electrical, and more.',
    icon: '⚙️',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop',
    salary: '$45K - $75K',
    programs: ['HVAC', 'Welding', 'Electrical', 'Plumbing', 'CDL'],
    href: '/trades',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Beauty & Wellness',
    description: 'Turn your passion into a licensed beauty career.',
    icon: '💇',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    salary: '$30K - $60K',
    programs: ['Barber', 'Cosmetology', 'Esthetics', 'Nails'],
    href: '/beauty',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Technology',
    description: 'Launch your tech career with industry certifications.',
    icon: '💻',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
    salary: '$50K - $90K',
    programs: ['IT Support', 'Cybersecurity', 'Web Dev', 'Cloud'],
    href: '/technology',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
  },
];

export function HomeCareerPathways() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-slate-100 text-slate-700 text-sm font-semibold rounded-full mb-4">
            🎯 YOUR CAREER PATHWAY
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red-600 to-rose-600">
              {' '}Transformation
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Every journey starts with a single step. Explore our career pathways and find the program that fits your goals.
          </p>
        </div>

        {/* Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PATHWAYS.map((pathway) => (
            <Link
              key={pathway.title}
              href={pathway.href}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-transparent"
            >
              {/* Gradient Accent */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${pathway.color}`} />
              
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={pathway.image}
                  alt={pathway.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Icon Badge */}
                <div className={`absolute top-4 left-4 w-14 h-14 rounded-2xl bg-gradient-to-r ${pathway.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {pathway.icon}
                </div>
                
                {/* Salary Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-slate-800">{pathway.salary}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">
                  {pathway.title}
                </h3>
                <p className="text-slate-600 mb-4">{pathway.description}</p>
                
                {/* Programs List */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {pathway.programs.map((program) => (
                    <span
                      key={program}
                      className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full"
                    >
                      {program}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-brand-red-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Explore Programs</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/career-training"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-brand-red-600 font-semibold transition-colors"
          >
            <span>View All Career Pathways</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
