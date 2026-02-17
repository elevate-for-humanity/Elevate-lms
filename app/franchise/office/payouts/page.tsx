
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  DollarSign,
  Users,
  Clock,
  Loader2,
  Download,
CheckCircle, } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface PayoutSummary {
  preparer_id: string;
  preparer_name: string;
  returns_count: number;
  gross_earnings: number;
  pending_payout: number;
  paid_to_date: number;
}

interface Payout {
  id: string;
  preparer_id: string;
  period_start: string;
  period_end: string;
  returns_count: number;
  gross_earnings: number;
  net_earnings: number;
  status: string;
  paid_at: string | null;
  preparer: {
    first_name: string;
    last_name: string;
  };
}

export default function PayoutsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [summaries, setSummaries] = useState<PayoutSummary[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    // Set default period to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
    
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

      // Load payout summaries
      await loadSummaries(officeData.id);

      // Load recent payouts
      const { data: payoutsData } = await supabase
        .from('franchise_preparer_payouts')
        .select('*, preparer:franchise_preparers(first_name, last_name)')
        .eq('office_id', officeData.id)
        .order('period_end', { ascending: false })
        .limit(20);

      if (payoutsData) {
        setPayouts(payoutsData as any);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSummaries(officeId: string) {
    const supabase = createClient();

    // Get preparers
    const { data: preparers } = await supabase
      .from('franchise_preparers')
      .select('id, first_name, last_name')
      .eq('office_id', officeId)
      .eq('status', 'active');

    if (!preparers) return;

    const summaryData: PayoutSummary[] = [];

    for (const preparer of preparers) {
      // Get returns
      const { data: returns } = await supabase
        .from('franchise_return_submissions')
        .select('preparer_commission')
        .eq('preparer_id', preparer.id)
        .in('status', ['accepted', 'submitted']);

      const returnsCount = returns?.length || 0;
      const grossEarnings = returns?.reduce((sum, r) => sum + (r.preparer_commission || 0), 0) || 0;

      // Get paid
      const { data: paidPayouts } = await supabase
        .from('franchise_preparer_payouts')
        .select('net_earnings')
        .eq('preparer_id', preparer.id)
        .eq('status', 'paid');

      const paidToDate = paidPayouts?.reduce((sum, p) => sum + (p.net_earnings || 0), 0) || 0;

      // Get pending
      const { data: pendingPayouts } = await supabase
        .from('franchise_preparer_payouts')
        .select('net_earnings')
        .eq('preparer_id', preparer.id)
        .in('status', ['pending', 'approved']);

      const pendingPayout = pendingPayouts?.reduce((sum, p) => sum + (p.net_earnings || 0), 0) || 0;

      summaryData.push({
        preparer_id: preparer.id,
        preparer_name: `${preparer.first_name} ${preparer.last_name}`,
        returns_count: returnsCount,
        gross_earnings: grossEarnings,
        pending_payout: pendingPayout,
        paid_to_date: paidToDate
      });
    }

    setSummaries(summaryData);
  }

  async function generatePayouts() {
    if (!periodStart || !periodEnd) {
      toast({
        title: 'Missing Period',
        description: 'Please select a period',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/franchise/payouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: office.id,
          periodStart,
          periodEnd
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate payouts');
      }

      toast({
        title: 'Payouts Generated',
        description: `Generated ${result.generated?.length || 0} payout(s)`,
      });

      loadData();
    } catch (error) {
      console.error('Error generating payouts:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }

  async function approvePayout(payoutId: string) {
    try {
      const response = await fetch(`/api/franchise/payouts/${payoutId}/approve`, {
        method: 'POST'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to approve payout');
      }

      toast({ title: 'Payout Approved' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    }
  }

  async function markPaid(payoutId: string) {
    const reference = prompt('Enter payment reference (check #, transaction ID, etc.):');
    if (!reference) return;

    try {
      const response = await fetch(`/api/franchise/payouts/${payoutId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'check',
          reference
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to mark as paid');
      }

      toast({ title: 'Payout Marked as Paid' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    }
  }

  const totals = {
    earnings: summaries.reduce((sum, s) => sum + s.gross_earnings, 0),
    pending: summaries.reduce((sum, s) => sum + s.pending_payout, 0),
    paid: summaries.reduce((sum, s) => sum + s.paid_to_date, 0)
  };

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

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Payouts" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Preparer Payouts</h1>
            <p className="text-muted-foreground">
              Manage preparer commission payments
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.earnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All preparer commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-orange-600">${totals.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-green-600">${totals.paid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Payouts</CardTitle>
          <CardDescription>
            Create payout records for a specific period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input 
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input 
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <Button onClick={generatePayouts} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              Generate Payouts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preparer Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Preparer Summary</CardTitle>
          <CardDescription>
            Earnings overview by preparer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No preparers found
            </p>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div 
                  key={summary.preparer_id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{summary.preparer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {summary.returns_count} returns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <p className="font-medium">${summary.gross_earnings.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="font-medium text-brand-orange-600">
                        ${summary.pending_payout.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="font-medium text-brand-green-600">
                        ${summary.paid_to_date.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>
            Payout history and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No payouts generated yet
            </p>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div 
                  key={payout.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {payout.preparer?.first_name} {payout.preparer?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payout.returns_count} returns
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${payout.net_earnings.toLocaleString()}</p>
                      <Badge variant={
                        payout.status === 'paid' ? 'default' :
                        payout.status === 'approved' ? 'secondary' :
                        'outline'
                      }>
                        {payout.status === 'paid' && <span className="text-slate-400 flex-shrink-0">•</span>}
                        {payout.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {payout.status}
                      </Badge>
                    </div>
                    {payout.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => approvePayout(payout.id)}>
                        Approve
                      </Button>
                    )}
                    {payout.status === 'approved' && (
                      <Button size="sm" onClick={() => markPaid(payout.id)}>
                        Mark Paid
                      </Button>
                    )}
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
