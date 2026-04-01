import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import UniversalNav from '@/components/UniversalNav';

export const metadata: Metadata = {
  title:
    'Selfish Inc. (dba) Rise Forward Foundation | Mental Wellness & Holistic Healing',
  description:
    'Welcome to Selfish Inc. Your Partner in Mental Wellness and Holistic Healing',
};

export default function RiseFoundationPage() {
  const navLinks = [
    { label: 'Home', href: '/rise-foundation' },
    { label: 'About', href: '/rise-foundation/about' },
    { label: 'Programs', href: '/rise-foundation/programs' },
    { label: 'Trauma Recovery', href: '/rise-foundation/trauma-recovery' },
    { label: 'Addiction', href: '/rise-foundation/addiction-rehabilitation' },
    { label: 'Divorce Support', href: '/rise-foundation/divorce-support' },
    { label: 'Events', href: '/rise-foundation/events' },
    { label: 'Get Involved', href: '/rise-foundation/get-involved' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <UniversalNav
        links={navLinks}
        ctaText="Donate"
        ctaHref="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
        bgColor="bg-purple-600"
        textColor="text-white"
        logo="Selfish Inc."
        logoHref="/rise-foundation"
      />

      {/* Hero Section with Background Image */}
      <section className="relative py-32 px-4 text-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://static.wixstatic.com/media/a9980c_542c794668484ecc911de7f139dad437~mv2.jpg"
            alt="Mental wellness background"
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
            "Welcome to Selfish Inc. Your Partner in Mental Wellness and
            Holistic Healing"
          </h1>

          {/* Donate Button */}
          <div className="mb-12">
            <Link
              href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
              target="_blank"
              className="inline-block bg-purple-600 text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Donate
            </Link>
          </div>
        </div>
      </section>

      {/* Mind Body Spirit Image Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src="https://static.wixstatic.com/media/a9980c_542c794668484ecc911de7f139dad437~mv2.jpg"
                alt="Mind, Body and spirit words engraved on zen stones"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src="https://static.wixstatic.com/media/a9980c_50880ae14adb46c09fb5244b2fa65c84~mv2.webp"
                alt="Rocks of strength and resilience"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Healing Products Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Shop our healing Products-browse items designed to uplift your mood
            and body.
          </h2>
          <Link
            href="https://curvaturebodysculpting.store/"
            target="_blank"
            className="inline-block bg-black text-white px-12 py-4 rounded-lg text-lg font-bold hover:bg-gray-800 transition-colors shadow-lg uppercase"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* Video Section - Will be added */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-500">
            <p>Video section - to be added</p>
          </div>
        </div>
      </section>

      {/* Programs Section - Exact from Wix */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Trauma Recovery */}
            <Link
              href="/rise-foundation/trauma-recovery"
              className="group block"
            >
              <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                <Image
                  src="https://static.wixstatic.com/media/a9980c_49b5dda3ab744437846dedd6063e8f04~mv2.jpg"
                  alt="Freckled face reflecting silent trauma"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Trauma Recovery
              </h3>
            </Link>

            {/* Addiction Rehabilitation */}
            <Link
              href="/rise-foundation/addiction-rehabilitation"
              className="group block"
            >
              <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                <Image
                  src="https://static.wixstatic.com/media/11062b_d43c4524d004480cac5e896e52182b75~mv2.jpg"
                  alt="Doctor's touch: support and understanding"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Addiction Rehabilitation
              </h3>
            </Link>

            {/* Divorce Support */}
            <Link
              href="/rise-foundation/divorce-support"
              className="group block"
            >
              <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                <Image
                  src="https://static.wixstatic.com/media/8e2a95a81bd67d6d59f9fc086239d1be.jpg"
                  alt="This scene powerfully captures the emotional complexity of divorce"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Divorce Support
              </h3>
            </Link>
          </div>

          {/* Programs Link */}
          <div className="text-center mt-12">
            <Link
              href="/rise-foundation/our-programs"
              className="text-lg text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              Mindfulness Workshops, Mental Wellness Programs Holistic, Mental
              Health
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Do Not Sell My Personal Information
        </p>
      </footer>
    </main>
  );
}
