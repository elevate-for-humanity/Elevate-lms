
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus,
  ArrowLeft,
  Search,
  Users,
  FileText,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Office {
  id: string;
  office_code: string;
  office_name: string;
  owner_name: string;
  owner_email: string;
  address_city: string;
  address_state: string;
  efin: string | null;
  status: string;
  created_at: string;
  preparer_count?: number;
  return_count?: number;
  total_revenue?: number;
}

export default function AdminOfficesPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredOffices(offices.filter(o => 
        o.office_code.toLowerCase().includes(query) ||
        o.office_name.toLowerCase().includes(query) ||
        o.owner_name.toLowerCase().includes(query) ||
        o.address_city.toLowerCase().includes(query)
      ));
    } else {
      setFilteredOffices(offices);
    }
  }, [searchQuery, offices]);

  async function checkAuthAndLoad() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

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
      await loadOffices();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOffices() {
    const supabase = createClient();
    
    const { data: officesData } = await supabase
      .from('franchise_offices')
      .select('*')
      .order('created_at', { ascending: false });

    if (officesData) {
      // Get stats for each office
      const officesWithStats = await Promise.all(officesData.map(async (office) => {
        const { count: preparerCount } = await supabase
          .from('franchise_preparers')
          .select('*', { count: 'exact', head: true })
          .eq('office_id', office.id);

        const { data: returns } = await supabase
          .from('franchise_return_submissions')
          .select('client_fee')
          .eq('office_id', office.id);

        return {
          ...office,
          preparer_count: preparerCount || 0,
          return_count: returns?.length || 0,
          total_revenue: returns?.reduce((sum, r) => sum + (r.client_fee || 0), 0) || 0
        };
      }));

      setOffices(officesWithStats);
      setFilteredOffices(officesWithStats);
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
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = {
    total: offices.length,
    active: offices.filter(o => o.status === 'active').length,
    pending: offices.filter(o => o.status === 'pending').length,
    totalRevenue: offices.reduce((sum, o) => sum + (o.total_revenue || 0), 0)
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Admin", href: "/franchise/admin" }, { label: "Offices" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Franchise Offices</h1>
            <p className="text-muted-foreground">
              Manage all offices in the franchise network
            </p>
          </div>
        </div>
        <Link href="/franchise/admin/offices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Office
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Offices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-brand-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-brand-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by office code, name, owner, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Offices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Offices</CardTitle>
          <CardDescription>
            {filteredOffices.length} office{filteredOffices.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOffices.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No offices found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search' : 'Add your first franchise office'}
              </p>
              {!searchQuery && (
                <Link href="/franchise/admin/offices/new">
                  <Button>Add Office</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffices.map((office) => (
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
                        {office.office_code} | {office.address_city}, {office.address_state}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {office.owner_name} ({office.owner_email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Preparers</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {office.preparer_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Returns</p>
                      <p className="font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {office.return_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {office.total_revenue?.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      office.status === 'active' ? 'default' :
                      office.status === 'suspended' ? 'destructive' :
                      'secondary'
                    }>
                      {office.status}
                    </Badge>
                    <Link href={`/franchise/admin/offices/${office.id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
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
