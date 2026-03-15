
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface PendingReturn {
  id: string;
  submission_id: string;
  client_fee: number;
  created_at: string;
  preparer: {
    first_name: string;
    last_name: string;
    ptin: string;
  };
  client: {
    first_name: string;
    last_name: string;
  };
  return_data: {
    filing_status: string;
    total_income: number;
    refund_amount?: number;
    amount_owed?: number;
  };
}

export default function EROQueuePage() {
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [pendingReturns, setPendingReturns] = useState<PendingReturn[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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

      // Load pending returns
      const { data: returns } = await supabase
        .from('franchise_return_submissions')
        .select(`
          id,
          submission_id,
          client_fee,
          created_at,
          return_data,
          preparer:franchise_preparers(first_name, last_name, ptin),
          client:franchise_clients(first_name, last_name)
        `)
        .eq('office_id', officeData.id)
        .eq('status', 'pending_ero')
        .order('created_at', { ascending: true });

      if (returns) {
        setPendingReturns(returns as any);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending returns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function selectAll() {
    if (selectedIds.size === pendingReturns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReturns.map(r => r.id)));
    }
  }

  async function signSelected() {
    if (selectedIds.size === 0) {
      toast({
        title: 'No returns selected',
        description: 'Please select at least one return to sign',
        variant: 'destructive'
      });
      return;
    }

    setSigning(true);
    try {
      const response = await fetch('/api/franchise/ero/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: office.id,
          submissionIds: Array.from(selectedIds)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign returns');
      }

      toast({
        title: 'Returns Signed',
        description: `Successfully signed ${result.signed.length} return(s)`,
      });

      if (result.failed.length > 0) {
        toast({
          title: 'Some returns failed',
          description: `${result.failed.length} return(s) could not be signed`,
          variant: 'destructive'
        });
      }

      // Reload data
      setSelectedIds(new Set());
      loadData();

    } catch (error) {
      console.error('Error signing returns:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setSigning(false);
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
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office/dashboard" }, { label: "Ero Queue" }]} />
{/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/franchise/office/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">ERO Signature Queue</h1>
          <p className="text-muted-foreground">
            Review and sign returns as the Electronic Return Originator
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-brand-blue-50 dark:bg-brand-blue-950 border-brand-blue-200">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-brand-blue-500 mt-0.5" />
          <div>
            <p className="font-medium">ERO Signature Required</p>
            <p className="text-sm text-muted-foreground">
              As the ERO, your signature authorizes these returns for electronic filing with the IRS.
              By signing, you certify that you have reviewed the returns and they are accurate to the best of your knowledge.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      {pendingReturns.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox 
              checked={selectedIds.size === pendingReturns.length && pendingReturns.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {pendingReturns.length} selected
            </span>
          </div>
          <Button 
            onClick={signSelected} 
            disabled={selectedIds.size === 0 || signing}
          >
            {signing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <span className="text-slate-500 flex-shrink-0">•</span>
                Sign Selected ({selectedIds.size})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Returns</CardTitle>
          <CardDescription>
            {pendingReturns.length} return{pendingReturns.length !== 1 ? 's' : ''} awaiting your signature
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReturns.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">No returns pending your signature</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReturns.map((ret) => (
                <div 
                  key={ret.id} 
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    selectedIds.has(ret.id) ? 'bg-primary/5 border-primary' : ''
                  }`}
                >
                  <Checkbox 
                    checked={selectedIds.has(ret.id)}
                    onCheckedChange={() => toggleSelect(ret.id)}
                  />
                  
                  <div className="p-2 bg-muted rounded-full">
                    <FileText className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="font-medium">
                        {ret.client?.first_name} {ret.client?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ret.submission_id}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Preparer</p>
                      <p className="font-medium">
                        {ret.preparer?.first_name} {ret.preparer?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PTIN: {ret.preparer?.ptin}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Filing Status</p>
                      <p className="font-medium capitalize">
                        {ret.return_data?.filing_status?.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Income: ${ret.return_data?.total_income?.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {ret.return_data?.refund_amount ? (
                        <Badge variant="default" className="bg-brand-green-500">
                          Refund: ${ret.return_data.refund_amount.toLocaleString()}
                        </Badge>
                      ) : ret.return_data?.amount_owed ? (
                        <Badge variant="destructive">
                          Owed: ${ret.return_data.amount_owed.toLocaleString()}
                        </Badge>
                      ) : null}
                      <p className="text-sm text-muted-foreground mt-1">
                        Fee: ${ret.client_fee?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <Link href={`/franchise/office/returns/${ret.id}`}>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
