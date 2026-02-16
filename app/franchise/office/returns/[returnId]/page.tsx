
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  FileText,
  User,
  DollarSign,
  Clock,
  AlertCircle,
  Download,
CheckCircle, } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface ReturnDetail {
  id: string;
  submission_id: string;
  tax_year: number;
  efin: string;
  status: string;
  filing_status: string;
  client_fee: number;
  franchise_fee: number;
  preparer_commission: number;
  office_revenue: number;
  return_data: {
    total_income?: number;
    taxable_income?: number;
    refund_amount?: number;
    amount_owed?: number;
  };
  ero_signature: any;
  ero_signed_at: string | null;
  irs_submission_id: string | null;
  irs_status: string | null;
  irs_errors: any;
  created_at: string;
  submitted_at: string | null;
  preparer: {
    id: string;
    first_name: string;
    last_name: string;
    ptin: string;
  };
  client: {
    id: string;
    first_name: string;
    last_name: string;
    ssn_last_four: string;
    email: string | null;
  };
  ero: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const returnId = params.returnId as string;

  const [loading, setLoading] = useState(true);
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);

  useEffect(() => {
    loadData();
  }, [returnId]);

  async function loadData() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('franchise_return_submissions')
        .select(`
          *,
          preparer:franchise_preparers(id, first_name, last_name, ptin),
          client:franchise_clients(id, first_name, last_name, ssn_last_four, email),
          ero:franchise_preparers!franchise_return_submissions_ero_id_fkey(first_name, last_name)
        `)
        .eq('id', returnId)
        .single();

      if (error || !data) {
        toast({ title: 'Return not found', variant: 'destructive' });
        router.push('/franchise/office/returns');
        return;
      }

      setReturnData(data as any);
    } catch (error) {
      console.error('Error loading return:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'pending_ero': return 'secondary';
      case 'submitted': return 'outline';
      default: return 'outline';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'accepted': return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      case 'pending_ero': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!returnData) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Returns" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/returns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {returnData.tax_year} Tax Return
            </h1>
            <p className="text-muted-foreground">
              {returnData.submission_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(returnData.status)} className="flex items-center gap-1">
            {getStatusIcon(returnData.status)}
            {returnData.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${returnData.created_at ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(returnData.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${returnData.ero_signed_at ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                {returnData.ero_signed_at ? <span className="text-slate-400 flex-shrink-0">•</span> : <Clock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">ERO Signed</p>
                <p className="text-xs text-muted-foreground">
                  {returnData.ero_signed_at ? new Date(returnData.ero_signed_at).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${returnData.submitted_at ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                {returnData.submitted_at ? <span className="text-slate-400 flex-shrink-0">•</span> : <Clock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-xs text-muted-foreground">
                  {returnData.submitted_at ? new Date(returnData.submitted_at).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                returnData.status === 'accepted' ? 'bg-green-500 text-white' : 
                returnData.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-muted'
              }`}>
                {returnData.status === 'accepted' ? <span className="text-slate-400 flex-shrink-0">•</span> : 
                 returnData.status === 'rejected' ? <AlertCircle className="h-4 w-4" /> : 
                 <Clock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">IRS Response</p>
                <p className="text-xs text-muted-foreground">
                  {returnData.irs_status || 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          {returnData.irs_errors && <TabsTrigger value="errors">Errors</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {returnData.client?.first_name} {returnData.client?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SSN</p>
                  <p className="font-medium">***-**-{returnData.client?.ssn_last_four}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{returnData.client?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Filing Status</p>
                  <p className="font-medium capitalize">{returnData.filing_status?.replace('_', ' ')}</p>
                </div>
                <Link href={`/franchise/office/clients/${returnData.client?.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Client</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Preparer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preparer & ERO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preparer</p>
                  <p className="font-medium">
                    {returnData.preparer?.first_name} {returnData.preparer?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">PTIN: {returnData.preparer?.ptin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ERO</p>
                  <p className="font-medium">
                    {returnData.ero ? `${returnData.ero.first_name} ${returnData.ero.last_name}` : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EFIN</p>
                  <p className="font-medium">{returnData.efin}</p>
                </div>
                {returnData.irs_submission_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">IRS Submission ID</p>
                    <p className="font-medium">{returnData.irs_submission_id}</p>
                  </div>
                )}
                <Link href={`/franchise/office/preparers/${returnData.preparer?.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Preparer</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Return Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Return Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="font-medium">${returnData.return_data?.total_income?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxable Income</p>
                    <p className="font-medium">${returnData.return_data?.taxable_income?.toLocaleString() || 0}</p>
                  </div>
                </div>
                {returnData.return_data?.refund_amount ? (
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Refund Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${returnData.return_data.refund_amount.toLocaleString()}
                    </p>
                  </div>
                ) : returnData.return_data?.amount_owed ? (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Amount Owed</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${returnData.return_data.amount_owed.toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Client Fee</span>
                  <span className="text-xl font-bold">${returnData.client_fee?.toLocaleString()}</span>
                </div>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Franchise Fee</span>
                    <span className="text-red-600">-${returnData.franchise_fee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preparer Commission</span>
                    <span className="text-red-600">-${returnData.preparer_commission?.toLocaleString()}</span>
                  </div>
                </div>
                <hr />
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="font-medium">Office Revenue</span>
                  <span className="text-xl font-bold text-green-600">${returnData.office_revenue?.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {returnData.irs_errors && (
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  IRS Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(returnData.irs_errors) ? (
                    returnData.irs_errors.map((error: any, index: number) => (
                      <div key={index} className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="font-medium">{error.code || 'Error'}</p>
                        <p className="text-sm text-muted-foreground">{'An error occurred'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <pre className="text-sm">{JSON.stringify(returnData.irs_errors, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
