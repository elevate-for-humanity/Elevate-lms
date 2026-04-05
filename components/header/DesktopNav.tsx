'use client';

import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
}

interface DesktopNavProps {
  items: NavItem[];
}

export function DesktopNav({ items: initialItems }: DesktopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [items, setItems] = useState<NavItem[]>(initialItems);
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const supabase = createClient();

  // Load dynamic nav items from DB (e.g., for role-based navigation)
  useEffect(() => {
    async function loadDynamicNavItems() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's role to potentially show role-specific nav items
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Load any dynamic nav items from DB
      const { data: dynamicItems } = await supabase
        .from('navigation_items')
        .select('name, href, parent_name, sort_order, roles_allowed')
        .eq('is_active', true)
        .order('sort_order');

      if (dynamicItems && dynamicItems.length > 0) {
        // Filter by role and merge with static items
        const roleItems = dynamicItems.filter(
          (item: any) => !item.roles_allowed || item.roles_allowed.includes(profile?.role)
        );
        // Could merge roleItems with initialItems here if needed
      }
    }
    loadDynamicNavItems();
  }, [supabase]);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(name);
    setFocusedIndex(-1);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
      setFocusedIndex(-1);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent, name: string, hasChildren: boolean, childrenCount: number = 0) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren) {
        const newState = openDropdown === name ? null : name;
        setOpenDropdown(newState);
        if (newState) {
          setFocusedIndex(0);
          setTimeout(() => {
            const firstLink = dropdownRefs.current[name]?.querySelector('a');
            firstLink?.focus();
          }, 0);
        }
      }
    }
    if (e.key === 'Escape') {
      setOpenDropdown(null);
      setFocusedIndex(-1);
      buttonRefs.current[name]?.focus();
    }
    if (e.key === 'ArrowDown' && hasChildren) {
      e.preventDefault();
      if (openDropdown !== name) {
        setOpenDropdown(name);
        setFocusedIndex(0);
        setTimeout(() => {
          const firstLink = dropdownRefs.current[name]?.querySelector('a');
          firstLink?.focus();
        }, 0);
      } else {
        const nextIndex = Math.min(focusedIndex + 1, childrenCount - 1);
        setFocusedIndex(nextIndex);
        const links = dropdownRefs.current[name]?.querySelectorAll('a');
        (links?.[nextIndex] as HTMLElement)?.focus();
      }
    }
    if (e.key === 'ArrowUp' && hasChildren && openDropdown === name) {
      e.preventDefault();
      if (focusedIndex <= 0) {
        setOpenDropdown(null);
        setFocusedIndex(-1);
        buttonRefs.current[name]?.focus();
      } else {
        const prevIndex = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(prevIndex);
        const links = dropdownRefs.current[name]?.querySelectorAll('a');
        (links?.[prevIndex] as HTMLElement)?.focus();
      }
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent, name: string, index: number, childrenCount: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, childrenCount - 1);
      setFocusedIndex(nextIndex);
      const links = dropdownRefs.current[name]?.querySelectorAll('a');
      (links?.[nextIndex] as HTMLElement)?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        setOpenDropdown(null);
        setFocusedIndex(-1);
        buttonRefs.current[name]?.focus();
      } else {
        const prevIndex = Math.max(index - 1, 0);
        setFocusedIndex(prevIndex);
        const links = dropdownRefs.current[name]?.querySelectorAll('a');
        (links?.[prevIndex] as HTMLElement)?.focus();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpenDropdown(null);
      setFocusedIndex(-1);
      buttonRefs.current[name]?.focus();
    }
    if (e.key === 'Tab' && !e.shiftKey && index === childrenCount - 1) {
      setOpenDropdown(null);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Main navigation">
      {items.map((item) => {
        const isOpen = openDropdown === item.name;
        const isActive = pathname === item.href;

        if (item.children) {
          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.name)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                ref={(el) => (buttonRefs.current[item.name] = el)}
                onClick={() => {
                  const newState = isOpen ? null : item.name;
                  setOpenDropdown(newState);
                  if (newState) {
                    setTimeout(() => {
                      const firstLink = dropdownRefs.current[item.name]?.querySelector('a');
                      firstLink?.focus();
                    }, 0);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, item.name, true, item.children?.length || 0)}
                className="flex items-center gap-1 text-black hover:text-brand-blue-600 font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:ring-offset-2 rounded px-3 py-2"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={`dropdown-${item.name}`}
              >
                {item.name}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div
                  ref={(el) => (dropdownRefs.current[item.name] = el)}
                  id={`dropdown-${item.name}`}
                  className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  role="menu"
                  aria-label={`${item.name} submenu`}
                >
                  {item.children.map((child, index) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100 transition focus:outline-none focus:bg-brand-blue-50 focus:text-brand-blue-600"
                      role="menuitem"
                      onClick={() => {
                        setOpenDropdown(null);
                        setFocusedIndex(-1);
                      }}
                      onKeyDown={(e) => handleDropdownKeyDown(e, item.name, index, item.children?.length || 0)}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`text-black hover:text-brand-blue-600 font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:ring-offset-2 rounded px-2 py-2 ${
              isActive ? 'text-brand-blue-600' : ''
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
