import { Metadata } from 'next';
import Link from 'next/link';
import { SEO } from '@/components/SEO';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'AI Workforce Platform | Elevate for Humanity',
  description: 'AI-powered workforce technology platform. PARIS AI, Dev Studio, Course Factory, Credential Engine, and more.',
};

const aiProducts = [
  {
    slug: 'paris',
    name: 'PARIS AI',
    tagline: 'Your AI Workforce Advisor',
    description: 'Intelligent career guidance, program matching, and student support powered by Claude AI.',
    icon: '🤖',
    features: ['Career pathway recommendations', 'Program matching', 'Funding eligibility checks', '24/7 student support'],
    color: 'from-purple-600 to-blue-600',
    href: '/ai/paris',
  },
  {
    slug: 'dev-studio',
    name: 'Dev Studio',
    tagline: 'AI-Powered Development Environment',
    description: 'Build, test, and deploy applications with AI assistance. Integrated terminal, code editor, and container management.',
    icon: '⚡',
    features: ['AI code completion', 'Container management', 'Git integration', 'One-click deployments'],
    color: 'from-blue-600 to-cyan-600',
    href: '/ai/dev-studio',
  },
  {
    slug: 'website-builder',
    name: 'AI Website Builder',
    tagline: 'Create Sites in Minutes',
    description: 'Build professional websites with AI. Drag-and-drop editor, templates, and automatic optimization.',
    icon: '🌐',
    features: ['AI content generation', 'SEO optimization', 'Mobile responsive', 'Custom branding'],
    color: 'from-green-600 to-teal-600',
    href: '/ai/website-builder',
  },
  {
    slug: 'course-factory',
    name: 'AI Course Factory',
    tagline: 'Create Curriculum at Scale',
    description: 'Generate complete courses with lessons, quizzes, and assessments using AI automation.',
    icon: '📚',
    features: ['Auto lesson generation', 'Quiz creation', 'Assessment builders', 'Curriculum templates'],
    color: 'from-orange-600 to-red-600',
    href: '/ai/course-factory',
  },
  {
    slug: 'credential-engine',
    name: 'Credential Intelligence Engine',
    tagline: 'Smart Credential Management',
    description: 'Manage certifications, licenses, and credentials with automated tracking and compliance.',
    icon: '🏆',
    features: ['Credential tracking', 'Expiration alerts', 'Compliance reporting', 'Verification portals'],
    color: 'from-yellow-600 to-orange-600',
    href: '/ai/credential-engine',
  },
  {
    slug: 'instructor',
    name: 'AI Instructor',
    tagline: 'Always-On Learning Support',
    description: 'AI-powered teaching assistant that answers questions, explains concepts, and provides feedback.',
    icon: '🎓',
    features: ['24/7 Q&A', 'Personalized tutoring', 'Progress tracking', 'Multilingual support'],
    color: 'from-indigo-600 to-purple-600',
    href: '/ai/instructor',
  },
  {
    slug: 'digital-binder',
    name: 'Digital Binder',
    tagline: 'Student Document Management',
    description: 'Organize, track, and manage all student documents, forms, and certifications in one place.',
    icon: '📁',
    features: ['Document storage', 'E-signatures', 'Checklist tracking', 'Compliance archives'],
    color: 'from-slate-600 to-gray-600',
    href: '/ai/digital-binder',
  },
  {
    slug: 'media-studio',
    name: 'AI Media Studio',
    tagline: 'Create Content Faster',
    description: 'Generate videos, graphics, and social media content with AI-powered tools.',
    icon: '🎬',
    features: ['Video generation', 'Graphic design', 'Social templates', 'Brand consistency'],
    color: 'from-pink-600 to-rose-600',
    href: '/ai/media-studio',
  },
  {
    slug: 'workforce-os',
    name: 'Workforce Operating System',
    tagline: 'Complete Workforce Management',
    description: 'End-to-end platform for managing students, apprenticeships, employers, and workforce programs.',
    icon: '⚙️',
    features: ['Student management', 'Apprenticeship tracking', 'Employer portal', 'Analytics dashboard'],
    color: 'from-blue-700 to-indigo-700',
    href: '/platform/enterprise',
  },
  {
    slug: 'licensing',
    name: 'Curriculum Licensing',
    tagline: 'License Our Technology',
    description: 'License the Elevate platform, curriculum, and AI tools for your organization.',
    icon: '📜',
    features: ['White-label options', 'API access', 'Custom branding', 'Training support'],
    color: 'from-emerald-600 to-green-600',
    href: '/platform/licensing',
  },
  {
    slug: 'integrations',
    name: 'Integrations',
    tagline: 'Connect Everything',
    description: 'Integrate with payroll, HRIS, LMS, and workforce systems across the enterprise.',
    icon: '🔗',
    features: ['Stripe payments', 'SendGrid email', 'Google Classroom', 'API webhooks'],
    color: 'from-cyan-600 to-blue-600',
    href: '/integrations',
  },
  {
    slug: 'api',
    name: 'API Platform',
    tagline: 'Build on Elevate',
    description: 'RESTful APIs and webhooks for building custom integrations and extensions.',
    icon: '🔌',
    features: ['REST API', 'Webhooks', 'SDK libraries', 'Documentation'],
    color: 'from-violet-600 to-purple-600',
    href: '/api-docs',
  },
];

export default function AIPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title="AI Workforce Platform"
        description="AI-powered workforce technology. PARIS AI, Dev Studio, Course Factory, Credential Engine, and more."
        breadcrumb={[{ name: 'Platform', url: '/platform' }, { name: 'AI', url: '/ai' }]}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Elevate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI</span> Platform
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Transform your workforce with AI-powered tools for training, development, and career advancement. 
              Built on enterprise-grade technology used by {PLATFORM_DEFAULTS.orgName}.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/ai/paris" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition">
                Try PARIS AI Free
              </Link>
              <Link href="/platform/enterprise" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                View Enterprise Platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">AI Product Suite</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A complete ecosystem of AI tools designed for workforce development, education, and career services.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiProducts.map((product) => (
              <Link 
                key={product.slug} 
                href={product.href}
                className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${product.color}`}></div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{product.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">{product.name}</h3>
                      <p className="text-sm text-blue-600 mb-2">{product.tagline}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mt-4">{product.description}</p>
                  <ul className="mt-4 space-y-1">
                    {product.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline">
                    Learn more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workforce?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a demo to see how Elevate's AI platform can benefit your organization.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
              Schedule Demo
            </Link>
            <Link href="/platform/enterprise" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
