'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { MapPin, Clock, Award, Users, Star, ChevronRight } from 'lucide-react';

const LMS_API = 'https://lms.elevateforhumanity.org';

interface HostShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  email: string | null;
  shop_status: string;
  description: string | null;
  services: string[] | null;
  instructor_name: string | null;
  owner_name: string | null;
  owner_email: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  years_in_business: number | null;
  apprenticeship_plans: string[];
  badges: string[];
}

async function fetchHostShops(): Promise<HostShop[]> {
  try {
    const res = await fetch(`${LMS_API}/api/host-shops/available`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function ShopCard({ shop }: { shop: HostShop }) {
  const fullAddress = [shop.address, shop.city, shop.state, shop.zip_code]
    .filter(Boolean)
    .join(', ');

  const fallbackImage = `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <Image
          src={shop.image_url || fallbackImage}
          alt={shop.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {shop.badges && shop.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {shop.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-brand-red-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900 shadow">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {shop.rating ? shop.rating.toFixed(1) : 'New'}
          {shop.review_count ? ` (${shop.review_count})` : ''}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 text-lg font-bold text-slate-950">{shop.name}</h3>
        {shop.owner_name && (
          <p className="mb-2 text-sm font-medium text-brand-red-600">
            {shop.owner_name}
          </p>
        )}

        {fullAddress && (
          <div className="mb-3 flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{fullAddress}</span>
          </div>
        )}

        {shop.services && shop.services.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {shop.services.slice(0, 4).map((service) => (
              <span
                key={service}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
              >
                {service}
              </span>
            ))}
            {shop.services.length > 4 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                +{shop.services.length - 4} more
              </span>
            )}
          </div>
        )}

        {shop.apprenticeship_plans && shop.apprenticeship_plans.length > 0 && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-600">
            <Award className="h-3.5 w-3.5 flex-shrink-0 text-brand-red-600" />
            <span className="font-medium">{shop.apprenticeship_plans.length} apprenticeship program{shop.apprenticeship_plans.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {shop.years_in_business && (
          <div className="mb-4 flex items-center gap-1.5 text-sm text-slate-600">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{shop.years_in_business} years in business</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/programs/barber-apprenticeship"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 py-3 font-semibold text-white transition-colors hover:bg-brand-red-700"
          >
            Apply to This Shop
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/host-shop/${shop.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
      <Users className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="mb-2 text-lg font-semibold text-slate-700">
        No Host Shops Available Yet
      </h3>
      <p className="mb-6 max-w-md text-sm text-slate-500">
        We are working with local barbershops to add more apprenticeship opportunities. Apply now to be matched when a spot opens up.
      </p>
      <Link
        href="/programs/barber-apprenticeship"
        className="rounded-xl bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700"
      >
        Apply for Barber Apprenticeship
      </Link>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 text-center">
      <p className="mb-4 text-sm text-red-600">
        Unable to load host shops. Please try again later.
      </p>
      <Link
        href="/programs/barber-apprenticeship"
        className="rounded-xl bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700"
      >
        Apply for Barber Apprenticeship
      </Link>
    </div>
  );
}

export default function BrowseHostShopsClient() {
  const [shops, setShops] = useState<HostShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchHostShops()
      .then((data) => {
        setShops(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 py-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-red-600/20 px-4 py-1.5 text-sm font-semibold text-brand-red-400">
            <Award className="h-4 w-4" />
            DOL Registered Apprenticeship
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Find Your Host Barber Shop
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
            Browse approved barber apprenticeship host shops in Indianapolis. Each shop is
            licensed, vetted, and ready to train the next generation of barbers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/programs/barber-apprenticeship"
              className="rounded-xl bg-brand-red-600 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-brand-red-700"
            >
              Start Your Application
            </Link>
            <Link
              href="/apprenticeships"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              View All Apprenticeships
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-slate-100 bg-slate-50 py-6">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-8 px-4 sm:px-6 lg:px-8">
          {[
            { label: 'Approved Shops', value: '3+' },
            { label: 'Active Apprentices', value: '40+' },
            { label: 'Weekend RTI Hours', value: '260' },
            { label: 'Avg. Starting Pay', value: '$18/hr' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-slate-950">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop Grid */}
      <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Available Host Shops
            </h2>
            {!loading && !error && (
              <p className="mt-1 text-sm text-slate-500">
                {shops.length} shop{shops.length !== 1 ? 's' : ''} accepting apprentices
              </p>
            )}
          </div>
          <Link
            href="/programs/barber-apprenticeship"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700 sm:flex"
          >
            See All Programs <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-4 h-48 rounded-xl bg-slate-100" />
                <div className="mb-2 h-5 w-3/4 rounded bg-slate-100" />
                <div className="mb-3 h-4 w-1/2 rounded bg-slate-100" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-slate-100" />
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState />
        ) : shops.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Start Your Barber Career?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-slate-300">
            Apply today and get matched with a host shop within weeks. No experience required — just
            the drive to become a licensed barber.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs/barber-apprenticeship"
              className="rounded-xl bg-brand-red-600 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-brand-red-700"
            >
              Apply Now — No Experience Needed
            </Link>
            <Link
              href="/programs/barber-apprenticeship#funding"
              className="rounded-xl border border-white/20 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
