"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, DollarSign, Users, GraduationCap, Briefcase, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface FunderMetrics {
  funderType: 'WIOA' | 'WRG' | 'JRI' | 'SEAL' | 'Apprenticeship' | 'Other';
  funderName: string;
  totalEnrollments: number;
  activeStudents: number;
  completions: number;
  completionRate: number;
  placedInEmployment: number;
  placementRate: number;
  averageWage: number;
  medianWage: number;
  retentionRate: number;
  dropoutRate: number;
  averageCompletionTime: number;
  totalFundingUsed: number;
  costPerCompletion: number;
}

const funderDescriptions: Record<string, string> = {
  WIOA: 'Workforce Innovation and Opportunity Act - Federal workforce development funding',
  WRG: 'Workforce Readiness Grant - State-level workforce training grants',
  JRI: 'Justice Reinvestment Initiative - Reentry and justice-involved populations',
  SEAL: 'Skills Enhancement and Lifelong Learning - Adult education and upskilling',
  Apprenticeship: 'Registered Apprenticeship Programs - DOL-approved apprenticeships',
  Other: 'Other funding sources including private grants and partnerships',
};

const funderColors: Record<string, string> = {
  WIOA: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  WRG: 'bg-green-100 text-green-800 border-green-300',
  JRI: 'bg-purple-100 text-purple-800 border-purple-300',
  SEAL: 'bg-orange-100 text-orange-800 border-orange-300',
  Apprenticeship: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Other: 'bg-gray-100 text-black border-gray-300',
};

