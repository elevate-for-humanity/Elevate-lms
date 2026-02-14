'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Rocket, Target, TrendingUp, Clock, Award, ArrowRight, CheckCircle,
  Phone
} from 'lucide-react';

interface Program {
  name: string;
  duration: string;
  regular: string;
  price: string;
}

export default function SupersonicPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        const data = await res.json();
        if (data.status === 'success' && data.programs) {
          setPrograms(data.programs.slice(0, 4).map((p: any) => {
            const weeks = p.estimated_weeks || 12;
            return {
              name: p.name || p.title,
              duration: `${Math.ceil(weeks / 2)} weeks`,
              regular: `${weeks} weeks`,
              price: p.total_cost ? `$${p.total_cost.toLocaleString()}` : 'Contact Us',
            };
          }));
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const features = [
    { icon: Rocket, title: 'Accelerated Learning', description: 'Complete programs 50% faster with intensive study tracks' },
    { icon: Target, title: 'Focused Curriculum', description: 'Streamlined content targeting essential skills' },
    { icon: Clock, title: 'Flexible Scheduling', description: 'Evening and weekend options for working professionals' },
    { icon: Award, title: 'Priority Certification', description: 'Fast-track certification exam scheduling' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic" }]} />
      </div>
<div className="relative bg-gray-900 py-20">
        <Image
          src="/images/heroes/training-provider-2.jpg"
          alt="Supersonic Program"
          fill
          className="object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-10 h-10 text-red-500" />
            <span className="text-red-500 font-bold text-xl">SUPERSONIC</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Accelerate Your Career</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Our intensive fast-track programs get you certified and job-ready in half the time.
          </p>
          <Link href="/supersonic/apply" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-red-700 transition-colors">
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Why Supersonic?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-brand-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-brand-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Available Programs</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {programs.map((program, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-brand-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{program.name}</h3>
                  <p className="text-brand-blue-400 font-semibold">{program.duration} intensive</p>
                </div>
                <span className="text-2xl font-bold text-red-500">{program.price}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>Regular program: {program.regular}</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Full curriculum coverage
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Hands-on training included
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Job placement assistance
                </li>
              </ul>
              <Link href={`/supersonic/programs/${program.name.toLowerCase().replace(' ', '-')}`} className="block text-center bg-brand-blue-600 text-white py-3 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Learn More
              </Link>
            </div>
          ))}
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
