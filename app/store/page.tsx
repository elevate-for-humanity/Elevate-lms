import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, ShoppingBag, GraduationCap, BookOpen, Server, CreditCard, FileText, Settings, Users } from 'lucide-react';
import { primaryCards, secondaryCards } from '@/lib/store/cards';
import StoreClientWrapper from './StoreClientWrapper';
import UniversalSearch from '@/components/search/UniversalSearch';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Store | Elevate for Humanity',
  description: 'Access workforce development resources, training courses, and platform solutions. The Workforce Operating System that runs funded training pathways end-to-end.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store',
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'server': Server,
  'credit-card': CreditCard,
  'file-text': FileText,
  'settings': Settings,
  'users': Users,
};



export default function StorePage() {
  return (
    <StoreClientWrapper>
      <div className="bg-white min-h-screen">
        {/* Breadcrumbs + framing */}
        <div className="bg-slate-50 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Store' }]} />
            <p className="text-sm text-slate-600 mt-1">Licenses and resources for the <a href="/platform" className="text-brand-red-600 font-medium hover:underline">Elevate Workforce Operating System</a></p>
          </div>
        </div>

        {/* Hero Section with Search */}
        <section className="relative bg-slate-900 text-white py-16 overflow-hidden">

          <div className="absolute inset-0">
            <Image
              src="/images/store/platform-hero.jpg"
              alt="Elevate Store"
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                Workforce Operating System
              </h1>
              <p className="text-xl text-slate-300 mb-4">
                Run funded training pathways end-to-end, including compliance and outcomes.
              </p>
              <p className="text-sm text-slate-400 mb-8">
                This is not an LMS. It includes an LMS. The platform automates operations while authority stays with workforce administrators. Individual courses start at $49. Managed platform and enterprise solutions are contract-based.
              </p>
              
              {/* Universal Search with Quick Filters */}
              <div className="max-w-2xl mx-auto">
                <UniversalSearch 
                  placeholder="Search programs, courses, licenses, tools..."
                  showFilters={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Avatar Guide */}
        <PageAvatar 
          videoSrc="/videos/avatars/store-assistant.mp4" 
          title="Store Assistant" 
        />



        {/* Primary Cards - Tier 1 (Above the fold) */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {primaryCards.map((card) => {
                const Icon = iconMap[card.icon];
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    data-tour={card.tourId}
                    className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all flex flex-col"
                  >
                    {/* Card Image */}
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-black text-lg mb-1">{card.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{card.subtitle}</p>
                      <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">{card.description}</p>
                      <span className="inline-flex items-center gap-1 text-orange-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 relative">
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-700 font-medium">
              More
            </span>
          </div>
        </div>

        {/* Secondary Cards - Tier 2 */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {secondaryCards.map((card) => {
                const Icon = iconMap[card.icon];
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    data-tour={card.tourId}
                    className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all flex flex-col"
                  >
                    {/* Card Image */}
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-black mb-1">{card.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{card.subtitle}</p>
                      <span className="inline-flex items-center gap-1 text-orange-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-black mb-6 text-center">Quick Links</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'View Cart', href: '/shop/cart', icon: ShoppingBag },
                { label: 'My Orders', href: '/shop/orders', icon: FileText },
                { label: 'My Courses', href: '/lms', icon: GraduationCap },
                { label: 'Contact Sales', href: '/contact', icon: Users },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow transition"
                >
                  <link.icon className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-black">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-black mb-4">Need Help Finding Something?</h2>
            <p className="text-slate-300 mb-6">
              Our team is here to help you find the right products, courses, or platform solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-orange-700 transition"
              >
                Contact Us
              </Link>
              <Link 
                href="/store/demo" 
                className="inline-flex items-center justify-center gap-2 border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition"
              >
                <Play className="w-5 h-5" />
                See Platform Tour
              </Link>
            </div>
          </div>
        </section>
      </div>
    </StoreClientWrapper>
  );
}
