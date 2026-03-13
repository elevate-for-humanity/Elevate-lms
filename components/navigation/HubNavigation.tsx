'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  id: string;
  name: string;
  href: string;
  description: string;
  icon?: string;
  order_index: number;
}

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  items: NavItem[];
  order_index: number;
}

interface Props {
  initialCategories?: NavCategory[];
}

const DEFAULT_NAVIGATION: NavCategory[] = [
  {
    id: 'businesses',
    name: 'Businesses',
    slug: 'businesses',
    order_index: 1,
    items: [
      { id: '1', name: 'Supersonic Fast Cash', href: '/supersonic-fast-cash', description: 'Tax preparation & financial services', order_index: 1 },
      { id: '2', name: 'Kingdom Konnect', href: '/kingdom-konnect', description: 'Faith-based community services', order_index: 2 },
      { id: '3', name: 'Serene Comfort Care', href: '/serene-comfort-care', description: 'Professional home care', order_index: 3 },
      { id: '4', name: 'Urban Build Crew', href: '/urban-build-crew', description: 'Construction & building services', order_index: 4 },
      { id: '5', name: 'Selfish Inc', href: '/selfish-inc', description: 'Business services', order_index: 5 },
      { id: '6', name: 'Rise Foundation', href: '/rise-foundation', description: 'Nonprofit foundation', order_index: 6 },
    ],
  },
  {
    id: 'training',
    name: 'Training',
    slug: 'training',
    order_index: 2,
    items: [
      { id: '7', name: 'Programs', href: '/programs', description: '100+ career training programs', order_index: 1 },
      { id: '8', name: 'Courses', href: '/courses', description: 'Individual courses', order_index: 2 },
      { id: '9', name: 'Apprenticeships', href: '/apprenticeships', description: 'Earn while you learn', order_index: 3 },
      { id: '10', name: 'Pathways', href: '/pathways', description: 'Career pathways', order_index: 4 },
      { id: '11', name: 'Certificates', href: '/certificates', description: 'Earn credentials', order_index: 5 },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    order_index: 3,
    items: [
      { id: '12', name: 'Career Services', href: '/career-services', description: 'Job placement & career support', order_index: 1 },
      { id: '13', name: 'Career Courses', href: '/career-services/courses', description: 'Resume, interview & job search courses', order_index: 2 },
      { id: '14', name: 'Marketplace', href: '/marketplace', description: 'Service marketplace', order_index: 3 },
      { id: '15', name: 'Booking & Scheduling', href: '/booking', description: 'Book appointments & services', order_index: 4 },
      { id: '16', name: 'Advising', href: '/advising', description: 'Academic advising', order_index: 5 },
      { id: '17', name: 'Mentorship', href: '/mentorship', description: 'One-on-one mentoring', order_index: 6 },
      { id: '18', name: 'Tax Services (VITA)', href: '/tax', description: 'Free tax preparation', order_index: 7 },
      { id: '19', name: 'Support', href: '/support', description: 'Get help & support', order_index: 8 },
    ],
  },
  {
    id: 'ai',
    name: 'AI Tools',
    slug: 'ai',
    order_index: 4,
    items: [
      { id: '20', name: 'Tools', href: '/ai', description: 'Automated tools & services', order_index: 1 },
      { id: '21', name: 'AI Chat', href: '/ai-chat', description: 'Chat with AI assistant', order_index: 2 },
      { id: '22', name: 'AI Studio', href: '/ai-studio', description: 'Create content with AI', order_index: 3 },
      { id: '23', name: 'AI Tutor', href: '/ai-tutor', description: 'Personal AI tutor', order_index: 4 },
    ],
  },
  {
    id: 'employers',
    name: 'Employers',
    slug: 'employers',
    order_index: 5,
    items: [
      { id: '24', name: 'Hire Graduates', href: '/hire-graduates', description: 'Recruit trained talent', order_index: 1 },
      { id: '25', name: 'OJT & Funding', href: '/ojt-and-funding', description: 'On-the-job training programs', order_index: 2 },
      { id: '26', name: 'Industries', href: '/industries', description: 'Industry partnerships', order_index: 3 },
      { id: '27', name: 'Workforce Partners', href: '/workforce-partners', description: 'Partner network', order_index: 4 },
      { id: '28', name: 'Employer Portal', href: '/employer', description: 'Employer dashboard', order_index: 5 },
    ],
  },
  {
    id: 'partnerships',
    name: 'Partnerships',
    slug: 'partnerships',
    order_index: 6,
    items: [
      { id: '29', name: 'Partners', href: '/partners', description: 'Partner with us', order_index: 1 },
      { id: '30', name: 'SNAP-ET', href: '/snap-et-partner', description: 'SNAP Employment & Training', order_index: 2 },
      { id: '31', name: 'FSSA Partnership', href: '/fssa-partnership-request', description: 'Family & Social Services', order_index: 3 },
      { id: '32', name: 'WorkOne', href: '/workone-partner-packet', description: 'WorkOne partnership', order_index: 4 },
      { id: '33', name: 'JRI', href: '/jri', description: 'Job Ready Indy', order_index: 5 },
      { id: '34', name: 'Franchise', href: '/franchise', description: 'Franchise opportunities', order_index: 6 },
      { id: '35', name: 'White Label', href: '/white-label', description: 'White-label licensing', order_index: 7 },
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    slug: 'resources',
    order_index: 7,
    items: [
      { id: '36', name: 'Support Services', href: '/support', description: 'Barrier removal & assistance', order_index: 1 },
      { id: '37', name: 'Help Center', href: '/help', description: 'Get support', order_index: 2 },
      { id: '38', name: 'Documentation', href: '/docs', description: 'Platform documentation', order_index: 3 },
      { id: '39', name: 'Forms', href: '/forms', description: 'Access forms', order_index: 4 },
      { id: '40', name: 'Grants & Funding', href: '/grants', description: 'Financial assistance', order_index: 5 },
      { id: '41', name: 'FAQ', href: '/faq', description: 'Frequently asked questions', order_index: 6 },
      { id: '42', name: 'Contact', href: '/contact', description: 'Get in touch', order_index: 7 },
      { id: '43', name: 'About', href: '/about', description: 'Learn about us', order_index: 8 },
    ],
  },
];

export function HubNavigation({ initialCategories }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>(initialCategories || DEFAULT_NAVIGATION);
  const [loading, setLoading] = useState(!initialCategories);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    // Fetch user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Try to fetch navigation from database
    async function fetchNavigation() {
      if (initialCategories) return;

      try {
        const { data: navCategories, error } = await supabase
          .from('navigation_categories')
          .select(`
            id,
            name,
            slug,
            order_index,
            navigation_items (
              id,
              name,
              href,
              description,
              icon,
              order_index
            )
          `)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!error && navCategories && navCategories.length > 0) {
          const formattedCategories: NavCategory[] = navCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            order_index: cat.order_index,
            items: (cat.navigation_items || []).sort((a: NavItem, b: NavItem) => a.order_index - b.order_index),
          }));
          setCategories(formattedCategories);
        }
      } catch (err) {
        console.error('Error fetching navigation:', err);
        // Keep default navigation
      } finally {
        setLoading(false);
      }
    }

    fetchNavigation();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialCategories]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm" aria-label="Hub navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-brand-blue-600">
              Elevate Hub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              categories.map((category) => (
                <NavDropdown key={category.id} title={category.name} items={category.items} />
              ))
            )}

            <div className="flex items-center gap-3 ml-4">
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                >
                  Sign In
                </Link>
              )}
              <Link 
                href="/apply" 
                className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              categories.map((category) => (
                <MobileSection 
                  key={category.id} 
                  title={category.name} 
                  items={category.items} 
                  onItemClick={closeMobileMenu}
                />
              ))
            )}

            <div className="pt-4 border-t space-y-2">
              {user ? (
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-3 text-center text-brand-blue-600 border border-brand-blue-600 rounded-lg hover:bg-brand-blue-50"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 text-center text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/apply"
                className="block w-full px-4 py-3 bg-brand-blue-600 text-white text-center rounded-lg hover:bg-brand-blue-700"
                onClick={closeMobileMenu}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavDropdown({ title, items }: { title: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 text-gray-700 hover:text-brand-blue-600 font-medium py-2">
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border p-2 space-y-1 z-50">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSection({ 
  title, 
  items, 
  onItemClick 
}: { 
  title: string; 
  items: NavItem[]; 
  onItemClick: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 py-2"
      >
        {title}
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-1 pl-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block py-2 text-gray-600 hover:text-brand-blue-600"
              onClick={onItemClick}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default HubNavigation;
