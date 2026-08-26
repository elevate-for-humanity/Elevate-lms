'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface Partner {
  id: string;
  name: string;
  industry: string;
  logo_url?: string | null;
  website?: string | null;
  is_featured: boolean;
}

interface Props {
  limit?: number;
  showStats?: boolean;
  showCTA?: boolean;
  variant?: 'full' | 'compact' | 'grid';
}

export default function EmployerPartners({
  limit,
  showStats = true,
  showCTA = true,
  variant = 'full',
}: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPartners() {
      try {
        const supabase = createClient();
        let query = supabase
          .from('employer_profiles')
          .select('id, company_name, industry, logo_url, website, is_featured')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('company_name', { ascending: true });

        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;

        if (!mounted) return;
        setPartners(
          (data ?? [])
            .filter((row) => Boolean(row.company_name))
            .map((row) => ({
              id: row.id,
              name: row.company_name,
              industry: row.industry || 'Employer Partner',
              logo_url: row.logo_url,
              website: row.website,
              is_featured: Boolean(row.is_featured),
            })),
        );
      } catch (error) {
        logger.error('Unable to load verified employer partners', error);
        if (mounted) setPartners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPartners();
    return () => {
      mounted = false;
    };
  }, [limit]);

  const industries = useMemo(
    () => Array.from(new Set(partners.map((partner) => partner.industry))).filter(Boolean),
    [partners],
  );

  if (loading) {
    return (
      <section className="bg-slate-50 py-12">
        <div className="mx-auto flex max-w-7xl justify-center px-4">
          <Loader2 className="h-7 w-7 animate-spin text-brand-blue-600" aria-label="Loading employer partners" />
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return (
      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Building2 className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">Employer engagement</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Elevate works with employers, apprenticeship host sites, and workforce partners to support career pathways. Public partner names are displayed only after they are active and verified in our system.
          </p>
          {showCTA && (
            <Link href="/employers" className="mt-5 inline-block font-bold text-brand-blue-700 hover:underline">
              Employer services
            </Link>
          )}
        </div>
      </section>
    );
  }

  const compact = variant === 'compact';

  return (
    <section className="bg-slate-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-100 px-4 py-2 text-sm font-bold text-brand-blue-800">
            <Building2 className="h-4 w-4" /> Verified employer relationships
          </div>
          <h2 className={`mt-4 font-black text-slate-950 ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
            Employer &amp; workforce partners
          </h2>
          <p className="mx-auto mt-3 max-w-3xl leading-7 text-slate-700">
            The organizations below are loaded from active employer records. We do not publish default partner counts, hiring rates, placement rates, or salary claims when verified data is unavailable.
          </p>
        </div>

        {showStats && (
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
            <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
              {partners.length} active public partner{partners.length === 1 ? '' : 's'} shown
            </span>
            {industries.slice(0, 6).map((industry) => (
              <span key={industry} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
                {industry}
              </span>
            ))}
          </div>
        )}

        <div className={`mt-9 grid gap-4 ${variant === 'grid' || compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {partners.map((partner) => (
            <article key={partner.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {partner.logo_url ? (
                    <Image src={partner.logo_url} alt={`${partner.name} logo`} width={48} height={48} className="h-10 w-10 object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
                  ) : (
                    <Building2 className="h-6 w-6 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-950">{partner.name}</h3>
                  <p className="text-sm text-slate-600">{partner.industry}</p>
                </div>
              </div>
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-bold text-brand-blue-700 hover:underline"
                >
                  Visit organization
                </a>
              )}
            </article>
          ))}
        </div>

        {showCTA && (
          <div className="mt-9 text-center">
            <Link href="/employers" className="font-bold text-brand-blue-700 hover:underline">
              Learn about employer partnerships
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
