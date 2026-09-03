'use client';

import Link from 'next/link';
import { Bot, Brain, BookOpen, Award, Video, Zap, Sparkles, ArrowRight } from 'lucide-react';

const AI_PRODUCTS = [
  { 
    name: 'PARIS AI', 
    href: '/ai/paris',
    icon: Brain,
    desc: 'Career advisor & student support',
    color: 'from-purple-500 to-blue-500'
  },
  { 
    name: 'Course Factory', 
    href: '/ai/course-factory',
    icon: BookOpen,
    desc: 'AI-powered curriculum generation',
    color: 'from-emerald-500 to-teal-500'
  },
  { 
    name: 'Credential Engine', 
    href: '/ai/credential-engine',
    icon: Award,
    desc: 'Digital certification & verification',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    name: 'AI Instructor', 
    href: '/ai/instructor',
    icon: Sparkles,
    desc: '24/7 personalized tutoring',
    color: 'from-violet-500 to-purple-500'
  },
  { 
    name: 'Dev Studio', 
    href: '/ai/dev-studio',
    icon: Zap,
    desc: 'Enterprise development platform',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    name: 'Media Studio', 
    href: '/ai',
    icon: Video,
    desc: 'AI video & content generation',
    color: 'from-pink-500 to-rose-500'
  },
];

export function HomeAIPlatform() {
  return (
    <section className="py-20 bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300 mb-6">
            <Bot className="w-4 h-4" />
            AI-Powered Workforce Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">AI Workforce OS</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A unified enterprise platform that enables organizations to recruit, train, certify, 
            place, and support learners while providing AI-powered curriculum creation, 
            workforce intelligence, and employer engagement.
          </p>
        </div>

        {/* AI Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {AI_PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <Link
                key={product.name}
                href={product.href}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{product.desc}</p>
                  <div className="flex items-center gap-1 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { value: '13', label: 'Sovereign Portals' },
            { value: '24/7', label: 'AI Availability' },
            { value: '10x', label: 'Faster Curriculum' },
            { value: '95%', label: 'Verification Rate' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/ai" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            Explore the AI Platform <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
