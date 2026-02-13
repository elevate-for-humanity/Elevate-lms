export const dynamic = 'force-dynamic';

'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Building2,
  Users,
  FileText,
  DollarSign,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Office {
  id: string;
  office_code: string;
  office_name: string;
  owner_id: string | null;
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  business_ein: string | null;
  efin: string | null;
  parent_efin: string;
  status: string;
  franchise_fee: number;
  per_return_fee: number;
  revenue_share_percent: number;
  max_preparers: number;
  created_at: string;
  notes: string | null;
}

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
  ptin: string;
  status: string;
  returns_filed: number;
}

interface Return {
  id: string;
  submission_id: string;
  tax_year: number;
  status: string;
  client_fee: number;
  franchise_fee: number;
  created_at: string;
}

export default function AdminOfficeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const officeId = params.officeId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [office, setOffice] = useState<Office | null>(null);
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [editData, setEditData] = useState<Partial<Office>>({});

  useEffect(() => {
    checkAuthAndLoad();
  }, [officeId]);

  async function checkAuthAndLoad() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
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
      await loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    const supabase = createClient();

    const { data: officeData, error } = await supabase
      .from('franchise_offices')
      .select('*')
      .eq('id', officeId)
      .single();

    if (error || !officeData) {
      toast({ title: 'Office not found', variant: 'destructive' });
      router.push('/franchise/admin/offices');
      return;
    }

    setOffice(officeData);
    setEditData(officeData);

    // Load preparers
    const { data: preparersData } = await supabase
      .from('franchise_preparers')
      .select('id, first_name, last_name, ptin, status, returns_filed')
      .eq('office_id', officeId)
      .order('last_name');

    if (preparersData) {
      setPreparers(preparersData);
    }

    // Load returns
    const { data: returnsData } = await supabase
      .from('franchise_return_submissions')
      .select('id, submission_id, tax_year, status, client_fee, franchise_fee, created_at')
      .eq('office_id', officeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (returnsData) {
      setReturns(returnsData);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('franchise_offices')
        .update({
          office_name: editData.office_name,
          owner_name: editData.owner_name,
          owner_email: editData.owner_email,
          owner_phone: editData.owner_phone,
          address_street: editData.address_street,
          address_city: editData.address_city,
          address_state: editData.address_state,
          address_zip: editData.address_zip,
          business_ein: editData.business_ein,
          efin: editData.efin,
          franchise_fee: editData.franchise_fee,
          per_return_fee: editData.per_return_fee,
          revenue_share_percent: editData.revenue_share_percent,
          max_preparers: editData.max_preparers,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', officeId);

      if (error) throw error;

      toast({ title: 'Office updated' });
      setEditing(false);
      loadData();
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const supabase = createClient();
      await supabase
        .from('franchise_offices')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...(newStatus === 'active' ? { activated_at: new Date().toISOString() } : {}),
          ...(newStatus === 'suspended' ? { suspended_at: new Date().toISOString() } : {})
        })
        .eq('id', officeId);

      toast({ title: `Office ${newStatus}` });
      loadData();
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized || !office) {
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

  const stats = {
    preparers: preparers.length,
    activePreparers: preparers.filter(p => p.status === 'active').length,
    returns: returns.length,
    revenue: returns.reduce((sum, r) => sum + (r.client_fee || 0), 0),
    franchiseFees: returns.reduce((sum, r) => sum + (r.franchise_fee || 0), 0)
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Admin", href: "/franchise/admin" }, { label: "Offices" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/admin/offices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{office.office_name}</h1>
            <p className="text-muted-foreground">
              {office.office_code} | {office.address_city}, {office.address_state}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            office.status === 'active' ? 'default' :
            office.status === 'suspended' ? 'destructive' :
            'secondary'
          }>
            {office.status}
          </Badge>
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.preparers}</div>
            <p className="text-xs text-muted-foreground">Preparers ({stats.activePreparers} active)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.returns}</div>
            <p className="text-xs text-muted-foreground">Returns Filed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">${stats.franchiseFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Franchise Fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{office.efin || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">EFIN</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preparers">Preparers ({preparers.length})</TabsTrigger>
          <TabsTrigger value="returns">Returns ({returns.length})</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Office Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Office Name</Label>
                      <Input 
                        value={editData.office_name || ''}
                        onChange={(e) => setEditData({...editData, office_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>EFIN</Label>
                      <Input 
                        value={editData.efin || ''}
                        onChange={(e) => setEditData({...editData, efin: e.target.value})}
                        maxLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business EIN</Label>
                      <Input 
                        value={editData.business_ein || ''}
                        onChange={(e) => setEditData({...editData, business_ein: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Office Code</p>
                      <p className="font-medium">{office.office_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">EFIN</p>
                      <p className="font-medium">{office.efin || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Parent EFIN</p>
                      <p className="font-medium">{office.parent_efin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business EIN</p>
                      <p className="font-medium">{office.business_ein || 'Not set'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Owner Name</Label>
                      <Input 
                        value={editData.owner_name || ''}
                        onChange={(e) => setEditData({...editData, owner_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Email</Label>
                      <Input 
                        value={editData.owner_email || ''}
                        onChange={(e) => setEditData({...editData, owner_email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Phone</Label>
                      <Input 
                        value={editData.owner_phone || ''}
                        onChange={(e) => setEditData({...editData, owner_phone: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{office.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{office.owner_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{office.owner_phone || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Franchise Fee ($)</Label>
                      <Input 
                        type="number"
                        value={editData.franchise_fee || 0}
                        onChange={(e) => setEditData({...editData, franchise_fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per Return Fee ($)</Label>
                      <Input 
                        type="number"
                        value={editData.per_return_fee || 0}
                        onChange={(e) => setEditData({...editData, per_return_fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Revenue Share (%)</Label>
                      <Input 
                        type="number"
                        value={editData.revenue_share_percent || 0}
                        onChange={(e) => setEditData({...editData, revenue_share_percent: parseFloat(e.target.value)})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Franchise Fee</p>
                      <p className="font-medium">${office.franchise_fee?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Per Return Fee</p>
                      <p className="font-medium">${office.per_return_fee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Share</p>
                      <p className="font-medium">{office.revenue_share_percent}%</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-2">
                    <Label>Max Preparers</Label>
                    <Input 
                      type="number"
                      value={editData.max_preparers || 10}
                      onChange={(e) => setEditData({...editData, max_preparers: parseInt(e.target.value)})}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Preparers</p>
                      <p className="font-medium">{office.max_preparers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Preparers</p>
                      <p className="font-medium">{preparers.length} / {office.max_preparers}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preparers">
          <Card>
            <CardHeader>
              <CardTitle>Preparers</CardTitle>
            </CardHeader>
            <CardContent>
              {preparers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No preparers</p>
              ) : (
                <div className="space-y-4">
                  {preparers.map((preparer) => (
                    <div key={preparer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{preparer.first_name} {preparer.last_name}</p>
                        <p className="text-sm text-muted-foreground">PTIN: {preparer.ptin}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{preparer.returns_filed} returns</span>
                        <Badge variant={preparer.status === 'active' ? 'default' : 'secondary'}>
                          {preparer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>Recent Returns</CardTitle>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No returns</p>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{ret.submission_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {ret.tax_year} | {new Date(ret.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>${ret.client_fee?.toLocaleString()}</span>
                        <Badge variant={
                          ret.status === 'accepted' ? 'default' :
                          ret.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {ret.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Office Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {office.status === 'pending' && (
                <Button className="w-full justify-start" onClick={() => updateStatus('active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Office
                </Button>
              )}
              {office.status === 'active' && (
                <Button variant="destructive" className="w-full justify-start" onClick={() => updateStatus('suspended')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Suspend Office
                </Button>
              )}
              {office.status === 'suspended' && (
                <Button className="w-full justify-start" onClick={() => updateStatus('active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate Office
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={() => updateStatus('terminated')}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Terminate Franchise
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
