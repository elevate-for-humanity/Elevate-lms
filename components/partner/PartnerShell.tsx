import { ReactNode } from 'react';
import PartnerNav from './PartnerNav';
import { User } from '@supabase/supabase-js';

interface PartnerShellProps {
  ctx: {
    user: User;
    profileRole: string;
    shops: Array<{
      shop_id: any;
      staff_role: string;
      shop: any;
    }>;
  };
  children: ReactNode;
}

export default function PartnerShell({ ctx, children }: PartnerShellProps) {
  const shops = ctx?.shops ?? [];
  const isAdmin = ['admin', 'org_admin'].includes(ctx?.profileRole ?? '');

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Partner Portal</div>
          <div className="text-sm text-black">
            {isAdmin ? 'Admin Access' : `Shops: ${shops.length}`}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <PartnerNav isAdmin={isAdmin} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
