"use client";

import { Award, BookOpen, TrendingUp, CheckCircle, } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'completion',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Completed Module 2',
    course: 'CNA Certification Prep',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'achievement',
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    title: 'Earned Certificate',
    course: 'Barber Apprenticeship',
    time: '1 day ago',
  },
  {
    id: 3,
    type: 'enrollment',
    icon: BookOpen,
    color: 'text-brand-orange-600',
    bgColor: 'bg-brand-blue-100',
    title: 'Enrolled in Course',
    course: 'HVAC Technician Training',
    time: '3 days ago',
  },
  {
    id: 4,
    type: 'progress',
    icon: TrendingUp,
    color: 'text-brand-orange-600',
    bgColor: 'bg-red-100',
    title: 'Progress Milestone',
    course: 'Reached 50% completion',
    time: '5 days ago',
  },
];

export function ActivityFeed() {
  return (
    <div className="elevate-card">
      <div className="elevate-card-header">
        <h3 className="elevate-card-title">Recent Activity</h3>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`h-5 w-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black text-sm">
                  {activity.title}
                </p>
                <p className="text-sm text-black">{activity.course}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
