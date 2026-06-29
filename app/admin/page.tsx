import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Shield,
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  LogIn,
  Lock
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Admin Portal | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Admin dashboard for ${PLATFORM_DEFAULTS.orgName} platform management.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/admin`,
  },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile to check role
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, roles')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || 
                  profile?.roles?.includes('admin') || profile?.roles?.includes('super_admin');

  const adminFeatures = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Overview of platform metrics and activity',
      href: '/admin/dashboard',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage students, instructors, and employers',
      href: '/admin/users',
    },
    {
      icon: GraduationCap,
      title: 'Programs',
      description: 'Manage training programs and curricula',
      href: '/admin/programs',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View enrollment and completion statistics',
      href: '/admin/analytics',
    },
    {
      icon: Building2,
      title: 'Partners',
      description: 'Manage employer and provider relationships',
      href: '/admin/partners',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Platform configuration and integrations',
      href: '/admin/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-brand-orange-500" />
            <div>
              <h1 className="text-xl font-bold">{PLATFORM_DEFAULTS.orgName}</h1>
              <p className="text-slate-400 text-sm">Admin Portal</p>
            </div>
          </div>
          <div>
            {user ? (
              <Link href="/admin/dashboard">
                <Button className="bg-brand-orange-500 hover:bg-orange-600">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/admin/login">
                <Button className="bg-brand-orange-500 hover:bg-orange-600">
                  <LogIn className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {user && isAdmin ? (
          // Authenticated admin view
          <div>
            <div className="flex items-center gap-4 mb-8">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold">Welcome, {user.email}</h2>
                <p className="text-slate-600">You have admin access to the platform.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFeatures.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-brand-blue-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5 text-brand-blue-900" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : user && !isAdmin ? (
          // Logged in but not admin
          <div className="max-w-2xl mx-auto text-center py-16">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
            <p className="text-slate-600 mb-8">
              You are logged in, but you don't have admin privileges. 
              Contact your administrator if you believe this is an error.
            </p>
            <Link href="/lms/dashboard">
              <Button variant="outline">
                Go to Student Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          // Not logged in
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <Lock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Admin Portal</h2>
              <p className="text-slate-600 text-lg">
                This area is restricted to authorized administrators only.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  If you are an administrator, please sign in with your admin credentials.
                </p>
                <Link href="/admin/login" className="block">
                  <Button className="w-full bg-brand-blue-600 hover:bg-blue-700">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Admin
                  </Button>
                </Link>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 text-center">
                    Need access? Contact your system administrator or email{' '}
                    <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="text-brand-blue-600 hover:underline">
                      {PLATFORM_DEFAULTS.supportEmail}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="font-bold mb-4">Available Admin Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {adminFeatures.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <feature.icon className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>{PLATFORM_DEFAULTS.orgName} Admin Portal</p>
          <p className="text-sm mt-1">{PLATFORM_DEFAULTS.supportPhone} | {PLATFORM_DEFAULTS.supportEmail}</p>
        </div>
      </footer>
    </div>
  );
}
