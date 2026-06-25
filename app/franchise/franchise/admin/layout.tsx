'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Users,
  FileText, 
  DollarSign,
  BarChart3,
  Settings
} from 'lucide-react';

const navItems = [
  { href: '/franchise/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/franchise/admin/offices', label: 'Offices', icon: Building2 },
  { href: '/franchise/admin/preparers', label: 'All Preparers', icon: Users },
  { href: '/franchise/admin/returns', label: 'All Returns', icon: FileText },
  { href: '/franchise/admin/royalties', label: 'Royalties', icon: DollarSign },
  { href: '/franchise/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/franchise/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Franchise Admin</h2>
          <p className="text-sm text-muted-foreground">System Management</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
