"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Briefcase, TrendingUp, Users, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Partner {
  id: string;
  name: string;
  industry: string;
  hiring_rate?: number;
  logo_url?: string;
  website?: string;
  is_featured: boolean;
}

interface Stats {
  totalPartners: number;
  placementRate: number;
  graduatesHired: number;
  avgSalary: number;
}

interface Props {
  limit?: number;
  showStats?: boolean;
  showCTA?: boolean;
  variant?: 'full' | 'compact' | 'grid';
}

const industryColors: Record<string, string> = {
  Healthcare: 'bg-blue-100 text-blue-700',
  HVAC: 'bg-orange-100 text-orange-700',
  Beauty: 'bg-pink-100 text-pink-700',
  Transportation: 'bg-green-100 text-green-700',
  Technology: 'bg-purple-100 text-purple-700',
  Retail: 'bg-yellow-100 text-yellow-700',
  Manufacturing: 'bg-gray-100 text-gray-700',
  Pharmaceutical: 'bg-teal-100 text-teal-700',
  Hospitality: 'bg-indigo-100 text-indigo-700',
  'Food Service': 'bg-red-100 text-red-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Logistics: 'bg-cyan-100 text-cyan-700',
  'Medical Devices': 'bg-violet-100 text-violet-700',
  'Skilled Trades': 'bg-amber-100 text-amber-700',
};

const DEFAULT_PARTNERS: Partner[] = [
  { id: '1', name: 'IU Health', industry: 'Healthcare', hiring_rate: 95, is_featured: true },
  { id: '2', name: 'Community Health Network', industry: 'Healthcare', hiring_rate: 92, is_featured: true },
  { id: '3', name: 'Carrier', industry: 'HVAC', hiring_rate: 93, is_featured: true },
  { id: '4', name: 'Great Clips', industry: 'Beauty', hiring_rate: 94, is_featured: true },
  { id: '5', name: 'Schneider', industry: 'Transportation', hiring_rate: 96, is_featured: true },
  { id: '6', name: 'Amazon', industry: 'Technology', hiring_rate: 88, is_featured: true },
  { id: '7', name: 'Cummins', industry: 'Manufacturing', hiring_rate: 91, is_featured: true },
  { id: '8', name: 'Eli Lilly', industry: 'Pharmaceutical', hiring_rate: 90, is_featured: true },
  { id: '9', name: 'FedEx', industry: 'Logistics', hiring_rate: 90, is_featured: false },
  { id: '10', name: 'Marriott', industry: 'Hospitality', hiring_rate: 89, is_featured: false },
  { id: '11', name: 'JPMorgan Chase', industry: 'Finance', hiring_rate: 87, is_featured: false },
  { id: '12', name: 'Target', industry: 'Retail', hiring_rate: 87, is_featured: false },
];

