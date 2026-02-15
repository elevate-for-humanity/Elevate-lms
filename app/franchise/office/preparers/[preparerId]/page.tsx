
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  User,
  FileText,
  DollarSign,
  Shield,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

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
  returns_rejected: number;
  commission_type: string;
  commission_rate: number | null;
  per_return_fee: number | null;
  hourly_rate: number | null;
  created_at: string;
  notes: string | null;
}

interface Return {
  id: string;
  submission_id: string;
  tax_year: number;
  status: string;
  client_fee: number;
  preparer_commission: number;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
  };
}

export default function PreparerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const preparerId = params.preparerId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [preparer, setPreparer] = useState<Preparer | null>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [editData, setEditData] = useState<Partial<Preparer>>({});

  useEffect(() => {
    loadData();
  }, [preparerId]);

  async function loadData() {
    try {
      const supabase = createClient();
      
      const { data: preparerData, error } = await supabase
        .from('franchise_preparers')
        .select('*')
        .eq('id', preparerId)
        .single();

      if (error || !preparerData) {
        toast({ title: 'Preparer not found', variant: 'destructive' });
        router.push('/franchise/office/preparers');
        return;
      }

      setPreparer(preparerData);
      setEditData(preparerData);

      // Load returns
      const { data: returnsData } = await supabase
        .from('franchise_return_submissions')
        .select(`
          id, submission_id, tax_year, status, client_fee, preparer_commission, created_at,
          client:franchise_clients(first_name, last_name)
        `)
        .eq('preparer_id', preparerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (returnsData) {
        setReturns(returnsData as any);
      }
    } catch (error) {
      console.error('Error loading preparer:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('franchise_preparers')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          phone: editData.phone,
          certification_level: editData.certification_level,
          is_efin_authorized: editData.is_efin_authorized,
          is_ero_authorized: editData.is_ero_authorized,
          commission_type: editData.commission_type,
          commission_rate: editData.commission_rate,
          per_return_fee: editData.per_return_fee,
          hourly_rate: editData.hourly_rate,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparerId);

      if (error) throw error;

      toast({ title: 'Preparer updated' });
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
        .from('franchise_preparers')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...(newStatus === 'active' ? { activated_at: new Date().toISOString() } : {}),
          ...(newStatus === 'suspended' ? { suspended_at: new Date().toISOString() } : {})
        })
        .eq('id', preparerId);

      toast({ title: `Preparer ${newStatus}` });
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

  if (!preparer) return null;

  const totalCommission = returns.reduce((sum, r) => sum + (r.preparer_commission || 0), 0);
  const acceptedReturns = returns.filter(r => r.status === 'accepted').length;
  const rejectionRate = returns.length > 0 
    ? ((preparer.returns_rejected || 0) / returns.length * 100).toFixed(1) 
    : '0';

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Preparers" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/preparers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {preparer.first_name} {preparer.last_name}
            </h1>
            <p className="text-muted-foreground">
              PTIN: {preparer.ptin}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            preparer.status === 'active' ? 'default' :
            preparer.status === 'suspended' ? 'destructive' :
            'secondary'
          }>
            {preparer.status}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Returns Filed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparer.returns_filed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedReturns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalCommission.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="returns">Returns ({returns.length})</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input 
                          value={editData.first_name || ''}
                          onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input 
                          value={editData.last_name || ''}
                          onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={editData.email || ''}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{preparer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{preparer.phone || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">PTIN</p>
                  <p className="font-medium">{preparer.ptin}</p>
                  {preparer.ptin_expiration && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(preparer.ptin_expiration).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Certification Level</Label>
                      <Select 
                        value={editData.certification_level || ''} 
                        onValueChange={(v) => setEditData({...editData, certification_level: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={editData.is_efin_authorized}
                          onCheckedChange={(c) => setEditData({...editData, is_efin_authorized: c as boolean})}
                        />
                        <Label>EFIN Authorized</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={editData.is_ero_authorized}
                          onCheckedChange={(c) => setEditData({...editData, is_ero_authorized: c as boolean})}
                        />
                        <Label>ERO Authorized</Label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Certification</p>
                      <p className="font-medium capitalize">{preparer.certification_level || 'None'}</p>
                    </div>
                    <div className="flex gap-2">
                      {preparer.is_efin_authorized && (
                        <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />EFIN</Badge>
                      )}
                      {preparer.is_ero_authorized && (
                        <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />ERO</Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Compensation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={editData.commission_type || 'per_return'} 
                        onValueChange={(v) => setEditData({...editData, commission_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_return">Per Return</SelectItem>
                          <SelectItem value="commission">Commission %</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editData.commission_type === 'per_return' && (
                      <div className="space-y-2">
                        <Label>Per Return Fee ($)</Label>
                        <Input 
                          type="number"
                          value={editData.per_return_fee || 0}
                          onChange={(e) => setEditData({...editData, per_return_fee: parseFloat(e.target.value)})}
                        />
                      </div>
                    )}
                    {editData.commission_type === 'commission' && (
                      <div className="space-y-2">
                        <Label>Commission Rate (%)</Label>
                        <Input 
                          type="number"
                          value={editData.commission_rate || 0}
                          onChange={(e) => setEditData({...editData, commission_rate: parseFloat(e.target.value)})}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{preparer.commission_type?.replace('_', ' ')}</p>
                    {preparer.commission_type === 'per_return' && (
                      <p className="text-lg font-bold">${preparer.per_return_fee}/return</p>
                    )}
                    {preparer.commission_type === 'commission' && (
                      <p className="text-lg font-bold">{preparer.commission_rate}%</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>Returns Prepared</CardTitle>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No returns filed yet</p>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {ret.client?.first_name} {ret.client?.last_name} - {ret.tax_year}
                        </p>
                        <p className="text-sm text-muted-foreground">{ret.submission_id}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          ret.status === 'accepted' ? 'default' :
                          ret.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {ret.status}
                        </Badge>
                        <div className="text-right">
                          <p className="font-medium">${ret.client_fee?.toLocaleString()}</p>
                          <p className="text-sm text-green-600">+${ret.preparer_commission?.toLocaleString()}</p>
                        </div>
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
              <CardTitle>Preparer Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preparer.status === 'pending' && (
                <Button className="w-full justify-start" onClick={() => updateStatus('active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Preparer
                </Button>
              )}
              {preparer.status === 'active' && (
                <Button variant="destructive" className="w-full justify-start" onClick={() => updateStatus('suspended')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Suspend Preparer
                </Button>
              )}
              {preparer.status === 'suspended' && (
                <Button className="w-full justify-start" onClick={() => updateStatus('active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate Preparer
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
