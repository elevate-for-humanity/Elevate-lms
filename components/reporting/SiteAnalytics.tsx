"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, MapPin, Users, GraduationCap, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

interface SiteMetrics {
  siteId: string;
  siteName: string;
  location: string;
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

export default function SiteAnalytics() {
  const [metrics, setMetrics] = useState<SiteMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof SiteMetrics>('totalEnrollments');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/reporting/site-metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Site Name',
      'Location',
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
      m.siteName,
      m.location,
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
    a.download = `site-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (column: keyof SiteMetrics) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate aggregate metrics
  const totalEnrollments = metrics.reduce((sum, m) => sum + m.totalEnrollments, 0);
  const totalCompletions = metrics.reduce((sum, m) => sum + m.completions, 0);
  const totalPlaced = metrics.reduce((sum, m) => sum + m.placedInEmployment, 0);
  const avgCompletionRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
    : 0;
  const avgPlacementRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.placementRate, 0) / metrics.length
    : 0;

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
          <h2 className="text-3xl font-bold tracking-tight">Site Analytics</h2>
          <p className="text-muted-foreground">
            Multi-location performance tracking and comparison
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Across all sites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{totalCompletions} completions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Placement Rate</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPlacementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{totalPlaced} placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {metrics.length > 0
                ? [...metrics].sort((a, b) => b.completionRate - a.completionRate)[0]?.siteName
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">By completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Site Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedMetrics.map(site => (
          <Card key={site.siteId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{site.siteName}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {site.location}
                  </CardDescription>
                </div>
                {site.completionRate >= 70 && site.placementRate >= 60 && (
                  <Badge variant="default">Top Performer</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Enrollments</p>
                  <p className="text-xl font-bold">{site.totalEnrollments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{site.activeStudents}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{site.completionRate.toFixed(1)}%</span>
                    {site.completionRate >= 70 ? (
                      <TrendingUp className="h-4 w-4 text-brand-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-brand-orange-600" />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Placement Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{site.placementRate.toFixed(1)}%</span>
                    {site.placementRate >= 60 ? (
                      <TrendingUp className="h-4 w-4 text-brand-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-brand-orange-600" />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Wage</span>
                  <span className="font-bold">${site.averageWage.toFixed(2)}/hr</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Retention</span>
                  <span className="font-bold">{site.retentionRate.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cost/Completion</span>
                  <span className="font-bold">${site.costPerCompletion.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Site Comparison Table</CardTitle>
          <CardDescription>Click column headers to sort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 cursor-pointer" onClick={() => handleSort('siteName')}>
                    Site {sortBy === 'siteName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-2 cursor-pointer" onClick={() => handleSort('location')}>
                    Location {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-2 cursor-pointer" onClick={() => handleSort('totalEnrollments')}>
                    Enrollments {sortBy === 'totalEnrollments' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-2 cursor-pointer" onClick={() => handleSort('completionRate')}>
                    Completion {sortBy === 'completionRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-2 cursor-pointer" onClick={() => handleSort('placementRate')}>
                    Placement {sortBy === 'placementRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-2 cursor-pointer" onClick={() => handleSort('averageWage')}>
                    Avg Wage {sortBy === 'averageWage' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-2 cursor-pointer" onClick={() => handleSort('retentionRate')}>
                    Retention {sortBy === 'retentionRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map(site => (
                  <tr key={site.siteId} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{site.siteName}</td>
                    <td className="py-2 text-muted-foreground">{site.location}</td>
                    <td className="text-right py-2">{site.totalEnrollments}</td>
                    <td className="text-right py-2">{site.completionRate.toFixed(1)}%</td>
                    <td className="text-right py-2">{site.placementRate.toFixed(1)}%</td>
                    <td className="text-right py-2">${site.averageWage.toFixed(2)}</td>
                    <td className="text-right py-2">{site.retentionRate.toFixed(1)}%</td>
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
