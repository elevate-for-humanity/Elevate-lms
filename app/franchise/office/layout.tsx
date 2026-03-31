'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  FileText, 
  DollarSign,
  CheckSquare,
  Settings,
  CreditCard,
  Receipt
} from 'lucide-react';

const navItems = [
  { href: '/franchise/office', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/franchise/office/clients', label: 'Clients', icon: UserCircle },
  { href: '/franchise/office/preparers', label: 'Preparers', icon: Users },
  { href: '/franchise/office/returns', label: 'Returns', icon: FileText },
  { href: '/franchise/office/ero-queue', label: 'ERO Queue', icon: CheckSquare },
  { href: '/franchise/office/commissions', label: 'Commissions', icon: DollarSign },
  { href: '/franchise/office/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/franchise/office/fees', label: 'Fee Schedules', icon: Receipt },
  { href: '/franchise/office/settings', label: 'Settings', icon: Settings },
];

export default function OfficeLayout({
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
          <h2 className="text-lg font-semibold">Office Portal</h2>
          <p className="text-sm text-muted-foreground">Franchise Management</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
