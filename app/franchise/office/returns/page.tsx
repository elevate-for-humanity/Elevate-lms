
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Return {
  id: string;
  submission_id: string;
  tax_year: number;
  status: string;
  client_fee: number;
  preparer_commission: number;
  franchise_fee: number;
  office_revenue: number;
  created_at: string;
  ero_signed_at: string | null;
  preparer: {
    first_name: string;
    last_name: string;
  };
  client: {
    first_name: string;
    last_name: string;
    ssn_last_four: string;
  };
}

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<any>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReturns();
  }, [searchQuery, statusFilter, yearFilter, returns]);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: officeData } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!officeData) {
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('*, office:franchise_offices(*)')
          .eq('user_id', user.id)
          .single();

        if (preparer?.office) {
          setOffice(preparer.office);
          await loadReturns(preparer.office.id);
        }
      } else {
        setOffice(officeData);
        await loadReturns(officeData.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadReturns(officeId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('franchise_return_submissions')
      .select(`
        *,
        preparer:franchise_preparers(first_name, last_name),
        client:franchise_clients(first_name, last_name, ssn_last_four)
      `)
      .eq('office_id', officeId)
      .order('created_at', { ascending: false });

    if (data) {
      setReturns(data as any);
      setFilteredReturns(data as any);
    }
  }

  function filterReturns() {
    let filtered = [...returns];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.submission_id?.toLowerCase().includes(query) ||
        r.client?.first_name?.toLowerCase().includes(query) ||
        r.client?.last_name?.toLowerCase().includes(query) ||
        r.client?.ssn_last_four?.includes(query) ||
        r.preparer?.first_name?.toLowerCase().includes(query) ||
        r.preparer?.last_name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(r => r.tax_year === parseInt(yearFilter));
    }

    setFilteredReturns(filtered);
  }

  const years = [...new Set(returns.map(r => r.tax_year))].sort((a, b) => b - a);
  const statuses = [...new Set(returns.map(r => r.status))];

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending' || r.status === 'pending_ero').length,
    accepted: returns.filter(r => r.status === 'accepted').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    revenue: returns.reduce((sum, r) => sum + (r.client_fee || 0), 0)
  };

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
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Returns" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tax Returns</h1>
            <p className="text-muted-foreground">
              All returns filed by your office
            </p>
          </div>
        </div>
        <Link href="/franchise/office/returns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, SSN, submission ID, or preparer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
          <CardDescription>
            {filteredReturns.length} return{filteredReturns.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No returns found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || yearFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first return to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && yearFilter === 'all' && (
                <Link href="/franchise/office/returns/new">
                  <Button>Create Return</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((ret) => (
                <div 
                  key={ret.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {ret.client?.first_name} {ret.client?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ret.submission_id} | SSN: ***-**-{ret.client?.ssn_last_four}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Prepared by {ret.preparer?.first_name} {ret.preparer?.last_name} | {new Date(ret.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-medium">{ret.tax_year}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Fee</p>
                      <p className="font-medium">${ret.client_fee?.toLocaleString()}</p>
                    </div>
                    <Badge variant={
                      ret.status === 'accepted' ? 'default' :
                      ret.status === 'rejected' ? 'destructive' :
                      ret.status === 'pending_ero' ? 'secondary' :
                      'outline'
                    }>
                      {ret.status.replace('_', ' ')}
                    </Badge>
                    <Link href={`/franchise/office/returns/${ret.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