export default function EmployerPartners({ 
  limit, 
  showStats = true, 
  showCTA = true,
  variant = 'full' 
}: Props) {
  const [partners, setPartners] = useState<Partner[]>(DEFAULT_PARTNERS);
  const [stats, setStats] = useState<Stats>({
    totalPartners: 50,
    placementRate: 94,
    graduatesHired: 2500,
    avgSalary: 52000,
  });
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      try {
        // Fetch employer partners from database
        let query = supabase
          .from('employer_profiles')
          .select('id, company_name, industry, hiring_rate, logo_url, website, is_featured')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('hiring_rate', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data: employerData, error } = await query;

        if (!error && employerData && employerData.length > 0) {
          const formattedPartners: Partner[] = employerData.map(e => ({
            id: e.id,
            name: e.company_name,
            industry: e.industry || 'Other',
            hiring_rate: e.hiring_rate,
            logo_url: e.logo_url,
            website: e.website,
            is_featured: e.is_featured || false,
          }));
          setPartners(formattedPartners);

          // Extract unique industries
          const uniqueIndustries = [...new Set(formattedPartners.map(p => p.industry))];
          setIndustries(uniqueIndustries);
        }

        // Fetch stats
        const { count: partnerCount } = await supabase
          .from('employer_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { data: siteStats } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'employer_stats')
          .single();

        if (siteStats?.value) {
          const parsedStats = JSON.parse(siteStats.value);
          setStats({
            totalPartners: partnerCount || parsedStats.totalPartners || 50,
            placementRate: parsedStats.placementRate || 94,
            graduatesHired: parsedStats.graduatesHired || 2500,
            avgSalary: parsedStats.avgSalary || 52000,
          });
        } else {
          setStats(prev => ({
            ...prev,
            totalPartners: partnerCount || prev.totalPartners,
          }));
        }

      } catch (err) {
        console.error('Error fetching employer data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  const displayPartners = limit ? partners.slice(0, limit) : partners;
  const row1 = displayPartners.slice(0, Math.ceil(displayPartners.length / 2));
  const row2 = displayPartners.slice(Math.ceil(displayPartners.length / 2));

  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Employer Partners</h2>
            <p className="text-gray-600">{stats.totalPartners}+ companies hire our graduates</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {displayPartners.slice(0, 8).map(partner => (
              <div 
                key={partner.id}
                className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
              >
                {partner.name}
              </div>
            ))}
          </div>
          {showCTA && (
            <div className="text-center mt-6">
              <Link href="/employers" className="text-blue-600 hover:underline font-medium">
                View all partners →
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'grid') {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Employer Partners</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our graduates work at leading companies across multiple industries
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayPartners.map(partner => (
              <div 
                key={partner.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{partner.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${industryColors[partner.industry] || 'bg-gray-100 text-gray-700'}`}>
                      {partner.industry}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Full variant
  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            {stats.totalPartners}+ Employer Partners
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Hired by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our graduates work at top companies across healthcare, technology, trades, and more.
          </p>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalPartners}+</div>
              <div className="text-gray-700 font-semibold">Employer Partners</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{stats.placementRate}%</div>
              <div className="text-gray-700 font-semibold">Placement Rate</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{stats.graduatesHired.toLocaleString()}+</div>
              <div className="text-gray-700 font-semibold">Graduates Hired</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">${(stats.avgSalary / 1000).toFixed(0)}K</div>
              <div className="text-gray-700 font-semibold">Avg. Starting Salary</div>
            </div>
          </div>
        )}

        {/* Partner Cards - Row 1 */}
        <div className="mb-8 overflow-hidden">
          <div className="flex gap-6 animate-scroll">
            {[...row1, ...row1].map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-64 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    {partner.logo_url ? (
                      <Image src={partner.logo_url} alt={partner.name} width={32} height={32} className="rounded" />
                    ) : (
                      <Building2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${industryColors[partner.industry] || 'bg-gray-100 text-gray-700'}`}>
                    {partner.industry}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
                {partner.hiring_rate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Hiring Rate:</span>
                    <span className="font-bold text-green-600">{partner.hiring_rate}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Partner Cards - Row 2 */}
        <div className="mb-16 overflow-hidden">
          <div className="flex gap-6 animate-scroll-reverse">
            {[...row2, ...row2].map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-64 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    {partner.logo_url ? (
                      <Image src={partner.logo_url} alt={partner.name} width={32} height={32} className="rounded" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${industryColors[partner.industry] || 'bg-gray-100 text-gray-700'}`}>
                    {partner.industry}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
                {partner.hiring_rate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Hiring Rate:</span>
                    <span className="font-bold text-green-600">{partner.hiring_rate}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Industries We Serve
          </h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(industryColors).map(industry => (
              <div
                key={industry}
                className={`${industryColors[industry]} rounded-lg p-4 text-center font-semibold hover:scale-105 transition-transform cursor-pointer`}
              >
                {industry}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {showCTA && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 text-center text-white">
            <Building2 className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-3xl font-bold mb-4">Partner With Us</h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join {stats.totalPartners}+ leading employers who hire our graduates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/employers"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg text-lg"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/hire-graduates"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all text-lg"
              >
                Hire Our Graduates
                <Users className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll-reverse {
          animation: scroll-reverse 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
