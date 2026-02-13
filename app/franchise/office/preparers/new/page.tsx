export const dynamic = 'force-dynamic';

'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Loader2,
  User,
  DollarSign,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function NewPreparerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [office, setOffice] = useState<any>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ptin, setPTIN] = useState('');
  const [ptinExpiration, setPTINExpiration] = useState('');
  const [certificationLevel, setCertificationLevel] = useState('');
  const [isEfinAuthorized, setIsEfinAuthorized] = useState(false);
  const [isEroAuthorized, setIsEroAuthorized] = useState(false);
  const [commissionType, setCommissionType] = useState('per_return');
  const [perReturnFee, setPerReturnFee] = useState<number>(25);
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user's office
      const { data: officeData } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!officeData) {
        toast({
          title: 'Access Denied',
          description: 'You must be an office owner to add preparers',
          variant: 'destructive'
        });
        router.push('/franchise');
        return;
      }

      setOffice(officeData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatPTIN(value: string): string {
    const clean = value.toUpperCase().replace(/[^P0-9]/g, '');
    if (clean.startsWith('P')) {
      return 'P' + clean.slice(1, 9);
    }
    return clean.slice(0, 8);
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName || !lastName || !email || !ptin) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Validate PTIN format
    if (!ptin.match(/^P\d{8}$/)) {
      toast({
        title: 'Invalid PTIN',
        description: 'PTIN must be P followed by 8 digits (e.g., P12345678)',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/franchise/preparers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_id: office.id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          ptin,
          ptin_expiration: ptinExpiration || null,
          certification_level: certificationLevel || null,
          is_efin_authorized: isEfinAuthorized,
          is_ero_authorized: isEroAuthorized,
          commission_type: commissionType,
          per_return_fee: commissionType === 'per_return' ? perReturnFee : null,
          commission_rate: commissionType === 'commission' ? commissionRate : null,
          hourly_rate: commissionType === 'hourly' ? hourlyRate : null,
          notes: notes || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create preparer');
      }

      toast({
        title: 'Preparer Added',
        description: `${firstName} ${lastName} has been added to your office`,
      });

      router.push('/franchise/office/preparers');

    } catch (error) {
      console.error('Error creating preparer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create preparer',
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

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Preparers" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/office/preparers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Preparer</h1>
          <p className="text-muted-foreground">
            Add a tax preparer to your office
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IRS Credentials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IRS Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PTIN *</Label>
                <Input 
                  value={ptin}
                  onChange={(e) => setPTIN(formatPTIN(e.target.value))}
                  placeholder="P12345678"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Preparer Tax Identification Number
                </p>
              </div>
              <div className="space-y-2">
                <Label>PTIN Expiration</Label>
                <Input 
                  type="date"
                  value={ptinExpiration}
                  onChange={(e) => setPTINExpiration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Certification Level</Label>
              <Select value={certificationLevel} onValueChange={setCertificationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="efin"
                  checked={isEfinAuthorized}
                  onCheckedChange={(checked) => setIsEfinAuthorized(checked as boolean)}
                />
                <Label htmlFor="efin">EFIN Authorized</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="ero"
                  checked={isEroAuthorized}
                  onCheckedChange={(checked) => setIsEroAuthorized(checked as boolean)}
                />
                <Label htmlFor="ero">ERO Authorized</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Compensation Type</Label>
              <Select value={commissionType} onValueChange={setCommissionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_return">Per Return</SelectItem>
                  <SelectItem value="commission">Commission (%)</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {commissionType === 'per_return' && (
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
            )}

            {commissionType === 'commission' && (
              <div className="space-y-2">
                <Label>Commission Rate (%)</Label>
                <Input 
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {commissionType === 'hourly' && (
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input 
                  type="number"
                  min={0}
                  step={0.01}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
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
              placeholder="Any additional notes about this preparer..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/franchise/office/preparers">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Preparer'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
