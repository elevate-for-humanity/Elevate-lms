/**
 * Host Shop Dashboard - Entry Point
 * 
 * This is the MAIN dashboard for ALL host shop types:
 * - Barber Host Shops
 * - Cosmetology Host Shops
 * - Nail Tech Host Shops
 * - Esthetician Host Shops
 * 
 * Routes to the board view for authenticated partners.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage your host shop, apprentices, and training programs.',
  robots: { index: false, follow: false },
};

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Get admin client for partner lookup
  let db;
  try {
    db = await requireAdminClient();
  } catch {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Check role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = ['partner', 'admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Admins/staff go to their own dashboard
  if (['admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Resolve partner record via partner_users join
  const { data: partnerLink } = await db
    .from('partner_users')
    .select(
      'partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, onboarding_completed, mou_signed, documents_verified)',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as unknown as {
    id: string;
    partner_type: string | null;
    program_type?: string | null;
    programs?: string[] | null;
    approval_status: string;
    status: string;
    onboarding_completed: boolean;
    mou_signed: boolean;
    documents_verified: boolean;
  } | null;

  // No partner record - route to onboarding
  if (!partner) {
    const { data: bpa } = await db
      .from('barbershop_partner_applications')
      .select('status, mou_signed_at')
      .eq('contact_email', user.email!)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bpa?.status === 'approved') {
      if (!bpa.mou_signed_at) {
        redirect('/host-shop/apply/sign-mou');
      }
      redirect('/host-shop/apply/forms');
    }
    if (bpa?.status === 'pending' || bpa?.status === 'submitted') {
      redirect('/host-shop/apply/thank-you');
    }
    redirect('/host-shop/apply');
  }

  // Not yet approved - hold at onboarding
  if (partner.approval_status !== 'approved' || partner.status !== 'active') {
    redirect('/host-shop/onboarding');
  }

  // Approved partners - route to board (main working view)
  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  if (!partner.mou_signed) {
    redirect(onboardingPaths.signMou);
  }

  // Show the board as the main dashboard view
  redirect('/host-shop/dashboard/board');
}

// Action card component
function ActionCard({ icon: Icon, title, description, href, color, badge }: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-brand-blue-200 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

// Competency item component
function CompetencyItem({ name, category, student, status, dueDate }: {
  name: string;
  category: string;
  student: string;
  status: 'pending' | 'approved' | 'needs-review';
  dueDate: string;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    'needs-review': { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  };
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm">{name}</p>
        <p className="text-xs text-slate-500">{student} • {category}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">Due: {dueDate}</p>
      </div>
      <Link href="/host-shop/dashboard/competencies" className="p-2 hover:bg-white rounded-lg transition">
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </Link>
    </div>
  );
}

