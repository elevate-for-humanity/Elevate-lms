
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
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [hasSpouse, setHasSpouse] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ssn, setSSN] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [filingStatus, setFilingStatus] = useState('');
  const [dependentsCount, setDependentsCount] = useState(0);
  const [preferredPreparerId, setPreferredPreparerId] = useState('');
  const [notes, setNotes] = useState('');

  // Spouse info
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [spouseSSN, setSpouseSSN] = useState('');

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
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('*, office:franchise_offices(*)')
          .eq('user_id', user.id)
          .single();

        if (preparer?.office) {
          setOffice(preparer.office);
          await loadPreparers(preparer.office.id);
        } else {
          router.push('/franchise');
          return;
        }
      } else {
        setOffice(officeData);
        await loadPreparers(officeData.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreparers(officeId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('franchise_preparers')
      .select('id, first_name, last_name')
      .eq('office_id', officeId)
      .eq('status', 'active')
      .order('last_name');

    if (data) {
      setPreparers(data);
    }
  }

  function formatSSN(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName || !lastName || !ssn) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const cleanSSN = ssn.replace(/\D/g, '');
    if (cleanSSN.length !== 9) {
      toast({
        title: 'Invalid SSN',
        description: 'SSN must be 9 digits',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/franchise/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_id: office.id,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          ssn: cleanSSN,
          address_street: addressStreet || null,
          address_city: addressCity || null,
          address_state: addressState || null,
          address_zip: addressZip || null,
          filing_status: filingStatus || null,
          dependents_count: dependentsCount,
          preferred_preparer_id: preferredPreparerId || null,
          spouse_first_name: hasSpouse ? spouseFirstName : null,
          spouse_last_name: hasSpouse ? spouseLastName : null,
          spouse_ssn: hasSpouse ? spouseSSN.replace(/\D/g, '') : null,
          notes: notes || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }

      toast({
        title: 'Client Created',
        description: `${firstName} ${lastName} has been added`,
      });

      router.push('/franchise/office/clients');

    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create client',
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
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Clients" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/office/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Client</h1>
          <p className="text-muted-foreground">
            Enter client information
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

            <div className="space-y-2">
              <Label>Social Security Number *</Label>
              <Input 
                value={ssn}
                onChange={(e) => setSSN(formatSSN(e.target.value))}
                placeholder="XXX-XX-XXXX"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setAddressZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married_filing_jointly">Married Filing Jointly</SelectItem>
                    <SelectItem value="married_filing_separately">Married Filing Separately</SelectItem>
                    <SelectItem value="head_of_household">Head of Household</SelectItem>
                    <SelectItem value="qualifying_widow">Qualifying Widow(er)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Dependents</Label>
                <Input 
                  type="number"
                  min={0}
                  value={dependentsCount}
                  onChange={(e) => setDependentsCount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Preparer</Label>
              <Select value={preferredPreparerId} onValueChange={setPreferredPreparerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preparer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  {preparers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Spouse Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Spouse Information
              </CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hasSpouse"
                  checked={hasSpouse}
                  onCheckedChange={(checked) => setHasSpouse(checked as boolean)}
                />
                <Label htmlFor="hasSpouse">Has Spouse</Label>
              </div>
            </div>
          </CardHeader>
          {hasSpouse && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Spouse First Name</Label>
                  <Input 
                    value={spouseFirstName}
                    onChange={(e) => setSpouseFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse Last Name</Label>
                  <Input 
                    value={spouseLastName}
                    onChange={(e) => setSpouseLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Spouse SSN</Label>
                <Input 
                  value={spouseSSN}
                  onChange={(e) => setSpouseSSN(formatSSN(e.target.value))}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
            </CardContent>
          )}
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
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/franchise/office/clients">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
