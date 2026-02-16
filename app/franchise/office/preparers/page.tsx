
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus,
  ArrowLeft,
  FileText,
  DollarSign,
  Shield,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  ptin: string;
  ptin_expiration: string | null;
  certification_level: string | null;
  is_efin_authorized: boolean;
  is_ero_authorized: boolean;
  status: string;
  returns_filed: number;
  commission_type: string;
  commission_rate: number | null;
  per_return_fee: number | null;
}

export default function PreparersPage() {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<any>(null);
  const [preparers, setPreparers] = useState<Preparer[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
        setLoading(false);
        return;
      }

      setOffice(officeData);

      // Load preparers
      const { data: preparersData } = await supabase
        .from('franchise_preparers')
        .select('*')
        .eq('office_id', officeData.id)
        .order('last_name');

      if (preparersData) {
        setPreparers(preparersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an office owner to manage preparers.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const activePreparers = preparers.filter(p => p.status === 'active');

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Preparers" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tax Preparers</h1>
            <p className="text-muted-foreground">
              Manage your office's tax preparers
            </p>
          </div>
        </div>
        <Link href="/franchise/office/preparers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Preparer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Preparers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePreparers.length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ERO Authorized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {preparers.filter(p => p.is_ero_authorized).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Can sign as ERO
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {preparers.reduce((sum, p) => sum + (p.returns_filed || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This season
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Preparer List */}
      <Card>
        <CardHeader>
          <CardTitle>All Preparers</CardTitle>
          <CardDescription>
            {preparers.length} preparer{preparers.length !== 1 ? 's' : ''} in your office
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preparers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No preparers yet</p>
              <p className="text-muted-foreground mb-4">
                Add your first tax preparer to get started
              </p>
              <Link href="/franchise/office/preparers/new">
                <Button>Add Preparer</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {preparers.map((preparer) => (
                <div 
                  key={preparer.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
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
                      <div className="flex items-center gap-2 mt-1">
                        {preparer.is_ero_authorized && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ERO
                          </Badge>
                        )}
                        {preparer.is_efin_authorized && (
                          <Badge variant="outline" className="text-xs">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            EFIN
                          </Badge>
                        )}
                        {preparer.certification_level && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {preparer.certification_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Returns</p>
                      <p className="font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {preparer.returns_filed || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Compensation</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {preparer.commission_type === 'per_return' 
                          ? `$${preparer.per_return_fee || 0}/return`
                          : preparer.commission_type === 'commission'
                          ? `${preparer.commission_rate || 0}%`
                          : preparer.commission_type}
                      </p>
                    </div>
                    <Badge variant={
                      preparer.status === 'active' ? 'default' :
                      preparer.status === 'suspended' ? 'destructive' :
                      'secondary'
                    }>
                      {preparer.status}
                    </Badge>
                    <Link href={`/franchise/office/preparers/${preparer.id}`}>
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
