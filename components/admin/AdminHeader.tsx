'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EnvironmentBadge from './EnvironmentBadge';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Rocket,
  Menu,
  X,
  ChevronDown,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    icon: Users,
    items: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Students', href: '/admin/students' },
      { name: 'Instructors', href: '/admin/instructors' },
      { name: 'Applicants', href: '/admin/applicants' },
      { name: 'Leads', href: '/admin/leads' },
    ],
  },
  {
    name: 'Programs',
    icon: GraduationCap,
    items: [
      { name: 'All Programs', href: '/admin/programs' },
      { name: 'Courses', href: '/admin/courses' },
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'Certificates', href: '/admin/certificates' },
      { name: 'Apprenticeships', href: '/admin/apprenticeships' },
    ],
  },
  {
    name: 'Partners',
    icon: Building2,
    items: [
      { name: 'All Partners', href: '/admin/partners' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'Shops', href: '/admin/shops' },
      { name: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    items: [
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Enrollment Reports', href: '/admin/reports/enrollment' },
      { name: 'Financial Reports', href: '/admin/reports/financial' },
      { name: 'Compliance', href: '/admin/compliance' },
    ],
  },
  {
    name: 'Content',
    icon: FileText,
    items: [
      { name: 'Course Builder', href: '/admin/course-builder' },
      { name: 'Documents', href: '/admin/documents' },
      { name: 'Blog', href: '/admin/blog' },
      { name: 'Media', href: '/admin/videos' },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/admin/settings' },
      { name: 'Integrations', href: '/admin/integrations' },
      { name: 'API Keys', href: '/admin/api-keys' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'System Health', href: '/admin/system-health' },
      { name: 'Advanced Tools', href: '/admin/advanced-tools' },
    ],
  },
];

// Environment detection for badge
const isNetlify = process.env.NEXT_PUBLIC_NETLIFY === 'true';
const netlifyContext = process.env.NEXT_PUBLIC_CONTEXT;
const isProd = isNetlify 
  ? netlifyContext === 'production' 
  : process.env.NODE_ENV === 'production';
const isPreview = isNetlify 
  ? netlifyContext === 'deploy-preview' || netlifyContext === 'branch-deploy'
  : false;

function getEnvBadge(): { label: string; color: string } {
  if (isProd) {
    return { label: 'PRODUCTION', color: 'bg-brand-red-100 text-brand-red-800 border-brand-red-200' };
  }
  if (isPreview) {
    return { label: 'PREVIEW', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }
  return { label: 'DEVELOPMENT', color: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200' };
}

export default function AdminHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const envBadge = getEnvBadge();

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      // Trigger Netlify build hook or GitHub Actions
      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Deployment triggered successfully!');
      } else {
        alert('Failed to trigger deployment');
      }
    } catch (error) {
      alert('Error triggering deployment');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-[9999] shadow-lg">
      <div className="h-full flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-brand-blue-400" />
          <span className="font-bold text-lg hidden sm:block">Admin Panel</span>
        </Link>
        
        {/* Environment Badge */}
        <EnvironmentBadge label={envBadge.label} color={envBadge.color} />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Admin navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.name} className="relative">
              {section.href ? (
                <Link
                  href={section.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === section.href
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.name}
                </Link>
              ) : (
                <button
                  onClick={() => setOpenDropdown(openDropdown === section.name ? null : section.name)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    section.items?.some((item) => pathname.startsWith(item.href))
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.name}
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}

              {/* Dropdown */}
              {section.items && openDropdown === section.name && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`block px-4 py-2 text-sm ${
                        pathname === item.href
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Deploy Button */}
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-brand-green-800 rounded-md text-sm font-medium transition-colors"
          >
            {deploying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/elevateforhumanity/Elevate-lms"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            GitHub
          </a>

          {/* Back to Site */}
          <Link
            href="/"
            className="hidden sm:block px-3 py-1.5 text-slate-300 hover:text-white text-sm"
          >
            View Site
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-900 border-t border-slate-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.name}>
                {section.href ? (
                  <Link
                    href={section.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800"
                  >
                    <section.icon className="w-5 h-5" />
                    {section.name}
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400 font-medium">
                      <section.icon className="w-5 h-5" />
                      {section.name}
                    </div>
                    <div className="ml-7 space-y-1">
                      {section.items?.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Mobile Deploy */}
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-green-600 hover:bg-brand-green-700 rounded-md text-sm font-medium mt-4"
            >
              {deploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {deploying ? 'Deploying...' : 'Deploy to Production'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
