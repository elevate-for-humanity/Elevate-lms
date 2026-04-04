"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, TrendingUp, TrendingDown, Users, GraduationCap, Briefcase, DollarSign } from 'lucide-react';

interface ProgramMetrics {
  programId: string;
  programName: string;
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

export default function ProgramAnalytics() {
  const [metrics, setMetrics] = useState<ProgramMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/reporting/program-metrics');
      const data = await response.json();
      setMetrics(data);
      if (data.length > 0) {
        setSelectedProgram(data[0].programId);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Program',
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
      'Cost per Completion'
    ];

    const rows = metrics.map(m => [
      m.programName,
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
      `$${m.costPerCompletion.toFixed(2)}`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `program-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const selectedMetrics = metrics.find(m => m.programId === selectedProgram);

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
          <h2 className="text-3xl font-bold tracking-tight">Program Analytics</h2>
          <p className="text-muted-foreground">
            Enrollment, completion, and outcome metrics by program
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Tabs value={selectedProgram || ''} onValueChange={setSelectedProgram}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-2">
          {metrics.slice(0, 10).map(m => (
            <TabsTrigger key={m.programId} value={m.programId}>
              {m.programName}
            </TabsTrigger>
          ))}
        </TabsList>

        {metrics.map(program => (
          <TabsContent key={program.programId} value={program.programId} className="space-y-4">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.totalEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    {program.activeStudents} currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.completionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {program.completions} completions
                  </p>
                  {program.completionRate >= 70 ? (
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
                  <div className="text-2xl font-bold">{program.placementRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {program.placedInEmployment} placed
                  </p>
                  {program.placementRate >= 60 ? (
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
                  <div className="text-2xl font-bold">${program.averageWage.toFixed(2)}/hr</div>
                  <p className="text-xs text-muted-foreground">
                    Median: ${program.medianWage.toFixed(2)}/hr
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Retention & Completion</CardTitle>
                  <CardDescription>Student persistence metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-2xl font-bold">{program.retentionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Dropout Rate</span>
                    <span className="text-2xl font-bold text-brand-orange-600">{program.dropoutRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Completion Time</span>
                    <span className="text-2xl font-bold">{program.averageCompletionTime.toFixed(0)} days</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funding & Cost</CardTitle>
                  <CardDescription>Financial efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Funding Used</span>
                    <span className="text-2xl font-bold">${program.totalFundingUsed.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cost per Completion</span>
                    <span className="text-2xl font-bold">${program.costPerCompletion.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ROI Indicator</span>
                    {program.costPerCompletion > 0 && program.averageWage > 0 ? (
                      <Badge variant={
                        (program.averageWage * 2080) / program.costPerCompletion > 3
                          ? 'default'
                          : 'secondary'
                      }>
                        {((program.averageWage * 2080) / program.costPerCompletion).toFixed(1)}x
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Program Comparison</CardTitle>
                <CardDescription>Compare this program against all programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Program</th>
                        <th className="text-right py-2">Enrollments</th>
                        <th className="text-right py-2">Completion</th>
                        <th className="text-right py-2">Placement</th>
                        <th className="text-right py-2">Avg Wage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr
                          key={m.programId}
                          className={`border-b ${m.programId === program.programId ? 'bg-muted' : ''}`}
                        >
                          <td className="py-2">{m.programName}</td>
                          <td className="text-right py-2">{m.totalEnrollments}</td>
                          <td className="text-right py-2">{m.completionRate.toFixed(1)}%</td>
                          <td className="text-right py-2">{m.placementRate.toFixed(1)}%</td>
                          <td className="text-right py-2">${m.averageWage.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
