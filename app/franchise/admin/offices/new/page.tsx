
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Building2,
  User,
  DollarSign,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function NewOfficePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Form state
  const [officeCode, setOfficeCode] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [businessEin, setBusinessEin] = useState('');
  const [efin, setEfin] = useState('');
  const [parentEfin, setParentEfin] = useState('');
  const [franchiseFee, setFranchiseFee] = useState(0);
  const [perReturnFee, setPerReturnFee] = useState(5);
  const [revenueSharePercent, setRevenueSharePercent] = useState(0);
  const [maxPreparers, setMaxPreparers] = useState(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
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
      } else {
        setAuthorized(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateOfficeCode() {
    const prefix = addressState.toUpperCase() || 'XX';
    const random = Math.floor(1000 + Math.random() * 9000);
    setOfficeCode(`${prefix}-${random}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!officeCode || !officeName || !ownerName || !ownerEmail || !addressStreet || !addressCity || !addressState || !addressZip) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/franchise/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_code: officeCode,
          office_name: officeName,
          owner_name: ownerName,
          owner_email: ownerEmail,
          owner_phone: ownerPhone || null,
          address_street: addressStreet,
          address_city: addressCity,
          address_state: addressState,
          address_zip: addressZip,
          business_ein: businessEin || null,
          efin: efin || null,
          parent_efin: parentEfin || '000000',
          franchise_fee: franchiseFee,
          per_return_fee: perReturnFee,
          revenue_share_percent: revenueSharePercent,
          max_preparers: maxPreparers,
          notes: notes || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create office');
      }

      toast({
        title: 'Office Created',
        description: `${officeName} has been added to the franchise network`,
      });

      router.push('/franchise/admin/offices');

    } catch (error) {
      console.error('Error creating office:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create office',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
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
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Admin", href: "/franchise/admin" }, { label: "Offices" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/admin/offices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Office</h1>
          <p className="text-muted-foreground">
            Create a new franchise office
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Office Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Office Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Office Code *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={officeCode}
                    onChange={(e) => setOfficeCode(e.target.value.toUpperCase())}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateOfficeCode}>
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Office Name *</Label>
                <Input 
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>EFIN (if different from parent)</Label>
                <Input 
                  value={efin}
                  onChange={(e) => setEfin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Parent EFIN *</Label>
                <Input 
                  value={parentEfin}
                  onChange={(e) => setParentEfin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business EIN</Label>
              <Input 
                value={businessEin}
                onChange={(e) => setBusinessEin(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Owner Name *</Label>
              <Input 
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner Email *</Label>
                <Input 
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Owner Phone</Label>
                <Input 
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Office Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input 
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input 
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input 
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code *</Label>
                <Input 
                  value={addressZip}
                  onChange={(e) => setAddressZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Structure */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Franchise Fee ($)</Label>
                <Input 
                  type="number"
                  min={0}
                  value={franchiseFee}
                  onChange={(e) => setFranchiseFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Per Return Fee ($)</Label>
                <Input 
                  type="number"
                  min={0}
                  step={0.01}
                  value={perReturnFee}
                  onChange={(e) => setPerReturnFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Revenue Share (%)</Label>
                <Input 
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={revenueSharePercent}
                  onChange={(e) => setRevenueSharePercent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Preparers</Label>
              <Input 
                type="number"
                min={1}
                value={maxPreparers}
                onChange={(e) => setMaxPreparers(parseInt(e.target.value) || 10)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/franchise/admin/offices">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Office'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
