'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Building2,
  Shield,
  DollarSign,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
  is_ero_authorized: boolean;
}

export default function OfficeSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [eroConfig, setEroConfig] = useState<any>(null);

  // Office form state
  const [officeName, setOfficeName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');

  // ERO form state
  const [eroPreparerId, setEroPreparerId] = useState('');
  const [efin, setEfin] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmEin, setFirmEin] = useState('');
  const [signaturePin, setSignaturePin] = useState('');

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
      setOfficeName(officeData.office_name);
      setPhone(officeData.phone || '');
      setAddressStreet(officeData.address_street);
      setAddressCity(officeData.address_city);
      setAddressState(officeData.address_state);
      setAddressZip(officeData.address_zip);

      // Load preparers
      const { data: preparersData } = await supabase
        .from('franchise_preparers')
        .select('id, first_name, last_name, is_ero_authorized')
        .eq('office_id', officeData.id)
        .eq('status', 'active')
        .order('last_name');

      if (preparersData) {
        setPreparers(preparersData);
      }

      // Load ERO config
      const { data: eroData } = await supabase
        .from('franchise_ero_configs')
        .select('*')
        .eq('office_id', officeData.id)
        .eq('is_active', true)
        .single();

      if (eroData) {
        setEroConfig(eroData);
        setEroPreparerId(eroData.ero_preparer_id);
        setEfin(eroData.efin);
        setFirmName(eroData.firm_name);
        setFirmEin(eroData.firm_ein || '');
        setSignaturePin(eroData.signature_pin);
      } else {
        // Default to office values
        setEfin(officeData.efin || officeData.parent_efin || '');
        setFirmName(officeData.office_name);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveOfficeSettings() {
    setSaving(true);
    try {
      const response = await fetch(`/api/franchise/offices/${office.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_name: officeName,
          phone,
          address_street: addressStreet,
          address_city: addressCity,
          address_state: addressState,
          address_zip: addressZip
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save settings');
      }

      toast({
        title: 'Settings Saved',
        description: 'Office settings have been updated',
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveEROSettings() {
    if (!eroPreparerId || !efin || !firmName || !signaturePin) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all ERO fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/franchise/ero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_id: office.id,
          ero_preparer_id: eroPreparerId,
          efin,
          firm_name: firmName,
          firm_ein: firmEin || null,
          firm_address: {
            street: addressStreet,
            city: addressCity,
            state: addressState,
            zip: addressZip
          },
          signature_pin: signaturePin
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save ERO settings');
      }

      toast({
        title: 'ERO Settings Saved',
        description: 'ERO configuration has been updated',
      });

    } catch (error) {
      console.error('Error saving ERO settings:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
          </CardHeader>
        </Card>
      </div>
    );
  }

  const eroAuthorizedPreparers = preparers.filter(p => p.is_ero_authorized);

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office" }, { label: "Settings" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/office">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Office Settings</h1>
          <p className="text-muted-foreground">
            Manage your office configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ero">ERO Configuration</TabsTrigger>
          <TabsTrigger value="fees">Fee Schedule</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Office Information
              </CardTitle>
              <CardDescription>
                Basic office details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Office Code</Label>
                  <Input value={office.office_code} disabled />
                  <p className="text-xs text-muted-foreground">Cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Office Name</Label>
                  <Input 
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input 
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input 
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input 
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveOfficeSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ERO Configuration */}
        <TabsContent value="ero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ERO Configuration
              </CardTitle>
              <CardDescription>
                Configure the Electronic Return Originator for your office.
                The ERO signature appears on all returns filed by your office.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ERO (Designated Signer)</Label>
                <Select value={eroPreparerId} onValueChange={setEroPreparerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ERO" />
                  </SelectTrigger>
                  <SelectContent>
                    {eroAuthorizedPreparers.length === 0 ? (
                      <SelectItem value="" disabled>
                        No ERO-authorized preparers
                      </SelectItem>
                    ) : (
                      eroAuthorizedPreparers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {eroAuthorizedPreparers.length === 0 && (
                  <p className="text-xs text-brand-orange-600">
                    No preparers are ERO authorized. Enable ERO authorization for a preparer first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>EFIN</Label>
                  <Input 
                    value={efin}
                    onChange={(e) => setEfin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digits"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Signature PIN</Label>
                  <Input 
                    value={signaturePin}
                    onChange={(e) => setSignaturePin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="5 digits"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Firm Name (as registered with IRS)</Label>
                <Input 
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Firm EIN (optional)</Label>
                <Input 
                  value={firmEin}
                  onChange={(e) => setFirmEin(e.target.value)}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div className="bg-brand-blue-50 dark:bg-brand-blue-950 border border-brand-blue-200 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Note:</strong> The ERO is responsible for signing all returns filed through this office.
                  Make sure the EFIN and signature PIN match your IRS e-file application.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveEROSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save ERO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Schedule */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Schedule
              </CardTitle>
              <CardDescription>
                Configure your office's fee structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax Preparation Fee</p>
                    <p className="text-sm text-muted-foreground">Standard 1040 filing</p>
                  </div>
                  <p className="font-semibold">$150.00</p>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Business Return Fee</p>
                    <p className="text-sm text-muted-foreground">Schedule C / LLC</p>
                  </div>
                  <p className="font-semibold">$250.00</p>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">State Return Fee</p>
                    <p className="text-sm text-muted-foreground">Per state filed</p>
                  </div>
                  <p className="font-semibold">$45.00</p>
                </div>
                <Link href="/franchise/office/fees">
                  <Button variant="outline" className="w-full">Manage Fee Schedules</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
