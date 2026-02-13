
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp,
  Users,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface PreparerCommission {
  id: string;
  first_name: string;
  last_name: string;
  ptin: string;
  commission_type: string;
  commission_rate: number | null;
  per_return_fee: number | null;
  returns_count: number;
  total_client_fees: number;
  total_commission: number;
  returns: {
    id: string;
    submission_id: string;
    client_fee: number;
    preparer_commission: number;
    created_at: string;
    status: string;
  }[];
}

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<any>(null);
  const [preparerCommissions, setPreparerCommissions] = useState<PreparerCommission[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [expandedPreparer, setExpandedPreparer] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  async function loadData() {
    try {
      setLoading(true);
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

      // Build date filter
      let startDate = `${selectedYear}-01-01`;
      let endDate = `${selectedYear}-12-31`;
      
      if (selectedMonth !== 'all') {
        const month = selectedMonth.padStart(2, '0');
        startDate = `${selectedYear}-${month}-01`;
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
        endDate = `${selectedYear}-${month}-${lastDay}`;
      }

      // Get preparers with their returns
      const { data: preparers } = await supabase
        .from('franchise_preparers')
        .select('*')
        .eq('office_id', officeData.id);

      if (!preparers) {
        setPreparerCommissions([]);
        return;
      }

      // Get returns for each preparer
      const commissionsData: PreparerCommission[] = [];

      for (const preparer of preparers) {
        const { data: returns } = await supabase
          .from('franchise_return_submissions')
          .select('id, submission_id, client_fee, preparer_commission, created_at, status')
          .eq('preparer_id', preparer.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('created_at', { ascending: false });

        const returnsData = returns || [];
        const totalClientFees = returnsData.reduce((sum, r) => sum + (r.client_fee || 0), 0);
        const totalCommission = returnsData.reduce((sum, r) => sum + (r.preparer_commission || 0), 0);

        commissionsData.push({
          id: preparer.id,
          first_name: preparer.first_name,
          last_name: preparer.last_name,
          ptin: preparer.ptin,
          commission_type: preparer.commission_type,
          commission_rate: preparer.commission_rate,
          per_return_fee: preparer.per_return_fee,
          returns_count: returnsData.length,
          total_client_fees: totalClientFees,
          total_commission: totalCommission,
          returns: returnsData
        });
      }

      // Sort by total commission descending
      commissionsData.sort((a, b) => b.total_commission - a.total_commission);
      setPreparerCommissions(commissionsData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const headers = ['Preparer', 'PTIN', 'Commission Type', 'Returns', 'Client Fees', 'Commission'];
    const rows = preparerCommissions.map(p => [
      `${p.first_name} ${p.last_name}`,
      p.ptin,
      p.commission_type,
      p.returns_count,
      p.total_client_fees,
      p.total_commission
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${selectedYear}-${selectedMonth}.csv`;
    a.click();
  }

  const totals = {
    returns: preparerCommissions.reduce((sum, p) => sum + p.returns_count, 0),
    clientFees: preparerCommissions.reduce((sum, p) => sum + p.total_client_fees, 0),
    commissions: preparerCommissions.reduce((sum, p) => sum + p.total_commission, 0)
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
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Commissions" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Commission Report</h1>
            <p className="text-muted-foreground">
              Track preparer commissions and earnings
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.returns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Client Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.clientFees.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totals.commissions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preparer List */}
      <Card>
        <CardHeader>
          <CardTitle>Preparer Commissions</CardTitle>
          <CardDescription>
            Breakdown by preparer for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preparerCommissions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No commission data for the selected period
            </p>
          ) : (
            <div className="space-y-4">
              {preparerCommissions.map((preparer) => (
                <div key={preparer.id} className="border rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedPreparer(
                      expandedPreparer === preparer.id ? null : preparer.id
                    )}
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
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline" className="capitalize">
                          {preparer.commission_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Returns</p>
                        <p className="font-medium">{preparer.returns_count}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Client Fees</p>
                        <p className="font-medium">${preparer.total_client_fees.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Commission</p>
                        <p className="font-medium text-green-600">
                          ${preparer.total_commission.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {expandedPreparer === preparer.id && preparer.returns.length > 0 && (
                    <div className="border-t bg-muted/30 p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-2">Submission ID</th>
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Status</th>
                            <th className="text-right py-2">Client Fee</th>
                            <th className="text-right py-2">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preparer.returns.map((ret) => (
                            <tr key={ret.id} className="border-t">
                              <td className="py-2">{ret.submission_id}</td>
                              <td className="py-2">
                                {new Date(ret.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2">
                                <Badge variant={
                                  ret.status === 'accepted' ? 'default' :
                                  ret.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                } className="text-xs">
                                  {ret.status}
                                </Badge>
                              </td>
                              <td className="py-2 text-right">
                                ${ret.client_fee?.toLocaleString()}
                              </td>
                              <td className="py-2 text-right text-green-600">
                                ${ret.preparer_commission?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