export default function FunderAnalytics() {
  const [metrics, setMetrics] = useState<FunderMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunder, setSelectedFunder] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/reporting/funder-metrics');
      const data = await response.json();
      setMetrics(data);
      if (data.length > 0) {
        setSelectedFunder(data[0].funderType);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Funder Type',
      'Total Enrollments',
      'Active Students',
      'Completions',
      'Completion Rate',
      'Placed in Employment',
      'Placement Rate',
      'Average Wage',
      'Median Wage',
      'Retention Rate',
      'Dropout Rate',
      'Avg Completion Time (days)',
      'Total Funding Used',
      'Cost per Completion',
      'ROI Multiple'
    ];

    const rows = metrics.map(m => [
      m.funderType,
      m.totalEnrollments,
      m.activeStudents,
      m.completions,
      `${m.completionRate.toFixed(1)}%`,
      m.placedInEmployment,
      `${m.placementRate.toFixed(1)}%`,
      `$${m.averageWage.toFixed(2)}`,
      `$${m.medianWage.toFixed(2)}`,
      `${m.retentionRate.toFixed(1)}%`,
      `${m.dropoutRate.toFixed(1)}%`,
      m.averageCompletionTime.toFixed(0),
      `$${m.totalFundingUsed.toFixed(2)}`,
      `$${m.costPerCompletion.toFixed(2)}`,
      m.costPerCompletion > 0 && m.averageWage > 0
        ? ((m.averageWage * 2080) / m.costPerCompletion).toFixed(2)
        : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funder-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportWIOAReport = async () => {
    // Generate WIOA PIRL report
    try {
      const response = await fetch('/api/reporting/wioa-pirl-export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wioa-pirl-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  };

  // Calculate aggregate metrics
  const totalFunding = metrics.reduce((sum, m) => sum + m.totalFundingUsed, 0);
  const totalEnrollments = metrics.reduce((sum, m) => sum + m.totalEnrollments, 0);
  const totalCompletions = metrics.reduce((sum, m) => sum + m.completions, 0);
  const totalPlaced = metrics.reduce((sum, m) => sum + m.placedInEmployment, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funder Analytics</h2>
          <p className="text-muted-foreground">
            WIOA, WRG, JRI, and other funding source performance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportWIOAReport} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export WIOA PIRL
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFunding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all funders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Funded students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              {totalEnrollments > 0 ? ((totalCompletions / totalEnrollments) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaced}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompletions > 0 ? ((totalPlaced / totalCompletions) * 100).toFixed(1) : 0}% placement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funder Tabs */}
      <Tabs value={selectedFunder || ''} onValueChange={setSelectedFunder}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {metrics.map(m => (
            <TabsTrigger key={m.funderType} value={m.funderType}>
              {m.funderType}
            </TabsTrigger>
          ))}
        </TabsList>

        {metrics.map(funder => (
          <TabsContent key={funder.funderType} value={funder.funderType} className="space-y-4">
            {/* Funder Info Card */}
            <Card className={`border-2 ${funderColors[funder.funderType]}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{funder.funderType}</CardTitle>
                    <CardDescription className="mt-2">
                      {funderDescriptions[funder.funderType]}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    ${funder.totalFundingUsed.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{funder.totalEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    {funder.activeStudents} currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{funder.completionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {funder.completions} completions
                  </p>
                  {funder.completionRate >= 70 ? (
                    <Badge variant="default" className="mt-2">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Above Target
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-2">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Below Target
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{funder.placementRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {funder.placedInEmployment} placed
                  </p>
                  {funder.placementRate >= 60 ? (
                    <Badge variant="default" className="mt-2">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Above Target
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-2">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Below Target
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Wage</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${funder.averageWage.toFixed(2)}/hr</div>
                  <p className="text-xs text-muted-foreground">
                    ${(funder.averageWage * 2080).toLocaleString()}/year
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Retention and completion tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-2xl font-bold">{funder.retentionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Dropout Rate</span>
                    <span className="text-2xl font-bold text-brand-orange-600">{funder.dropoutRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Completion Time</span>
                    <span className="text-2xl font-bold">{funder.averageCompletionTime.toFixed(0)} days</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Efficiency</CardTitle>
                  <CardDescription>Cost analysis and ROI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Funding Used</span>
                    <span className="text-2xl font-bold">${funder.totalFundingUsed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cost per Completion</span>
                    <span className="text-2xl font-bold">${funder.costPerCompletion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ROI Multiple</span>
                    {funder.costPerCompletion > 0 && funder.averageWage > 0 ? (
                      <Badge variant={
                        (funder.averageWage * 2080) / funder.costPerCompletion > 3
                          ? 'default'
                          : 'secondary'
                      } className="text-lg">
                        {((funder.averageWage * 2080) / funder.costPerCompletion).toFixed(1)}x
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Notes */}
            {funder.funderType === 'WIOA' && (
              <Card className="border-brand-blue-300 bg-brand-blue-50">
                <CardHeader>
                  <CardTitle>WIOA Compliance Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✅ PIRL data collection active for all participants</p>
                  <p>✅ Performance metrics tracked per DOL requirements</p>
                  <p>✅ Quarterly reporting ready for export</p>
                  <p>✅ Follow-up tracking at 2nd and 4th quarter post-exit</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Funder Comparison</CardTitle>
          <CardDescription>Compare performance across all funding sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Funder</th>
                  <th className="text-right py-2">Funding</th>
                  <th className="text-right py-2">Enrollments</th>
                  <th className="text-right py-2">Completion</th>
                  <th className="text-right py-2">Placement</th>
                  <th className="text-right py-2">Avg Wage</th>
                  <th className="text-right py-2">Cost/Completion</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.funderType} className="border-b hover:bg-muted/50">
                    <td className="py-2">
                      <Badge variant="outline" className={funderColors[m.funderType]}>
                        {m.funderType}
                      </Badge>
                    </td>
                    <td className="text-right py-2">${m.totalFundingUsed.toLocaleString()}</td>
                    <td className="text-right py-2">{m.totalEnrollments}</td>
                    <td className="text-right py-2">{m.completionRate.toFixed(1)}%</td>
                    <td className="text-right py-2">{m.placementRate.toFixed(1)}%</td>
                    <td className="text-right py-2">${m.averageWage.toFixed(2)}</td>
                    <td className="text-right py-2">${m.costPerCompletion.toLocaleString()}</td>
                    <td className="text-right py-2">
                      {m.costPerCompletion > 0 && m.averageWage > 0
                        ? `${((m.averageWage * 2080) / m.costPerCompletion).toFixed(1)}x`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
