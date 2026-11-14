'use client';

import React from 'react';
import { Template, ColorScheme, LayoutStyle } from './index';
import {
  GraduationCap,
  Users,
  Award,
  ArrowRight,
  Clock,
  BarChart3,
  Star,
  Menu,
  ChevronRight,
  Play,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface TemplateProps {
  template: Template;
  colorScheme: ColorScheme;
  content: {
    branding: { logoText: string; tagline: string };
    homepage: {
      heroTitle: string;
      heroSubtitle: string;
      heroCtaText: string;
      features: Array<{ title: string; description: string }>;
    };
    programs: Array<{ name: string; description: string; duration: string; level: string }>;
    navigation: Array<{ label: string; href: string }>;
    footer: { description: string; contactEmail: string };
  };
}

// ============================================
// HERO COMPONENTS BY STYLE
// ============================================

export function HeroCentered({ template, colorScheme, content }: TemplateProps) {
  return (
    <section
      className="py-24 px-4 text-center"
      style={{
        background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-6xl font-black text-white mb-6"
          style={{ fontFamily: `${template.fonts.heading}, sans-serif` }}
        >
          {content.homepage.heroTitle}
        </h1>
        <p
          className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
          style={{ fontFamily: `${template.fonts.body}, sans-serif` }}
        >
          {content.homepage.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-8 py-4 rounded-lg font-bold text-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: colorScheme.accent,
              color: 'white',
              borderRadius:
                template.layout.buttonStyle === 'pill'
                  ? '9999px'
                  : template.layout.buttonStyle === 'square'
                    ? '4px'
                    : '8px',
            }}
          >
            {content.homepage.heroCtaText}
            <ArrowRight className="inline-block ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function HeroSplit({ template, colorScheme, content }: TemplateProps) {
  return (
    <section
      className="min-h-[80vh] flex items-center"
      style={{ backgroundColor: colorScheme.background }}
    >
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            className="text-4xl md:text-5xl font-black mb-6"
            style={{ fontFamily: `${template.fonts.heading}, sans-serif`, color: colorScheme.text }}
          >
            {content.homepage.heroTitle}
          </h1>
          <p
            className="text-lg mb-8"
            style={{
              fontFamily: `${template.fonts.body}, sans-serif`,
              color: colorScheme.textMuted,
            }}
          >
            {content.homepage.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-6 py-3 font-bold transition-colors"
              style={{
                backgroundColor: colorScheme.primary,
                color: 'white',
                borderRadius:
                  template.layout.buttonStyle === 'pill'
                    ? '9999px'
                    : template.layout.buttonStyle === 'square'
                      ? '4px'
                      : '8px',
              }}
            >
              {content.homepage.heroCtaText}
            </button>
            <button
              className="px-6 py-3 font-bold border-2 transition-colors"
              style={{
                borderColor: colorScheme.primary,
                color: colorScheme.primary,
                borderRadius:
                  template.layout.buttonStyle === 'pill'
                    ? '9999px'
                    : template.layout.buttonStyle === 'square'
                      ? '4px'
                      : '8px',
              }}
            >
              Learn More
            </button>
          </div>
        </div>
        <div
          className="aspect-video rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: colorScheme.surface }}
        >
          <Play className="w-16 h-16" style={{ color: colorScheme.primary }} />
        </div>
      </div>
    </section>
  );
}

export function HeroFullwidth({ template, colorScheme, content }: TemplateProps) {
  return (
    <section
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: colorScheme.primary }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 text-center px-4 max-w-5xl">
        <h1
          className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight"
          style={{ fontFamily: `${template.fonts.heading}, sans-serif` }}
        >
          {content.homepage.heroTitle}
        </h1>
        <p
          className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto"
          style={{ fontFamily: `${template.fonts.body}, sans-serif` }}
        >
          {content.homepage.heroSubtitle}
        </p>
        <button
          className="px-10 py-5 font-bold text-xl uppercase tracking-wide transition-transform hover:scale-105"
          style={{
            backgroundColor: colorScheme.accent,
            color: colorScheme.primary,
            borderRadius: template.layout.buttonStyle === 'pill' ? '9999px' : '0',
          }}
        >
          {content.homepage.heroCtaText}
        </button>
      </div>
    </section>
  );
}

export function HeroMinimal({ template, colorScheme, content }: TemplateProps) {
  return (
    <section className="py-32 px-4" style={{ backgroundColor: colorScheme.background }}>
      <div className="max-w-3xl mx-auto">
        <p
          className="text-sm font-medium uppercase tracking-widest mb-4"
          style={{ color: colorScheme.secondary }}
        >
          Welcome to {content.branding.logoText}
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          style={{ fontFamily: `${template.fonts.heading}, sans-serif`, color: colorScheme.text }}
        >
          {content.homepage.heroTitle}
        </h1>
        <p
          className="text-lg mb-8 leading-relaxed"
          style={{ fontFamily: `${template.fonts.body}, sans-serif`, color: colorScheme.textMuted }}
        >
          {content.homepage.heroSubtitle}
        </p>
        <a
          href="#programs"
          className="inline-flex items-center gap-2 font-medium transition-colors"
          style={{ color: colorScheme.secondary }}
        >
          {content.homepage.heroCtaText}
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

// ============================================
// CARD COMPONENTS BY STYLE
// ============================================

export function ProgramCard({
  program,
  template,
  colorScheme,
}: {
  program: { name: string; description: string; duration: string; level: string };
  template: Template;
  colorScheme: ColorScheme;
}) {
  const cardStyles: Record<LayoutStyle['cardStyle'], React.CSSProperties> = {
    elevated: {
      backgroundColor: colorScheme.background,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: 'none',
    },
    bordered: {
      backgroundColor: colorScheme.background,
      boxShadow: 'none',
      border: `1px solid ${colorScheme.textMuted}30`,
    },
    flat: {
      backgroundColor: colorScheme.surface,
      boxShadow: 'none',
      border: 'none',
    },
    gradient: {
      background: `linear-gradient(135deg, ${colorScheme.surface} 0%, ${colorScheme.background} 100%)`,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: 'none',
    },
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
      style={cardStyles[template.layout.cardStyle]}
    >
      <div className="h-2" style={{ backgroundColor: colorScheme.primary }} />
      <div className="p-6">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            backgroundColor: `${colorScheme.accent}20`,
            color: colorScheme.accent,
          }}
        >
          {program.level}
        </span>
        <h3
          className="text-xl font-bold mb-2"
          style={{ fontFamily: `${template.fonts.heading}, sans-serif`, color: colorScheme.text }}
        >
          {program.name}
        </h3>
        <p className="mb-4" style={{ color: colorScheme.textMuted }}>
          {program.description}
        </p>
        <div className="flex items-center gap-4 text-sm" style={{ color: colorScheme.textMuted }}>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {program.duration}
          </span>
        </div>
        <button
          className="w-full mt-4 py-3 font-medium transition-colors"
          style={{
            backgroundColor: colorScheme.primary,
            color: 'white',
            borderRadius:
              template.layout.buttonStyle === 'pill'
                ? '9999px'
                : template.layout.buttonStyle === 'square'
                  ? '4px'
                  : '8px',
          }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}

// ============================================
// NAVIGATION COMPONENTS BY STYLE
// ============================================

export function Navigation({ template, colorScheme, content }: TemplateProps) {
  const navStyles: Record<LayoutStyle['navStyle'], React.CSSProperties> = {
    transparent: {
      backgroundColor: 'transparent',
      position: 'absolute' as const,
      color: 'white',
    },
    solid: {
      backgroundColor: colorScheme.primary,
      color: 'white',
    },
    floating: {
      backgroundColor: colorScheme.background,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      margin: '1rem',
      borderRadius: '1rem',
    },
    minimal: {
      backgroundColor: colorScheme.background,
      borderBottom: `1px solid ${colorScheme.textMuted}20`,
    },
  };

  const isLight = template.layout.navStyle === 'floating' || template.layout.navStyle === 'minimal';

  return (
    <header className="sticky top-0 z-50 w-full" style={navStyles[template.layout.navStyle]}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <GraduationCap
              className="w-8 h-8"
              style={{ color: isLight ? colorScheme.primary : 'white' }}
            />
            <span
              className="font-bold text-xl"
              style={{
                fontFamily: `${template.fonts.heading}, sans-serif`,
                color: isLight ? colorScheme.text : 'white',
              }}
            >
              {content.branding.logoText}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {content.navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition-colors"
                style={{
                  color: isLight ? colorScheme.textMuted : 'rgba(255,255,255,0.9)',
                  fontFamily: `${template.fonts.body}, sans-serif`,
                }}
              >
                {item.label}
              </a>
            ))}
            <button
              className="px-5 py-2 font-medium"
              style={{
                backgroundColor: isLight ? colorScheme.primary : colorScheme.accent,
                color: 'white',
                borderRadius:
                  template.layout.buttonStyle === 'pill'
                    ? '9999px'
                    : template.layout.buttonStyle === 'square'
                      ? '4px'
                      : '8px',
              }}
            >
              Get Started
            </button>
          </nav>

          <button className="md:hidden" style={{ color: isLight ? colorScheme.text : 'white' }}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// FEATURES SECTION
// ============================================

export function FeaturesSection({ template, colorScheme, content }: TemplateProps) {
  const icons = [GraduationCap, Users, Award, CheckCircle, Star, BarChart3];

  return (
    <section
      className="py-20 px-4"
      style={{
        backgroundColor: colorScheme.background,
        paddingTop:
          template.layout.spacing === 'spacious'
            ? '6rem'
            : template.layout.spacing === 'compact'
              ? '3rem'
              : '5rem',
        paddingBottom:
          template.layout.spacing === 'spacious'
            ? '6rem'
            : template.layout.spacing === 'compact'
              ? '3rem'
              : '5rem',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-black text-center mb-12"
          style={{ fontFamily: `${template.fonts.heading}, sans-serif`, color: colorScheme.text }}
        >
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {content.homepage.features.map((feature, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <div key={feature.title} className="text-center p-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colorScheme.primary}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: colorScheme.primary }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    fontFamily: `${template.fonts.heading}, sans-serif`,
                    color: colorScheme.text,
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: colorScheme.textMuted }}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER COMPONENT
// ============================================

export function Footer({ template, colorScheme, content }: TemplateProps) {
  return (
    <footer className="py-12 px-4" style={{ backgroundColor: colorScheme.primary }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
              <span
                className="font-bold text-white"
                style={{ fontFamily: `${template.fonts.heading}, sans-serif` }}
              >
                {content.branding.logoText}
              </span>
            </div>
            <p className="text-white/70 text-sm">{content.footer.description}</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Programs</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              {content.programs.map((p) => (
                <li key={p.name}>
                  <a href="#" className="hover:text-white">
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {content.footer.contactEmail}
              </p>
            </div>
          </div>
        </div>
        <div
          className="border-t pt-8 text-center text-white/50 text-sm"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          © {new Date().getFullYear()} {content.branding.logoText}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN TEMPLATE RENDERER
// ============================================

export function TemplateRenderer({ template, colorScheme, content }: TemplateProps) {
  // Select hero based on layout style
  const HeroComponent = {
    centered: HeroCentered,
    split: HeroSplit,
    fullwidth: HeroFullwidth,
    minimal: HeroMinimal,
    video: HeroSplit, // Fallback to split for video
  }[template.layout.heroStyle];

  return (
    <>
      {/* Google Fonts */}
      <link rel="stylesheet" href={template.fonts.googleFontsUrl} />

      <div style={{ fontFamily: `${template.fonts.body}, sans-serif` }}>
        <Navigation template={template} colorScheme={colorScheme} content={content} />
        <HeroComponent template={template} colorScheme={colorScheme} content={content} />
        <FeaturesSection template={template} colorScheme={colorScheme} content={content} />

        {/* Programs Section */}
        <section className="py-20 px-4" style={{ backgroundColor: colorScheme.surface }}>
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-black text-center mb-4"
              style={{
                fontFamily: `${template.fonts.heading}, sans-serif`,
                color: colorScheme.text,
              }}
            >
              Our Programs
            </h2>
            <p
              className="text-center mb-12 max-w-2xl mx-auto"
              style={{ color: colorScheme.textMuted }}
            >
              Industry-recognized training programs designed to launch your career.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {content.programs.map((program) => (
                <ProgramCard
                  key={program.name}
                  program={program}
                  template={template}
                  colorScheme={colorScheme}
                />
              ))}
            </div>
          </div>
        </section>

        <Footer template={template} colorScheme={colorScheme} content={content} />
      </div>
    </>
  );
}
