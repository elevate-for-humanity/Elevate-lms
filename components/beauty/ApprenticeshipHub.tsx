'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Scissors, Sparkles, Droplet, Flower2, 
  GraduationCap, DollarSign, Clock, Users,
  CheckCircle, ArrowRight, Play, Star,
  MapPin, Phone, Mail, ChevronDown, ChevronUp
} from 'lucide-react';

// Program data
const PROGRAMS = [
  {
    id: 'barber',
    name: 'Barber Apprenticeship',
    slug: 'barber-apprenticeship',
    tagline: 'Master the art of precision cutting and classic grooming',
    description: 'DOL-registered apprenticeship combining hands-on training at licensed barbershops with Related Technical Instruction. Earn while you learn.',
    icon: Scissors,
    color: 'from-amber-500 to-orange-600',
    stats: [
      { value: '2,000', label: 'Training Hours' },
      { value: '12-18', label: 'Months' },
      { value: '$0', label: 'with Funding' },
      { value: '$12-15', label: 'Hourly (OJT)' },
    ],
    skills: ['Precision Haircutting', 'Straight Razor Shaves', 'Beard Design', 'Shop Management'],
    credential: 'Indiana Barber License',
    image: '/images/beauty/barber-hero.webp',
    video: '/videos/programs/barber-hero.mp4',
    popular: true,
  },
  {
    id: 'cosmetology',
    name: 'Cosmetology Apprenticeship',
    slug: 'cosmetology-apprenticeship',
    tagline: 'Transform passion into a licensed beauty career',
    description: 'Comprehensive apprenticeship covering hair, color, nails, and skin. Work alongside licensed cosmetologists while building your clientele.',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
    stats: [
      { value: '1,500', label: 'Training Hours' },
      { value: '12-24', label: 'Months' },
      { value: '$0', label: 'with Funding' },
      { value: '$12-15', label: 'Hourly (OJT)' },
    ],
    skills: ['Hair Coloring', 'Precision Cutting', 'Nail Art', 'Skincare'],
    credential: 'Indiana Cosmetology License',
    image: '/images/beauty/cosmetology-hero.webp',
    popular: false,
  },
  {
    id: 'esthetics',
    name: 'Esthetician Apprenticeship',
    slug: 'esthetics-apprenticeship',
    tagline: 'Launch your career in skincare and spa treatments',
    description: 'Specialized training in facials, chemical peels, microdermabrasion, and advanced skincare. Growing demand in medical spas and wellness centers.',
    icon: Droplet,
    color: 'from-cyan-500 to-blue-600',
    stats: [
      { value: '700', label: 'Training Hours' },
      { value: '6-12', label: 'Months' },
      { value: '$0', label: 'with Funding' },
      { value: '$14-18', label: 'Hourly (OJT)' },
    ],
    skills: ['Facial Treatments', 'Chemical Peels', 'Laser Safety', 'Medical Spa'],
    credential: 'Indiana Esthetics License',
    image: '/images/beauty/esthetics-hero.webp',
    popular: false,
  },
  {
    id: 'nail',
    name: 'Nail Technician Apprenticeship',
    slug: 'nail-technician-apprenticeship',
    tagline: 'Perfect your craft in nail art and manicures',
    description: 'Fast-track to a career in nail technology. Learn classic manicures, gel extensions, nail art, and salon business basics.',
    icon: Flower2,
    color: 'from-purple-500 to-violet-600',
    stats: [
      { value: '400', label: 'Training Hours' },
      { value: '3-6', label: 'Months' },
      { value: '$0', label: 'with Funding' },
      { value: '$10-14', label: 'Hourly (OJT)' },
    ],
    skills: ['Gel Extensions', 'Nail Art', 'Manicure/Pedicure', 'Sanitation'],
    credential: 'Indiana Nail Technology License',
    image: '/images/beauty/nails-hero.webp',
    popular: false,
  },
];

const WHY_APPRENTICESHIP = [
  { title: 'Earn While You Learn', description: 'Get paid $12-18/hour at your host shop while completing your training hours.' },
  { title: 'Real Experience', description: 'Build a client portfolio with 50+ documented services before graduation.' },
  { title: 'DOL Registered', description: 'Nationally recognized credential that travels with you anywhere.' },
  { title: 'Funding Available', description: 'WIOA, SNAP E&T, and workforce grants may cover tuition entirely.' },
];

const TESTIMONIALS = [
  {
    name: 'Destiny R.',
    program: 'Barber Apprenticeship',
    quote: 'I thought beauty school was out of reach. The apprenticeship let me earn while I learned. Now I\'m building my own empire.',
    before: 'Working fast food, no career direction',
    after: 'Owns her own barbershop, $85K+ annually',
    image: '/images/heroes/hero-homepage.webp',
    rating: 5,
  },
  {
    name: 'Marcus L.',
    program: 'Cosmetology',
    quote: 'The mentorship made all the difference. I learned from the best and now I\'m the one teaching others.',
    before: 'College dropout, unsure of career path',
    after: 'Senior stylist at luxury salon, $62K annually',
    image: '/images/beauty/cosmetology-hero.webp',
    rating: 5,
  },
];

