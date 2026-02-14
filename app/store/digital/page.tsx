import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, FileText, Video, BookOpen, Check, ArrowRight, Zap, 
  Shield, MessageCircle, Play, Sparkles, Users, Building2, DollarSign 
} from 'lucide-react';
import { DIGITAL_PRODUCTS } from '@/lib/store/digital-products';

export const metadata: Metadata = {
  title: 'Digital Resources | Elevate Store',
  description: 'AI tools, toolkits, guides, templates, and courses for training providers. SAM.gov assistant, grants navigator, AI studio, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/digital',
  },
};

export default function StoreDigitalPage() {
  const aiTools = DIGITAL_PRODUCTS.filter((p) => 
    p.id.includes('ai-') || p.id.includes('sam-gov') || p.id.includes('grants')
  );
  const downloadProducts = DIGITAL_PRODUCTS.filter((p) => p.deliveryType === 'download');
  const platformTools = DIGITAL_PRODUCTS.filter((p) => 
    p.id.includes('hub') || p.id.includes('tutor')
  );

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Digital" }]} />
      </div>
{/* Hero */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden bg-amber-900">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home.mp4" type="video/mp4" />
        </video>
        

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-slate-900 rounded-full text-sm font-bold mb-6 border border-white/20">
                <Sparkles className="w-4 h-4" />
                AI-Powered Tools & Resources
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                Digital Resources
                <span className="block text-blue-300">For Training Providers</span>
              </h1>

              <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                Everything you need to start, grow, and scale your workforce training business. 
                AI assistants, compliance tools, marketing templates, and business guides.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="#ai-tools"
                  className="inline-flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  View AI Tools
                </Link>
                <Link
                  href="#demos"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20"
                >
                  <Play className="w-5 h-5" />
                  Watch Demos
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-slate-900/80 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Instant access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Shield className="w-10 h-10 text-blue-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">SAM.gov Assistant</h3>
                  <p className="text-sm text-indigo-200">Federal registration made easy</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Sparkles className="w-10 h-10 text-blue-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">AI Studio</h3>
                  <p className="text-sm text-indigo-200">Generate videos & content</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <DollarSign className="w-10 h-10 text-green-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">Grants Navigator</h3>
                  <p className="text-sm text-indigo-200">Find & apply for funding</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Users className="w-10 h-10 text-amber-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">AI Tutor</h3>
                  <p className="text-sm text-indigo-200">24/7 student support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Videos Section */}
      <section id="demos" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">See Our Tools in Action</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Watch quick demos of our most popular digital resources</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl overflow-hidden group">
              <div className="relative aspect-video bg-slate-100">
                <Image src="/images/store/ai-studio.jpg" alt="AI Studio Demo" fill className="object-cover" />
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center group-hover:bg-white/60 transition-all">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-slate-900 ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900">AI Studio Demo</h3>
                <p className="text-sm text-slate-600">Generate videos, images & voiceovers</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden group">
              <div className="relative aspect-video bg-slate-100">
                <Image src="/images/store/crm-hub.jpg" alt="SAM.gov Assistant Demo" fill className="object-cover" />
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center group-hover:bg-white/60 transition-all">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-slate-900 ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900">SAM.gov Walkthrough</h3>
                <p className="text-sm text-slate-600">Step-by-step registration guide</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden group">
              <div className="relative aspect-video bg-slate-100">
                <Image src="/images/store/ai-tutor.jpg" alt="AI Tutor Demo" fill className="object-cover" />
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center group-hover:bg-white/60 transition-all">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-slate-900 ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900">AI Tutor Demo</h3>
                <p className="text-sm text-slate-600">24/7 student assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="ai-tools" className="py-20 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold mb-4">
              <Zap className="w-4 h-4" />
              AI-Powered
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">AI Tools & Assistants</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Automate compliance, generate content, and support your students with AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiTools.map((product) => (
              <Link
                key={product.id}
                href={`/store/digital/${product.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group border border-slate-100"
              >
                <div className="relative h-48">
                  <Image
                    src={product.image || '/images/store/platform-hero.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 bg-indigo-600 text-slate-900 text-xs font-bold rounded-full">
                      {product.priceDisplay}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  <ul className="space-y-2 mb-4">
                    {product.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Download className="w-8 h-8 text-amber-600" />
            <h2 className="text-3xl font-black text-slate-900">Downloadable Resources</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {downloadProducts.map((product) => (
              <Link
                key={product.id}
                href={`/store/digital/${product.slug}`}
                className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-all group border border-slate-100"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                {product.featured && (
                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded mb-3">
                    Featured
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-2xl font-black text-slate-900">{product.priceDisplay}</span>
                  <span className="text-amber-600 font-semibold">Get Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Tools */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-black text-slate-900">Platform Add-Ons</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformTools.map((product) => (
              <Link
                key={product.id}
                href={`/store/digital/${product.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group"
              >
                <div className="relative h-40">
                  <Image
                    src={product.image || '/images/store/platform-hero.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      {product.priceDisplay}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 text-slate-900 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Need the Complete Platform?</h2>
          <p className="text-xl text-indigo-100 mb-8">Get the full Elevate LMS with all features included.</p>
          <Link
            href="/store/licenses"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors"
          >
            View Platform Licenses <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
