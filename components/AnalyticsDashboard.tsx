'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Clock,
  Target,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageScore: number;
  totalRevenue: number;
  coursesCompleted: number;
  studyHours: number;
  certificatesIssued: number;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeframe?: 'week' | 'month' | 'year';
}

export function AnalyticsDashboard({ data, timeframe = 'month' }: AnalyticsDashboardProps) {
  const stats = [
    {
      title: 'Total Students',
      value: data.totalStudents.toLocaleString('en-US'),
      change: '+12%',
      icon: Users,
      color: 'text-brand-orange-600',
      bgColor: 'bg-brand-red-100',
    },
    {
      title: 'Active Students',
      value: data.activeStudents.toLocaleString('en-US'),
      change: '+8%',
      icon: TrendingUp,
      color: 'text-brand-green-600',
      bgColor: 'bg-brand-green-100',
    },
    {
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      change: '+5%',
      icon: CheckCircle,
      color: 'text-brand-orange-600',
      bgColor: 'bg-brand-orange-100',
    },
    {
      title: 'Average Score',
      value: `${data.averageScore}%`,
      change: '+3%',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Study Hours',
      value: data.studyHours.toLocaleString('en-US'),
      change: '+15%',
      icon: Clock,
      color: 'text-brand-blue-600',
      bgColor: 'bg-brand-blue-100',
    },
    {
      title: 'Courses Completed',
      value: data.coursesCompleted.toLocaleString('en-US'),
      change: '+10%',
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Certificates Issued',
      value: data.certificatesIssued.toLocaleString('en-US'),
      change: '+7%',
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Revenue',
      value: `$${data.totalRevenue.toLocaleString('en-US')}`,
      change: '+18%',
      icon: DollarSign,
      color: 'text-brand-orange-600',
      bgColor: 'bg-brand-red-100',
    },
  ];

  // topCourses and recentActivity must be passed as props or fetched by the parent.
  // Static fallback data has been removed — render empty state when not provided.
  const topCourses: { name: string; students: number; completion: number }[] = [];
  const recentActivity: { user: string; action: string; time: string }[] = [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={stat.color} size={24} />
                  </div>
                  <span className="text-sm font-semibold text-brand-green-600">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-black">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{course.name}</div>
                      <div className="text-sm text-black">{course.students} students</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand-green-600">{course.completion}%</div>
                      <div className="text-xs text-slate-700">completion</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full   " style={{ width: `${course.completion}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{activity.user}</div>
                    <div className="text-sm text-black">{activity.action}</div>
                    <div className="text-xs text-slate-700">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 72, 68, 85, 92, 88, 95, 90, 98, 102, 108, 115].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full    rounded-t"
                  style={{ height: `${(value / 115) * 100}%` }}
                />
                <div className="text-xs text-black mt-2">
                  {
                    [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ][index]
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