const FAQS = [
  {
    question: 'How does an apprenticeship differ from beauty school?',
    answer: 'In an apprenticeship, you learn by working alongside experienced professionals in a real barbershop or salon. You earn wages while you train and gain hands-on experience with real clients. Traditional beauty school is classroom-based and you pay tuition before you start working.',
  },
  {
    question: 'Do I get paid while training?',
    answer: 'Yes! As an apprentice, you\'ll earn wages (typically $12-15/hour for barbers, $10-18/hour for cosmetology/esthetics) while you complete your training hours at your host shop.',
  },
  {
    question: 'What certifications will I earn?',
    answer: 'Upon completion, you\'ll earn your Indiana state license (Barber, Cosmetology, Esthetics, or Nail Technology) plus DOL Registered Apprenticeship credentials that are nationally recognized.',
  },
  {
    question: 'How do I get matched with a host shop?',
    answer: 'Our team works with a network of verified partner salons and barbershops. We consider your location preferences, schedule, and career goals to find the best match for you.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-brand-red-600 transition-colors"
      >
        <span className="font-semibold text-slate-900 pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-slate-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function ApprenticeshipHub() {
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red-600/20 border border-brand-red-500/30 rounded-full text-sm text-brand-red-300 mb-6">
              <GraduationCap className="w-4 h-4" />
              DOL Registered Apprenticeship Programs
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Start Your Beauty Career
              <span className="block text-brand-red-400">Get Paid While You Train</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl">
              Learn from working professionals in real salons and barbershops. Earn wages, build your clientele, 
              and graduate ready to pass your state licensing exam.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/check-eligibility"
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-red-900/50"
              >
                Check Your Eligibility
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/programs/barber-apprenticeship/apply"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition"
              >
                Apply Now
              </Link>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '500+', label: 'Graduates' },
              { value: '$0', label: 'with WIOA' },
              { value: '94%', label: 'Pass Rate' },
              { value: '87%', label: 'Job Placement' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Apprenticeship
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Four pathways to a licensed beauty career. Each program combines on-the-job training with classroom instruction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {PROGRAMS.map((program) => {
              const Icon = program.icon;
              const isActive = activeProgram === program.id;
              
              return (
                <div
                  key={program.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                    isActive ? 'ring-2 ring-brand-red-500 shadow-xl' : 'hover:shadow-xl'
                  }`}
                  onMouseEnter={() => setActiveProgram(program.id)}
                  onMouseLeave={() => setActiveProgram(null)}
                >
                  {program.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-brand-red-600 text-white text-xs font-bold rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  {/* Program Header */}
                  <div className={`h-2 bg-gradient-to-r ${program.color}`} />

                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-200">
                    <Image
                      src={program.image}
                      alt={`${program.name} hands-on training`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
                  </div>
                  
                  <div className="p-6 lg:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${program.color} text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{program.name}</h3>
                        <p className="text-sm text-slate-500">{program.tagline}</p>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-6">{program.description}</p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {program.stats.map((stat) => (
                        <div key={stat.label} className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                          <div className="text-xs text-slate-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {program.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    {/* Credential */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Earns: {program.credential}</span>
                    </div>
                    
                    {/* CTA */}
                    <div className="flex gap-3">
                      <Link
                        href={`/programs/${program.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/programs/${program.slug}/apply`}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-xl transition"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Apprenticeship */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Why Choose an Apprenticeship?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                The best way to learn a trade is by doing the trade. Our apprenticeship programs give you real-world experience, industry connections, and a paycheck while you train.
              </p>
              
              <div className="space-y-6">
                {WHY_APPRENTICESHIP.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="p-2 bg-green-100 rounded-lg h-fit">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-slate-900">Average Total Earnings During Training</span>
                </div>
                <div className="text-3xl font-bold text-green-600">$24,000 - $45,000</div>
                <p className="text-sm text-slate-500 mt-1">Depending on program and hours worked</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-red-500/20 to-amber-500/20 rounded-3xl transform rotate-3" />
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <Image
                  src="/images/beauty/barber-hero.webp"
                  alt="Barber apprenticeship training"
                  width={600}
                  height={400}
                  className="w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="font-semibold">"I earned $15/hr while learning from the best barbers in Indianapolis."</p>
                    <p className="text-sm text-white/70 mt-2">— Marcus T., Barber Apprentice Graduate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Real Transformations</h2>
            <p className="text-lg text-slate-400">Success stories from our apprenticeship graduates</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <StarRating rating={testimonial.rating} />
                <p className="text-lg text-white/90 mt-4 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-red-500 to-amber-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-brand-red-400">{testimonial.program}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-400">
                    <span className="text-slate-500">Before:</span> {testimonial.before}
                  </p>
                  <p className="text-sm text-green-400 mt-1">
                    <span className="text-slate-500">After:</span> {testimonial.after}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Add more testimonials */}
            <div className="bg-gradient-to-br from-brand-red-600/20 to-amber-600/20 rounded-2xl p-6 border border-brand-red-500/30 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">500+</p>
                <p className="text-slate-400">Graduates launched</p>
                <Link href="/success-stories" className="inline-flex items-center gap-2 text-brand-red-400 hover:text-brand-red-300 mt-4 font-semibold">
                  Read More Stories <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Most Apprentices Pay $0
          </h2>
          <p className="text-xl text-white/90 mb-8">
            WIOA, SNAP E&T, and workforce grants may cover your entire tuition. 
            Check your eligibility in 2 minutes — no commitment required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/check-eligibility"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition shadow-lg"
            >
              <DollarSign className="w-5 h-5" />
              Check My Eligibility
            </Link>
            <Link
              href="/funding"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition"
            >
              Learn About Funding
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-0">
            {FAQS.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-brand-red-600 hover:text-brand-red-700 font-semibold"
            >
              <Mail className="w-5 h-5" />
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Applications are free. No commitment required. We'll help you find funding and a host shop match.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-slate-100 transition"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
