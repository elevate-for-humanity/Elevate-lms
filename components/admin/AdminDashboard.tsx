"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import {
  Users, GraduationCap, Briefcase, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Clock, MapPin, FileText, Download
} from 'lucide-react';
import ProgramAnalytics from '@/components/reporting/ProgramAnalytics';
import SiteAnalytics from '@/components/reporting/SiteAnalytics';
import FunderAnalytics from '@/components/reporting/FunderAnalytics';

interface DashboardMetrics {
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

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'completion' | 'placement' | 'alert';
  message: string;
  timestamp: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes] = await Promise.all([
        fetch('/api/reporting/overall-metrics'),
        fetch('/api/reporting/recent-activity')
      ]);

      const metricsData = await metricsRes.json();
      const activityData = await activityRes.json();

      setMetrics(metricsData);
      setRecentActivity(activityData);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const exportAllReports = async () => {
    // Trigger download of comprehensive report
    const response = await fetch('/api/reporting/comprehensive-export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-2xl md:text-3xl lg:text-4xl">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System-wide analytics and performance metrics
          </p>
        </div>
        <Button onClick={exportAllReports} size="lg">
          <Download className="mr-2 h-5 w-5" />
          Export All Reports
        </Button>
      </div>

      {/* Key Metrics Overview */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEnrollments.toLocaleString('en-US')}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeStudents.toLocaleString('en-US')} currently active
              </p>
              <div className="mt-2">
                {metrics.activeStudents > 0 && (
                  <div className="flex items-center text-sm text-brand-green-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    Active students enrolled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.completions.toLocaleString('en-US')} total completions
              </p>
              <div className="mt-2">
                {metrics.completionRate >= 70 ? (
                  <div className="flex items-center text-sm text-brand-green-600">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Above target (70%)
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-brand-orange-600">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    Below target (70%)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.placementRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.placedInEmployment.toLocaleString('en-US')} placed in employment
              </p>
              <div className="mt-2">
                {metrics.placementRate >= 60 ? (
                  <div className="flex items-center text-sm text-brand-green-600">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Above target (60%)
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-brand-orange-600">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    Below target (60%)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Wage</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.averageWage.toFixed(2)}/hr</div>
              <p className="text-xs text-muted-foreground">
                ${(metrics.averageWage * 2080).toLocaleString('en-US')}/year
              </p>
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  Median: ${metrics.medianWage.toFixed(2)}/hr
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Retention & Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Retention Rate</span>
                <span className="text-lg font-bold">{metrics.retentionRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dropout Rate</span>
                <span className="text-lg font-bold text-brand-orange-600">{metrics.dropoutRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Completion Time</span>
                <span className="text-lg font-bold">{metrics.averageCompletionTime.toFixed(0)} days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Funding Used</span>
                <span className="text-lg font-bold">${metrics.totalFundingUsed.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost per Completion</span>
                <span className="text-lg font-bold">${metrics.costPerCompletion.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROI Multiple</span>
                <span className="text-lg font-bold">
                  {metrics.costPerCompletion > 0 && metrics.averageWage > 0
                    ? `${((metrics.averageWage * 2080) / metrics.costPerCompletion).toFixed(1)}x`
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Target</span>
                {metrics.completionRate >= 70 ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-orange-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Placement Target</span>
                {metrics.placementRate >= 60 ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-orange-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retention Target</span>
                {metrics.retentionRate >= 75 ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-orange-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest enrollments, completions, and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                  <div className="mt-1">
                    {activity.type === 'enrollment' && <Users className="h-5 w-5 text-brand-blue-600" />}
                    {activity.type === 'completion' && <GraduationCap className="h-5 w-5 text-brand-green-600" />}
                    {activity.type === 'placement' && <Briefcase className="h-5 w-5 text-purple-600" />}
                    {activity.type === 'alert' && <AlertCircle className="h-5 w-5 text-brand-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(activity.timestamp).toLocaleString('en-US')}
                    </p>
                  </div>
                  {activity.priority && (
                    <div>
                      {activity.priority === 'high' && (
                        <span className="text-xs bg-brand-red-100 text-brand-red-800 px-2 py-2 rounded">High</span>
                      )}
                      {activity.priority === 'medium' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-2 rounded">Medium</span>
                      )}
                      {activity.priority === 'low' && (
                        <span className="text-xs bg-brand-green-100 text-brand-green-800 px-2 py-2 rounded">Low</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="funders">Funders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                High-level metrics and performance indicators across all programs, sites, and funding sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p className="mb-4">
                  The overview dashboard provides a comprehensive view of your organization's performance.
                  Use the tabs above to drill down into specific programs, sites, or funding sources.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Quick Actions</h4>
                    <ul className="space-y-2">
                      <li>• View detailed program analytics</li>
                      <li>• Compare site performance</li>
                      <li>• Generate funder reports</li>
                      <li>• Export comprehensive data</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Insights</h4>
                    <ul className="space-y-2">
                      <li>• Track completion and placement rates</li>
                      <li>• Monitor financial efficiency</li>
                      <li>• Identify performance trends</li>
                      <li>• Ensure compliance with funder requirements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <ProgramAnalytics />
        </TabsContent>

        <TabsContent value="sites">
          <SiteAnalytics />
        </TabsContent>

        <TabsContent value="funders">
          <FunderAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
