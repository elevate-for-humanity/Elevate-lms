
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertCircle,
  Building2,
CheckCircle, } from 'lucide-react';
import Link from 'next/link';

interface OfficeStats {
  totalReturns: number;
  pendingReturns: number;
  acceptedReturns: number;
  rejectedReturns: number;
  totalRevenue: number;
  totalCommissions: number;
  franchiseFees: number;
  netRevenue: number;
}

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
  ptin: string;
  status: string;
  returns_filed: number;
  total_commission: number;
}

interface RecentReturn {
  id: string;
  submission_id: string;
  status: string;
  client_fee: number;
  created_at: string;
  preparer: {
    first_name: string;
    last_name: string;
  };
}

export default function OfficeDashboard() {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<any>(null);
  const [stats, setStats] = useState<OfficeStats | null>(null);
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [recentReturns, setRecentReturns] = useState<RecentReturn[]>([]);
  const [pendingSignatures, setPendingSignatures] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get user's office
      const { data: officeData } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!officeData) {
        // User doesn't own an office
        setLoading(false);
        return;
      }

      setOffice(officeData);

      // Load stats
      const currentYear = new Date().getFullYear();
      const { data: returns } = await supabase
        .from('franchise_return_submissions')
        .select('*')
        .eq('office_id', officeData.id)
        .gte('created_at', `${currentYear}-01-01`);

      if (returns) {
        const statsData: OfficeStats = {
          totalReturns: returns.length,
          pendingReturns: returns.filter(r => r.status === 'pending' || r.status === 'pending_ero').length,
          acceptedReturns: returns.filter(r => r.status === 'accepted').length,
          rejectedReturns: returns.filter(r => r.status === 'rejected').length,
          totalRevenue: returns.reduce((sum, r) => sum + (r.client_fee || 0), 0),
          totalCommissions: returns.reduce((sum, r) => sum + (r.preparer_commission || 0), 0),
          franchiseFees: returns.reduce((sum, r) => sum + (r.franchise_fee || 0), 0),
          netRevenue: returns.reduce((sum, r) => sum + (r.office_revenue || 0), 0)
        };
        setStats(statsData);
      }

      // Load preparers
      const { data: preparerData } = await supabase
        .from('franchise_preparers')
        .select('*')
        .eq('office_id', officeData.id)
        .order('last_name');

      if (preparerData) {
        setPreparers(preparerData);
      }

      // Load recent returns
      const { data: recentData } = await supabase
        .from('franchise_return_submissions')
        .select(`
          id,
          submission_id,
          status,
          client_fee,
          created_at,
          preparer:franchise_preparers(first_name, last_name)
        `)
        .eq('office_id', officeData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentData) {
        setRecentReturns(recentData as any);
      }

      // Get pending ERO signatures
      const { count } = await supabase
        .from('franchise_return_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', officeData.id)
        .eq('status', 'pending_ero');

      setPendingSignatures(count || 0);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Office Found</CardTitle>
            <CardDescription>
              You don't have an office assigned to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/franchise/apply">
              <Button>Apply for a Franchise</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Franchise', href: '/franchise' }, { label: 'Office Dashboard' }]} />
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{office.office_name}</h1>
          <p className="text-muted-foreground">
            Office Code: {office.office_code} | EFIN: {office.efin || 'Not Set'}
          </p>
        </div>
        <Badge variant={office.status === 'active' ? 'default' : 'secondary'}>
          {office.status}
        </Badge>
      </div>

      {/* Alert for pending signatures */}
      {pendingSignatures > 0 && (
        <Card className="border-brand-orange-500 bg-brand-orange-50 dark:bg-brand-orange-950">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-brand-orange-500" />
              <span className="font-medium">
                {pendingSignatures} return{pendingSignatures > 1 ? 's' : ''} awaiting your ERO signature
              </span>
            </div>
            <Link href="/franchise/office/ero-queue">
              <Button variant="outline" size="sm">Review & Sign</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReturns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingReturns || 0} pending, {stats?.acceptedReturns || 0} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              From client fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-green-600">
              ${stats?.netRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              After fees & commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Preparers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {preparers.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {preparers.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="returns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="returns">Recent Returns</TabsTrigger>
          <TabsTrigger value="preparers">Preparers</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Returns</CardTitle>
                <CardDescription>Latest tax returns filed by your office</CardDescription>
              </div>
              <Link href="/franchise/office/returns">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReturns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No returns filed yet
                  </p>
                ) : (
                  recentReturns.map((ret) => (
                    <div 
                      key={ret.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{ret.submission_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {ret.preparer?.first_name} {ret.preparer?.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          ret.status === 'accepted' ? 'default' :
                          ret.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {ret.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${ret.client_fee?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preparers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tax Preparers</CardTitle>
                <CardDescription>Manage your office's tax preparers</CardDescription>
              </div>
              <Link href="/franchise/office/preparers/new">
                <Button size="sm">Add Preparer</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preparers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No preparers added yet
                  </p>
                ) : (
                  preparers.map((preparer) => (
                    <div 
                      key={preparer.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {preparer.first_name} {preparer.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PTIN: {preparer.ptin}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={preparer.status === 'active' ? 'default' : 'secondary'}>
                          {preparer.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {preparer.returns_filed || 0} returns
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gross Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${stats?.totalRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total client fees collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Franchise Fees</span>
                    <span className="font-medium text-brand-red-600">
                      -${stats?.franchiseFees?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preparer Commissions</span>
                    <span className="font-medium text-brand-red-600">
                      -${stats?.totalCommissions?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Net Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand-green-600">
                  ${stats?.netRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Your office profit</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/franchise/office/returns/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                New Return
              </Button>
            </Link>
            <Link href="/franchise/office/preparers/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Add Preparer
              </Button>
            </Link>
            <Link href="/franchise/office/ero-queue">
              <Button variant="outline" className="w-full justify-start">
                <span className="text-slate-400 flex-shrink-0">•</span>
                ERO Queue
              </Button>
            </Link>
            <Link href="/franchise/office/settings">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Office Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
