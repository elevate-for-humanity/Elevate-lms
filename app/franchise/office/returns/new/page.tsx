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
import { 
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  DollarSign,
  Loader2,
CheckCircle, } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  ssn_last_four: string;
  email: string;
}

interface Preparer {
  id: string;
  first_name: string;
  last_name: string;
  ptin: string;
  status: string;
}

type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow';

export default function NewReturnPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPreparer, setSelectedPreparer] = useState<string>('');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [clientFee, setClientFee] = useState<number>(150);

  // Income fields
  const [wages, setWages] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [dividends, setDividends] = useState<number>(0);
  const [businessIncome, setBusinessIncome] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);

  // Deductions
  const [standardDeduction, setStandardDeduction] = useState(true);
  const [itemizedDeductions, setItemizedDeductions] = useState<number>(0);

  // Withholding
  const [federalWithholding, setFederalWithholding] = useState<number>(0);
  const [estimatedPayments, setEstimatedPayments] = useState<number>(0);

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

      // Get user's office or check if they're a preparer
      let officeData = null;

      // Check if owner
      const { data: ownedOffice } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (ownedOffice) {
        officeData = ownedOffice;
      } else {
        // Check if preparer
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('*, office:franchise_offices(*)')
          .eq('user_id', user.id)
          .single();

        if (preparer?.office) {
          officeData = preparer.office;
          setSelectedPreparer(preparer.id);
        }
      }

      if (!officeData) {
        toast({
          title: 'Access Denied',
          description: 'You must be associated with an office to create returns',
          variant: 'destructive'
        });
        router.push('/franchise');
        return;
      }

      setOffice(officeData);

      // Load clients for this office
      const { data: clientsData } = await supabase
        .from('franchise_clients')
        .select('id, first_name, last_name, ssn_last_four, email')
        .eq('office_id', officeData.id)
        .order('last_name');

      if (clientsData) {
        setClients(clientsData);
      }

      // Load preparers for this office
      const { data: preparersData } = await supabase
        .from('franchise_preparers')
        .select('id, first_name, last_name, ptin, status')
        .eq('office_id', officeData.id)
        .eq('status', 'active')
        .order('last_name');

      if (preparersData) {
        setPreparers(preparersData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  const totalIncome = wages + interest + dividends + businessIncome + otherIncome;
  
  const deductionAmount = standardDeduction 
    ? getStandardDeduction(filingStatus, taxYear)
    : itemizedDeductions;

  const taxableIncome = Math.max(0, totalIncome - deductionAmount);
  const estimatedTax = calculateTax(taxableIncome, filingStatus, taxYear);
  const totalPayments = federalWithholding + estimatedPayments;
  const refundOrOwed = totalPayments - estimatedTax;

  function getStandardDeduction(status: FilingStatus, year: number): number {
    // 2023 standard deductions
    const deductions: Record<FilingStatus, number> = {
      single: 13850,
      married_filing_jointly: 27700,
      married_filing_separately: 13850,
      head_of_household: 20800,
      qualifying_widow: 27700
    };
    return deductions[status] || 13850;
  }

  function calculateTax(income: number, status: FilingStatus, year: number): number {
    // Simplified 2023 tax brackets for single filers
    // In production, use full bracket tables for all filing statuses
    if (income <= 0) return 0;
    
    let tax = 0;
    const brackets = [
      { limit: 11000, rate: 0.10 },
      { limit: 44725, rate: 0.12 },
      { limit: 95375, rate: 0.22 },
      { limit: 182100, rate: 0.24 },
      { limit: 231250, rate: 0.32 },
      { limit: 578125, rate: 0.35 },
      { limit: Infinity, rate: 0.37 }
    ];

    let remaining = income;
    let prevLimit = 0;

    for (const bracket of brackets) {
      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
      if (taxableInBracket <= 0) break;
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit;
    }

    return Math.round(tax);
  }

  async function handleSubmit() {
    if (!selectedClient || !selectedPreparer) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client and preparer',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get client details for the return
      const client = clients.find(c => c.id === selectedClient);
      if (!client) throw new Error('Client not found');

      const taxReturn = {
        taxYear,
        filingStatus,
        taxpayer: {
          firstName: client.first_name,
          lastName: client.last_name,
          ssn: '***-**-' + client.ssn_last_four, // Placeholder - real SSN from secure storage
        },
        income: {
          wages,
          interest,
          dividends,
          businessIncome,
          otherIncome
        },
        totalIncome,
        deductions: {
          standard: standardDeduction,
          itemized: itemizedDeductions,
          total: deductionAmount
        },
        taxableIncome,
        tax: estimatedTax,
        payments: {
          federalWithholding,
          estimatedPayments,
          total: totalPayments
        },
        refundAmount: refundOrOwed > 0 ? refundOrOwed : 0,
        amountOwed: refundOrOwed < 0 ? Math.abs(refundOrOwed) : 0
      };

      const response = await fetch('/api/franchise/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: office.id,
          preparerId: selectedPreparer,
          clientId: selectedClient,
          taxReturn,
          clientFee
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create return');
      }

      toast({
        title: 'Return Created',
        description: 'The tax return has been created and is pending ERO signature',
      });

      router.push('/franchise/office');

    } catch (error) {
      console.error('Error creating return:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
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
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office" }, { label: "Returns" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/office">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Tax Return</h1>
          <p className="text-muted-foreground">
            Create a new tax return for a client
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {currentStep > step ? <span className="text-slate-400 flex-shrink-0">•</span> : step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Client & Preparer Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client & Preparer
            </CardTitle>
            <CardDescription>
              Select the client and preparer for this return
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} (***-**-{client.ssn_last_four})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/franchise/office/clients/new" className="text-sm text-primary hover:underline">
                + Add new client
              </Link>
            </div>

            <div className="space-y-2">
              <Label>Preparer</Label>
              <Select value={selectedPreparer} onValueChange={setSelectedPreparer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preparer" />
                </SelectTrigger>
                <SelectContent>
                  {preparers.map(preparer => (
                    <SelectItem key={preparer.id} value={preparer.id}>
                      {preparer.first_name} {preparer.last_name} (PTIN: {preparer.ptin})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Year</Label>
                <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                      {new Date().getFullYear() - 1}
                    </SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 2).toString()}>
                      {new Date().getFullYear() - 2}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filing Status</Label>
                <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as FilingStatus)}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!selectedClient || !selectedPreparer}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Income */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Income
            </CardTitle>
            <CardDescription>
              Enter the client's income information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wages (W-2)</Label>
                <Input 
                  type="number" 
                  value={wages} 
                  onChange={(e) => setWages(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Income</Label>
                <Input 
                  type="number" 
                  value={interest} 
                  onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dividend Income</Label>
                <Input 
                  type="number" 
                  value={dividends} 
                  onChange={(e) => setDividends(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Business Income (Schedule C)</Label>
                <Input 
                  type="number" 
                  value={businessIncome} 
                  onChange={(e) => setBusinessIncome(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Other Income</Label>
                <Input 
                  type="number" 
                  value={otherIncome} 
                  onChange={(e) => setOtherIncome(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold">${totalIncome.toLocaleString()}</p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Deductions & Payments */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deductions & Payments
            </CardTitle>
            <CardDescription>
              Enter deductions and tax payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Deduction Type</Label>
              <div className="flex gap-4">
                <Button 
                  variant={standardDeduction ? 'default' : 'outline'}
                  onClick={() => setStandardDeduction(true)}
                >
                  Standard (${getStandardDeduction(filingStatus, taxYear).toLocaleString()})
                </Button>
                <Button 
                  variant={!standardDeduction ? 'default' : 'outline'}
                  onClick={() => setStandardDeduction(false)}
                >
                  Itemized
                </Button>
              </div>
              {!standardDeduction && (
                <div className="space-y-2">
                  <Label>Itemized Deductions Total</Label>
                  <Input 
                    type="number" 
                    value={itemizedDeductions} 
                    onChange={(e) => setItemizedDeductions(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Federal Tax Withheld (from W-2s)</Label>
                <Input 
                  type="number" 
                  value={federalWithholding} 
                  onChange={(e) => setFederalWithholding(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Tax Payments</Label>
                <Input 
                  type="number" 
                  value={estimatedPayments} 
                  onChange={(e) => setEstimatedPayments(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Taxable Income:</span>
                <span className="font-medium">${taxableIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax:</span>
                <span className="font-medium">${estimatedTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payments:</span>
                <span className="font-medium">${totalPayments.toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg">
                <span>{refundOrOwed >= 0 ? 'Refund:' : 'Amount Owed:'}</span>
                <span className={`font-bold ${refundOrOwed >= 0 ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
                  ${Math.abs(refundOrOwed).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              Review & Submit
            </CardTitle>
            <CardDescription>
              Review the return details and set the client fee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Return Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span>{clients.find(c => c.id === selectedClient)?.first_name} {clients.find(c => c.id === selectedClient)?.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preparer:</span>
                    <span>{preparers.find(p => p.id === selectedPreparer)?.first_name} {preparers.find(p => p.id === selectedPreparer)?.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Year:</span>
                    <span>{taxYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Status:</span>
                    <span className="capitalize">{filingStatus.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Tax Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Income:</span>
                    <span>${totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Income:</span>
                    <span>${taxableIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>${estimatedTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{refundOrOwed >= 0 ? 'Refund:' : 'Owed:'}</span>
                    <span className={refundOrOwed >= 0 ? 'text-brand-green-600' : 'text-brand-red-600'}>
                      ${Math.abs(refundOrOwed).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client Fee</Label>
              <Input 
                type="number" 
                value={clientFee} 
                onChange={(e) => setClientFee(parseFloat(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Fee charged to the client for this return
              </p>
            </div>

            <div className="bg-brand-orange-50 dark:bg-brand-orange-950 border border-brand-orange-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Note:</strong> This return will be submitted for ERO signature before being filed with the IRS.
                The preparer's PTIN and your office's EFIN will be included on the return.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Create Return
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
