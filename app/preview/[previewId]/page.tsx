'use client';
/**
 * INTENTIONALLY PUBLIC — sales/demo preview shell.
 *
 * Data source: localStorage only. No DB reads. No Supabase queries.
 * Links to /store?preview=<id> for conversion.
 *
 * HARD RULE: Do NOT import createClient, or any
 * Supabase helper here. Do NOT add fetch() calls to internal APIs.
 * If this page needs protected data, add an auth gate first and
 * remove this comment block.
 *
 * Violation check (dev only): if supabase client is ever imported
 * into this file, the build will fail on the import itself because
 * this is a client component with no server context.
 */

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, Users, Award, ArrowRight, 
  Clock, BarChart3, Star,
  Menu, X, Lock, Play, ChevronRight,
  BookOpen, Trophy, Briefcase, Mail, Phone, MapPin
} from 'lucide-react';

// Pexels images for different industries (free to use)
const INDUSTRY_IMAGES: Record<string, { hero: string; programs: string[]; features: string[] }> = {
  default: {
    hero: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  technology: {
    hero: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  healthcare: {
    hero: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  construction: {
    hero: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/1216544/pexels-photo-1216544.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/2760243/pexels-photo-2760243.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  manufacturing: {
    hero: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/3846508/pexels-photo-3846508.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3846517/pexels-photo-3846517.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3846524/pexels-photo-3846524.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3846505/pexels-photo-3846505.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3846512/pexels-photo-3846512.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  hospitality: {
    hero: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/3201920/pexels-photo-3201920.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3201921/pexels-photo-3201921.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/3201922/pexels-photo-3201922.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  finance: {
    hero: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/7567434/pexels-photo-7567434.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/7567565/pexels-photo-7567565.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/7567444/pexels-photo-7567444.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/7567560/pexels-photo-7567560.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/6801647/pexels-photo-6801647.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
  transportation: {
    hero: 'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    programs: [
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/93398/pexels-photo-93398.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    ],
    features: [
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/93398/pexels-photo-93398.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
    ],
  },
};

function getIndustryImages(industry?: string): { hero: string; programs: string[]; features: string[] } {
  if (!industry) return INDUSTRY_IMAGES.default;
  const key = industry.toLowerCase();
  if (key.includes('tech') || key.includes('software') || key.includes('it') || key.includes('computer')) return INDUSTRY_IMAGES.technology;
  if (key.includes('health') || key.includes('medical') || key.includes('nursing') || key.includes('dental') || key.includes('pharmacy')) return INDUSTRY_IMAGES.healthcare;
  if (key.includes('construction') || key.includes('trade') || key.includes('hvac') || key.includes('electrical') || key.includes('plumbing') || key.includes('welding')) return INDUSTRY_IMAGES.construction;
  if (key.includes('manufacturing') || key.includes('industrial') || key.includes('factory')) return INDUSTRY_IMAGES.manufacturing;
  if (key.includes('hospitality') || key.includes('hotel') || key.includes('restaurant') || key.includes('culinary') || key.includes('food')) return INDUSTRY_IMAGES.hospitality;
  if (key.includes('finance') || key.includes('banking') || key.includes('accounting') || key.includes('tax')) return INDUSTRY_IMAGES.finance;
  if (key.includes('transport') || key.includes('cdl') || key.includes('trucking') || key.includes('logistics')) return INDUSTRY_IMAGES.transportation;
  return INDUSTRY_IMAGES.default;
}

interface SiteConfig {
  template?: {
    id: string;
    name: string;
    fonts: { heading: string; body: string; googleFontsUrl: string };
    colors: {
      primary: string;
      primaryDark: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      surfaceAlt: string;
      text: string;
      textMuted: string;
      textOnPrimary: string;
      border: string;
    };
    style: {
      borderRadius: string;
      heroStyle: string;
      cardStyle: string;
      buttonStyle: string;
    };
  };
  branding: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoText: string;
    tagline: string;
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    features: Array<{ title: string; description: string }>;
  };
  programs: Array<{ name: string; description: string; duration: string; level: string }>;
  stats?: { students: number; completionRate: string; employers: number; rating: string };
  testimonial?: { quote: string; author: string };
  navigation: Array<{ label: string; href: string }>;
  footer: { description: string; contactEmail: string };
  meta: { previewId: string; organizationName: string; industry?: string };
}

// Default template colors
const defaultColors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceAlt: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',
  border: '#e2e8f0',
};

export default function PreviewPage() {
  const params = useParams();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sitePreviewConfig');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
      } catch {
        // Invalid config
      }
    }
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Preview Not Found</h1>
          <p className="text-slate-600 mb-4">This preview may have expired.</p>
          <Link href="/builder" className="text-brand-blue-600 hover:underline">
            Generate a new site →
          </Link>
        </div>
      </div>
    );
  }

  // Get colors from template or branding
  const colors = config.template?.colors || {
    ...defaultColors,
    primary: config.branding.primaryColor,
    secondary: config.branding.secondaryColor || defaultColors.secondary,
    accent: config.branding.accentColor || defaultColors.accent,
  };

  const fonts = config.template?.fonts || {
    heading: 'Inter',
    body: 'Inter',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  };

  const style = config.template?.style || {
    borderRadius: 'lg',
    heroStyle: 'centered',
    cardStyle: 'elevated',
    buttonStyle: 'solid',
  };

  const { branding, homepage, programs, stats, testimonial, navigation, footer } = config;

  // Get industry-specific images
  const images = getIndustryImages(config.meta?.industry);

  // Border radius mapping
  const radiusClass = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[style.borderRadius] || 'rounded-lg';

  const buttonRadius = style.buttonStyle === 'solid' ? radiusClass : 'rounded-full';

  return (
    <>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Preview", href: "/preview" }, { label: "[Previewid]" }]} />
      </div>
{/* Google Fonts */}
      <link rel="stylesheet" href={fonts.googleFontsUrl} />
      
      <div 
        className="min-h-screen"
        style={{ 
          fontFamily: `${fonts.body}, sans-serif`,
          backgroundColor: colors.background,
          color: colors.text,
        }}
      >
        {/* Preview Banner */}
        <div 
          className="py-3 px-4 text-center text-sm font-medium"
          style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: colors.textOnPrimary }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <Lock className="w-4 h-4" />
            <span>Preview Mode - This is how your site will look</span>
            <Link
              href={`/store?preview=${params.previewId}`}
              className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-bold transition-colors"
            >
              Upgrade to Launch →
            </Link>
          </div>
        </div>

        {/* Header */}
        <header 
          className="sticky top-0 z-40 border-b"
          style={{ 
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <GraduationCap className="w-6 h-6" style={{ color: colors.textOnPrimary }} />
                </div>
                <span 
                  className="font-bold text-xl"
                  style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.text }}
                >
                  {branding.logoText}
                </span>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8">
                {navigation.map((item, idx) => (
                  <a
                    key={`nav-${idx}`}
                    href={item.href}
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: colors.textMuted }}
                  >
                    {item.label}
                  </a>
                ))}
                <button
                  className={`px-5 py-2 font-semibold transition-all hover:opacity-90 ${buttonRadius}`}
                  style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
                >
                  Get Started
                </button>
              </nav>

              {/* Mobile Menu */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ color: colors.text }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t px-4 py-4" style={{ borderColor: colors.border }}>
              {navigation.map((item, idx) => (
                <a
                  key={`mobile-nav-${idx}`}
                  href={item.href}
                  className="block py-2 font-medium"
                  style={{ color: colors.textMuted }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative w-full">
          <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
            <img src={images.hero} alt="Hero background" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="py-10" style={{ backgroundColor: colors.primary }}>
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight"
                style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.textOnPrimary }}
              >
                {homepage.heroTitle}
              </h1>
              <p
                className="text-lg md:text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed"
                style={{ color: colors.textOnPrimary }}
              >
                {homepage.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className={`px-8 py-4 font-bold text-lg transition-all hover:scale-105 hover:shadow-xl ${buttonRadius}`}
                  style={{ backgroundColor: colors.accent, color: '#ffffff' }}
                >
                  {homepage.heroCtaText}
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {stats && (
          <section className="py-16" style={{ backgroundColor: colors.background }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center p-6">
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Users className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                  <p className="text-4xl font-black mb-1" style={{ color: colors.primary }}>{stats.students}+</p>
                  <p className="font-medium" style={{ color: colors.textMuted }}>Students Trained</p>
                </div>
                <div className="text-center p-6">
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accent}15` }}
                  >
                    <Trophy className="w-8 h-8" style={{ color: colors.accent }} />
                  </div>
                  <p className="text-4xl font-black mb-1" style={{ color: colors.primary }}>{stats.completionRate}</p>
                  <p className="font-medium" style={{ color: colors.textMuted }}>Completion Rate</p>
                </div>
                <div className="text-center p-6">
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.secondary}15` }}
                  >
                    <Briefcase className="w-8 h-8" style={{ color: colors.secondary }} />
                  </div>
                  <p className="text-4xl font-black mb-1" style={{ color: colors.primary }}>{stats.employers}+</p>
                  <p className="font-medium" style={{ color: colors.textMuted }}>Partner Employers</p>
                </div>
                <div className="text-center p-6">
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Star className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                  <p className="text-4xl font-black mb-1" style={{ color: colors.primary }}>{stats.rating}</p>
                  <p className="font-medium" style={{ color: colors.textMuted }}>Student Rating</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trusted By Section */}
        <section className="py-12 border-y" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center text-sm font-medium mb-8 uppercase tracking-wider" style={{ color: colors.textMuted }}>
              Trusted by leading organizations
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              {['Company A', 'Company B', 'Company C', 'Company D', 'Company E'].map((company, idx) => (
                <div 
                  key={`company-${idx}`}
                  className="text-2xl font-bold"
                  style={{ color: colors.textMuted }}
                >
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4" style={{ backgroundColor: colors.background }}>
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-black text-center mb-4"
              style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.text }}
            >
              Why Choose Us
            </h2>
            <p className="text-center mb-16 max-w-2xl mx-auto text-lg" style={{ color: colors.textMuted }}>
              We provide everything you need to succeed in your career journey.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {homepage.features.map((feature, idx) => {
                const icons = [BookOpen, Trophy, Briefcase];
                const Icon = icons[idx % icons.length];
                return (
                  <div 
                    key={`feature-${idx}`} 
                    className={`group overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl ${radiusClass}`}
                    style={{ 
                      backgroundColor: colors.background,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {/* Feature Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={images.features[idx % images.features.length]}
                        alt={feature.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div 
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to top, ${colors.background}, transparent)` }}
                      />
                      <div 
                        className={`absolute bottom-4 left-4 w-12 h-12 flex items-center justify-center ${radiusClass}`}
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Icon className="w-6 h-6" style={{ color: colors.textOnPrimary }} />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 
                        className="text-xl font-bold mb-2"
                        style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.text }}
                      >
                        {feature.title}
                      </h3>
                      <p style={{ color: colors.textMuted }}>{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section className="py-20 px-4" style={{ backgroundColor: colors.surface }}>
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-black text-center mb-4"
              style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.text }}
            >
              Our Programs
            </h2>
            <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
              Industry-recognized training programs designed to launch your career.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {programs.map((program, idx) => (
                <div 
                  key={`program-${idx}`}
                  className={`overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl ${radiusClass}`}
                  style={{ 
                    backgroundColor: colors.background,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Program Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={images.programs[idx % images.programs.length]}
                      alt={program.name}
                      className="w-full h-full object-cover transition-transform hover:scale-110"
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(to top, ${colors.primary}40, transparent)` }}
                    />
                    <span 
                      className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold ${radiusClass}`}
                      style={{ backgroundColor: colors.accent, color: '#ffffff' }}
                    >
                      {program.level}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.text }}
                    >
                      {program.name}
                    </h3>
                    <p className="mb-4 line-clamp-2" style={{ color: colors.textMuted }}>{program.description}</p>
                    <div className="flex items-center justify-between text-sm mb-4" style={{ color: colors.textMuted }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {program.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Open Enrollment
                      </span>
                    </div>
                    <button
                      className={`w-full py-3 font-semibold transition-all hover:opacity-90 ${radiusClass}`}
                      style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
                    >
                      Learn More
                      <ArrowRight className="inline-block ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        {testimonial && (
          <section className="py-20 px-4" style={{ backgroundColor: colors.background }}>
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center gap-1 mb-6">
                {[1,2,3,4,5].map((i) => (
                  <Star key={`star-${i}`} className="w-6 h-6" style={{ fill: colors.accent, color: colors.accent }} />
                ))}
              </div>
              <blockquote 
                className="text-2xl md:text-3xl font-medium mb-6 italic"
                style={{ color: colors.text }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <p style={{ color: colors.textMuted }}>— {testimonial.author}</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section 
          className="py-20 px-4"
          style={{ backgroundColor: colors.primary }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.textOnPrimary }}
            >
              Questions? Contact Us
            </h2>
            <p className="text-xl mb-8 opacity-90" style={{ color: colors.textOnPrimary }}>
              Join hundreds of successful graduates. Your new career starts here.
            </p>
            <button
              className={`px-8 py-4 font-bold text-lg transition-transform hover:scale-105 ${buttonRadius}`}
              style={{ backgroundColor: colors.accent, color: '#ffffff' }}
            >
              Apply Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4" style={{ backgroundColor: colors.text }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6" style={{ color: colors.textOnPrimary }} />
                  <span 
                    className="font-bold"
                    style={{ fontFamily: `${fonts.heading}, sans-serif`, color: colors.textOnPrimary }}
                  >
                    {branding.logoText}
                  </span>
                </div>
                <p className="text-sm opacity-70" style={{ color: colors.textOnPrimary }}>
                  {footer.description}
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4" style={{ color: colors.textOnPrimary }}>Programs</h4>
                <ul className="space-y-2 text-sm opacity-70" style={{ color: colors.textOnPrimary }}>
                  {programs.map((p, idx) => (
                    <li key={`footer-program-${idx}`}>
                      <span className="hover:opacity-100 cursor-default">{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4" style={{ color: colors.textOnPrimary }}>Company</h4>
                <ul className="space-y-2 text-sm opacity-70" style={{ color: colors.textOnPrimary }}>
                  <li><span className="hover:opacity-100 cursor-default">About Us</span></li>
                  <li><span className="hover:opacity-100 cursor-default">Careers</span></li>
                  <li><span className="hover:opacity-100 cursor-default">Contact</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4" style={{ color: colors.textOnPrimary }}>Contact</h4>
                <p className="text-sm opacity-70" style={{ color: colors.textOnPrimary }}>
                  {footer.contactEmail}
                </p>
              </div>
            </div>
            <div 
              className="border-t pt-8 text-center text-sm opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: colors.textOnPrimary }}
            >
              © {new Date().getFullYear()} {branding.logoText}. All rights reserved.
            </div>
          </div>
        </footer>

        {/* Floating Upgrade Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={`/store?preview=${params.previewId}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ 
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              color: colors.textOnPrimary,
            }}
          >
            <Lock className="w-4 h-4" />
            Upgrade to Launch
          </Link>
        </div>
      </div>
    </>
  );
}
