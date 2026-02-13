
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
  User,
  FileText,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  ssn_last_four: string;
  filing_status: string | null;
  dependents_count: number;
  spouse_first_name: string | null;
  spouse_last_name: string | null;
  spouse_ssn_last_four: string | null;
  returns_filed: number;
  total_fees_paid: number;
  last_return_date: string | null;
  status: string;
  client_since: string;
  notes: string | null;
  preferred_preparer_id: string | null;
}

interface Return {
  id: string;
  submission_id: string;
  tax_year: number;
  status: string;
  client_fee: number;
  created_at: string;
  preparer: {
    first_name: string;
    last_name: string;
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [editData, setEditData] = useState<Partial<Client>>({});

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const supabase = createClient();
      
      const { data: clientData, error } = await supabase
        .from('franchise_clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error || !clientData) {
        toast({ title: 'Client not found', variant: 'destructive' });
        router.push('/franchise/office/clients');
        return;
      }

      setClient(clientData);
      setEditData(clientData);

      // Load returns
      const { data: returnsData } = await supabase
        .from('franchise_return_submissions')
        .select(`
          id, submission_id, tax_year, status, client_fee, created_at,
          preparer:franchise_preparers(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (returnsData) {
        setReturns(returnsData as any);
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('franchise_clients')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          phone: editData.phone,
          address_street: editData.address_street,
          address_city: editData.address_city,
          address_state: editData.address_state,
          address_zip: editData.address_zip,
          filing_status: editData.filing_status,
          dependents_count: editData.dependents_count,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({ title: 'Client updated' });
      setEditing(false);
      loadData();
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function markDoNotServe() {
    if (!confirm('Are you sure you want to mark this client as Do Not Serve?')) return;

    try {
      const supabase = createClient();
      await supabase
        .from('franchise_clients')
        .update({ status: 'do_not_serve', updated_at: new Date().toISOString() })
        .eq('id', clientId);

      toast({ title: 'Client marked as Do Not Serve' });
      loadData();
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Clients" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-muted-foreground">
              SSN: ***-**-{client.ssn_last_four} | Client since {new Date(client.client_since).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            client.status === 'active' ? 'default' :
            client.status === 'do_not_serve' ? 'destructive' :
            'secondary'
          }>
            {client.status}
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
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{client.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone || 'No phone'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Street</Label>
                      <Input 
                        value={editData.address_street || ''}
                        onChange={(e) => setEditData({...editData, address_street: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input 
                          value={editData.address_city || ''}
                          onChange={(e) => setEditData({...editData, address_city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input 
                          value={editData.address_state || ''}
                          onChange={(e) => setEditData({...editData, address_state: e.target.value})}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP</Label>
                        <Input 
                          value={editData.address_zip || ''}
                          onChange={(e) => setEditData({...editData, address_zip: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    {client.address_street ? (
                      <>
                        <p>{client.address_street}</p>
                        <p>{client.address_city}, {client.address_state} {client.address_zip}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No address on file</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tax Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Filing Status</p>
                    <p className="font-medium capitalize">{client.filing_status?.replace('_', ' ') || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dependents</p>
                    <p className="font-medium">{client.dependents_count}</p>
                  </div>
                </div>
                {client.spouse_first_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Spouse</p>
                    <p className="font-medium">
                      {client.spouse_first_name} {client.spouse_last_name} (***-**-{client.spouse_ssn_last_four})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Returns Filed</p>
                    <p className="text-2xl font-bold">{client.returns_filed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fees Paid</p>
                    <p className="text-2xl font-bold">${client.total_fees_paid?.toLocaleString() || 0}</p>
                  </div>
                </div>
                {client.last_return_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Return</p>
                    <p className="font-medium">{new Date(client.last_return_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>Tax Returns</CardTitle>
              <CardDescription>All returns filed for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No returns filed yet</p>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{ret.tax_year} Tax Return</p>
                        <p className="text-sm text-muted-foreground">
                          {ret.submission_id} | Prepared by {ret.preparer?.first_name} {ret.preparer?.last_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          ret.status === 'accepted' ? 'default' :
                          ret.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {ret.status}
                        </Badge>
                        <span className="font-medium">${ret.client_fee?.toLocaleString()}</span>
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
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Client Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/franchise/office/returns/new?clientId=${client.id}`}>
                <Button className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create New Return
                </Button>
              </Link>
              
              {client.status === 'active' && (
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={markDoNotServe}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Mark as Do Not Serve
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
