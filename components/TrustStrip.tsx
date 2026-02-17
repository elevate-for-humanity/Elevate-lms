"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, GraduationCap, Briefcase, Award, TrendingUp, Building2 } from 'lucide-react';

interface TrustStats {
  studentsEnrolled: number;
  programsOffered: number;
  jobPlacementRate: number;
  certificatesIssued: number;
  employerPartners: number;
  fundingSecured: number;
}

interface Props {
  variant?: 'default' | 'compact' | 'detailed';
  showAnimation?: boolean;
  className?: string;
}

export default function TrustStrip({ variant = 'default', showAnimation = true, className }: Props) {
  const [stats, setStats] = useState<TrustStats>({
    studentsEnrolled: 0,
    programsOffered: 0,
    jobPlacementRate: 0,
    certificatesIssued: 0,
    employerPartners: 0,
    fundingSecured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState<TrustStats>({
    studentsEnrolled: 0,
    programsOffered: 0,
    jobPlacementRate: 0,
    certificatesIssued: 0,
    employerPartners: 0,
    fundingSecured: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      // Use fallback stats when Supabase is not configured
      const fallbackStats: TrustStats = {
        studentsEnrolled: 2500,
        programsOffered: 56,
        jobPlacementRate: 94,
        certificatesIssued: 1800,
        employerPartners: 150,
        fundingSecured: 5000000,
      };

      if (!supabase) {
        setStats(fallbackStats);
        if (showAnimation) {
          animateNumbers(fallbackStats);
        } else {
          setAnimatedStats(fallbackStats);
        }
        setLoading(false);
        return;
      }

      try {
        // Fetch real stats from database
        const [
          { count: studentsCount },
          { count: programsCount },
          { count: certificatesCount },
          { count: employersCount },
          { data: siteStats },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('training_programs').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('certificates').select('*', { count: 'exact', head: true }),
          supabase.from('employer_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('site_settings').select('value').eq('key', 'trust_stats').single(),
        ]);

        // Parse site stats or use defaults
        const customStats = siteStats?.value ? JSON.parse(siteStats.value) : {};

        const fetchedStats: TrustStats = {
          studentsEnrolled: studentsCount || customStats.studentsEnrolled || 2500,
          programsOffered: programsCount || customStats.programsOffered || 56,
          jobPlacementRate: customStats.jobPlacementRate || 94,
          certificatesIssued: certificatesCount || customStats.certificatesIssued || 1800,
          employerPartners: employersCount || customStats.employerPartners || 150,
          fundingSecured: customStats.fundingSecured || 5000000,
        };

        setStats(fetchedStats);

        // Animate numbers if enabled
        if (showAnimation) {
          animateNumbers(fetchedStats);
        } else {
          setAnimatedStats(fetchedStats);
        }
      } catch (err) {
        console.error('Error fetching trust stats:', err);
        setStats(fallbackStats);
        setAnimatedStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [showAnimation]);

  const animateNumbers = (targetStats: TrustStats) => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        studentsEnrolled: Math.round(targetStats.studentsEnrolled * easeOut),
        programsOffered: Math.round(targetStats.programsOffered * easeOut),
        jobPlacementRate: Math.round(targetStats.jobPlacementRate * easeOut),
        certificatesIssued: Math.round(targetStats.certificatesIssued * easeOut),
        employerPartners: Math.round(targetStats.employerPartners * easeOut),
        fundingSecured: Math.round(targetStats.fundingSecured * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats(targetStats);
      }
    }, stepDuration);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  if (loading) {
    return (
      <section className={`py-10 bg-slate-50 border-y ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-4 text-center max-w-4xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <section className={`py-8 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-extrabold">{formatNumber(animatedStats.studentsEnrolled)}+</div>
              <div className="text-sm text-brand-red-100 font-medium">Students Trained</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">{animatedStats.jobPlacementRate}%</div>
              <div className="text-sm text-brand-red-100 font-medium">Job Placement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">$0</div>
              <div className="text-sm text-brand-red-100 font-medium">Cost to Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">100%</div>
              <div className="text-sm text-brand-red-100 font-medium">Funded Programs</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'detailed') {
    return (
      <section className={`py-16 bg-white ${className || ''}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Thousands</h2>
          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-6 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-brand-blue-50 hover:bg-brand-blue-100 transition">
              <Users className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{formatNumber(animatedStats.studentsEnrolled)}+</div>
              <div className="text-sm text-gray-600">Students Enrolled</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-brand-green-50 hover:bg-brand-green-100 transition">
              <GraduationCap className="w-8 h-8 text-brand-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{animatedStats.programsOffered}</div>
              <div className="text-sm text-gray-600">Training Programs</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{animatedStats.jobPlacementRate}%</div>
              <div className="text-sm text-gray-600">Job Placement Rate</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-brand-orange-50 hover:bg-brand-orange-100 transition">
              <Award className="w-8 h-8 text-brand-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{formatNumber(animatedStats.certificatesIssued)}</div>
              <div className="text-sm text-gray-600">Certificates Issued</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition">
              <Briefcase className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{animatedStats.employerPartners}+</div>
              <div className="text-sm text-gray-600">Employer Partners</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition">
              <Building2 className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{formatNumber(animatedStats.fundingSecured)}</div>
              <div className="text-sm text-gray-600">Funding Secured</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section className={`py-10 bg-slate-50 border-y ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-4 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">$0</div>
            <div className="text-gray-600">Cost to Students</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900">100%</div>
            <div className="text-gray-600">Funded Programs</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-blue-600">{formatNumber(animatedStats.studentsEnrolled)}+</div>
            <div className="text-gray-600">Students Trained</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-green-600">{animatedStats.jobPlacementRate}%</div>
            <div className="text-gray-600">Job Placement</div>
          </div>
        </div>
      </div>
    </section>
  );
}
