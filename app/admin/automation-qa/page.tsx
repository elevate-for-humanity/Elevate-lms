'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Building2,
  Users,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface AutomatedDecision {
  id: string;
  entity_type: string;
  entity_id: string;
  decision_type: string;
  outcome: string;
  actor: string;
  confidence_score: number | null;
  reason_codes: string[];
  processing_time_ms: number | null;
  created_at: string;
}

interface ReviewQueueItem {
  id: string;
  entity_type: string;
  review_type: string;
  priority: number;
  status: string;
  system_recommendation: string | null;
  created_at: string;
}

export default function AutomationQAPage() {
  const [decisions, setDecisions] = useState<AutomatedDecision[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    // Load recent automated decisions
    const { data: decisionsData } = await supabase
      .from('automated_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Load open review queue items
    const { data: reviewData } = await supabase
      .from('review_queue')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20);

    setDecisions(decisionsData || []);
    setReviewItems(reviewData || []);
    setLoading(false);
  }

  async function runDocumentProcessingTest() {
    setTestRunning(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/automation/test/document-processing', {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
      await loadData();
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestRunning(false);
  }

  async function runPartnerApprovalTest() {
    setTestRunning(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/automation/test/partner-approval', {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
      await loadData();
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestRunning(false);
  }

  async function runRoutingTest() {
    setTestRunning(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/automation/test/shop-routing', {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
      await loadData();
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestRunning(false);
  }

  // Calculate stats
  const stats = {
    totalDecisions: decisions.length,
    autoApproved: decisions.filter(d => d.outcome === 'approved' && d.actor === 'system').length,
    routedToReview: decisions.filter(d => d.outcome === 'routed_to_review').length,
    humanDecisions: decisions.filter(d => d.actor !== 'system').length,
    avgProcessingTime: decisions.filter(d => d.processing_time_ms).length > 0
      ? Math.round(decisions.filter(d => d.processing_time_ms).reduce((sum, d) => sum + (d.processing_time_ms || 0), 0) / decisions.filter(d => d.processing_time_ms).length)
      : 0,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          Automation QA Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Test and monitor the automated evidence processing, partner approval, and routing systems.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDecisions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Auto-Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoApproved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Routed to Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.routedToReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Human Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.humanDecisions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}ms</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList>
          <TabsTrigger value="test">Test Automation</TabsTrigger>
          <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
        </TabsList>

        {/* Test Automation Tab */}
        <TabsContent value="test">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Processing
                </CardTitle>
                <CardDescription>
                  Test OCR extraction and document validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runDocumentProcessingTest}
                  disabled={testRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Partner Approval
                </CardTitle>
                <CardDescription>
                  Test partner checklist and auto-approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runPartnerApprovalTest}
                  disabled={testRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Shop Routing
                </CardTitle>
                <CardDescription>
                  Test apprentice-to-shop placement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runRoutingTest}
                  disabled={testRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </CardContent>
            </Card>
          </div>

          {testResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Test Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {testResult}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Decisions Tab */}
        <TabsContent value="decisions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Automated Decisions</CardTitle>
                <CardDescription>
                  Last 20 decisions made by the automation system
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell>
                        <Badge variant="outline">{decision.entity_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {decision.decision_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={decision.outcome} />
                      </TableCell>
                      <TableCell>
                        {decision.actor === 'system' ? (
                          <Badge variant="secondary">System</Badge>
                        ) : (
                          <Badge variant="default">Human</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {decision.confidence_score !== null 
                          ? `${(decision.confidence_score * 100).toFixed(0)}%`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {decision.processing_time_ms 
                          ? `${decision.processing_time_ms}ms`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(decision.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {decisions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No automated decisions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Open Review Queue Items</CardTitle>
                <CardDescription>
                  Items waiting for human review
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Review Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={item.priority <= 2 ? 'destructive' : 'secondary'}>
                          P{item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.entity_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.review_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'in_progress' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.system_recommendation || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviewItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">All caught up! No items pending review.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  switch (outcome) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case 'routed_to_review':
      return <Badge className="bg-amber-100 text-amber-800">To Review</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{outcome}</Badge>;
  }
}
