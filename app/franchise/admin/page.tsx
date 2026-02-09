'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface FranchiseStats {
  totalOffices: number;
  activeOffices: number;
  totalPreparers: number;
  activePreparers: number;
  totalReturns: number;
  pendingReturns: number;
  acceptedReturns: number;
  rejectedReturns: number;
  totalRevenue: number;
  totalFranchiseFees: number;
}

interface Office {
  id: string;
  office_code: string;
  office_name: string;
  owner_name: string;
  status: string;
  returns_count: number;
  revenue: number;
  franchise_fees: number;
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: 'return' | 'office' | 'preparer';
  action: string;
  description: string;
  office_name?: string;
  created_at: string;
}

export default function FranchiseAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<FranchiseStats | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkAuthAndLoadData();
  }, [selectedYear]);

  async function checkAuthAndLoadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'super_admin' && profile?.role !== 'franchise_admin') {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await loadDashboardData();

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardData() {
    const supabase = createClient();

    // Load offices
    const { data: officesData } = await supabase
      .from('franchise_offices')
      .select('*')
      .order('created_at', { ascending: false });

    // Load preparers count
    const { count: preparersCount } = await supabase
      .from('franchise_preparers')
      .select('*', { count: 'exact', head: true });

    const { count: activePreparersCount } = await supabase
      .from('franchise_preparers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Load returns for current year
    const { data: returns } = await supabase
      .from('franchise_return_submissions')
      .select('*')
      .gte('created_at', `${selectedYear}-01-01`);

    // Calculate stats
    const statsData: FranchiseStats = {
      totalOffices: officesData?.length || 0,
      activeOffices: officesData?.filter(o => o.status === 'active').length || 0,
      totalPreparers: preparersCount || 0,
      activePreparers: activePreparersCount || 0,
      totalReturns: returns?.length || 0,
      pendingReturns: returns?.filter(r => r.status === 'pending' || r.status === 'pending_ero').length || 0,
      acceptedReturns: returns?.filter(r => r.status === 'accepted').length || 0,
      rejectedReturns: returns?.filter(r => r.status === 'rejected').length || 0,
      totalRevenue: returns?.reduce((sum, r) => sum + (r.client_fee || 0), 0) || 0,
      totalFranchiseFees: returns?.reduce((sum, r) => sum + (r.franchise_fee || 0), 0) || 0
    };
    setStats(statsData);

    // Calculate per-office stats
    if (officesData) {
      const officesWithStats = officesData.map(office => {
        const officeReturns = returns?.filter(r => r.office_id === office.id) || [];
        return {
          ...office,
          returns_count: officeReturns.length,
          revenue: officeReturns.reduce((sum, r) => sum + (r.client_fee || 0), 0),
          franchise_fees: officeReturns.reduce((sum, r) => sum + (r.franchise_fee || 0), 0)
        };
      });
      setOffices(officesWithStats);
    }

    // Load recent activity from audit log
    const { data: auditData } = await supabase
      .from('franchise_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (auditData) {
      const activities: RecentActivity[] = auditData.map(log => ({
        id: log.id,
        type: log.entity_type as 'return' | 'office' | 'preparer',
        action: log.action,
        description: formatActivityDescription(log),
        office_name: log.details?.office_name,
        created_at: log.created_at
      }));
      setRecentActivity(activities);
    }
  }

  function formatActivityDescription(log: any): string {
    switch (log.action) {
      case 'return_created':
        return `New return submitted (${log.details?.submission_id})`;
      case 'ero_signature_recorded':
        return 'ERO signature applied';
      case 'office_created':
        return `New office created: ${log.details?.office_name}`;
      case 'preparer_created':
        return `New preparer added: ${log.details?.preparer_name}`;
      case 'preparer_reassigned':
        return 'Return reassigned to different preparer';
      default:
        return log.action.replace(/_/g, ' ');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the franchise admin dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Admin", href: "/franchise/admin" }, { label: "Page.tsx" }]} />
{/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Franchise Administration</h1>
          <p className="text-muted-foreground">
            Overview of all franchise operations for {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={selectedYear === new Date().getFullYear() ? 'default' : 'outline'}
            onClick={() => setSelectedYear(new Date().getFullYear())}
          >
            {new Date().getFullYear()}
          </Button>
          <Button 
            variant={selectedYear === new Date().getFullYear() - 1 ? 'default' : 'outline'}
            onClick={() => setSelectedYear(new Date().getFullYear() - 1)}
          >
            {new Date().getFullYear() - 1}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOffices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeOffices || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Preparers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPreparers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activePreparers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReturns || 0}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {stats?.pendingReturns || 0}
              </Badge>
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats?.acceptedReturns || 0}
              </Badge>
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {stats?.rejectedReturns || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franchise Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats?.totalFranchiseFees?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              From ${stats?.totalRevenue?.toLocaleString() || '0'} total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="offices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="offices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Franchise Offices</CardTitle>
                <CardDescription>All offices in the franchise network</CardDescription>
              </div>
              <Link href="/franchise/admin/offices/new">
                <Button size="sm">Add Office</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offices.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No offices created yet
                  </p>
                ) : (
                  offices.map((office) => (
                    <div 
                      key={office.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{office.office_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {office.office_code} | Owner: {office.owner_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Returns</p>
                          <p className="font-medium">{office.returns_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="font-medium">${office.revenue.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Fees</p>
                          <p className="font-medium text-green-600">
                            ${office.franchise_fees.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={office.status === 'active' ? 'default' : 'secondary'}>
                          {office.status}
                        </Badge>
                        <Link href={`/franchise/admin/offices/${office.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across all offices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'return' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'office' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.type === 'return' ? <FileText className="h-4 w-4" /> :
                         activity.type === 'office' ? <Building2 className="h-4 w-4" /> :
                         <Users className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        {activity.office_name && (
                          <p className="text-sm text-muted-foreground">
                            {activity.office_name}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Report
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of franchise revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/franchise/admin/reports/revenue">
                  <Button variant="outline" className="w-full">View Report</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Preparer Performance
                </CardTitle>
                <CardDescription>
                  Performance metrics for all preparers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/franchise/admin/reports/preparers">
                  <Button variant="outline" className="w-full">View Report</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Returns Summary
                </CardTitle>
                <CardDescription>
                  Status and trends of all returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/franchise/admin/reports/returns">
                  <Button variant="outline" className="w-full">View Report</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Office Comparison
                </CardTitle>
                <CardDescription>
                  Compare performance across offices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/franchise/admin/reports/comparison">
                  <Button variant="outline" className="w-full">View Report</Button>
                </Link>
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
            <Link href="/franchise/admin/offices/new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Add Office
              </Button>
            </Link>
            <Link href="/franchise/admin/preparers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Preparers
              </Button>
            </Link>
            <Link href="/franchise/admin/returns">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View All Returns
              </Button>
            </Link>
            <Link href="/franchise/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Fee Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
