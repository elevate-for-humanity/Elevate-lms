'use client';

import { useEffect, useState } from 'react';

interface EngagementData {
  day: string;
  views: number;
  completions: number;
}

interface CourseData {
  name: string;
  students: number;
  completion: number;
}

export function StudentEngagementChart() {
  const [data, setData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/instructor/engagement-stats');
        const json = await res.json();
        setData(json.engagement || []);
      } catch (err) {
        console.error('Failed to fetch engagement stats:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  const maxViews = Math.max(...data.map(d => d.views), 100);

  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-brand-blue-500 rounded"></div>
          <span>Views</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-brand-green-500 rounded"></div>
          <span>Completions</span>
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="w-full flex gap-1 items-end" style={{ height: 100 }}>
              <div
                className="flex-1 bg-brand-blue-500 rounded-t"
                style={{ height: `${(item.views / maxViews) * 100}%` }}
                title={`${item.views} views`}
              ></div>
              <div
                className="flex-1 bg-brand-green-500 rounded-t"
                style={{ height: `${(item.completions / maxViews) * 100}%` }}
                title={`${item.completions} completions`}
              ></div>
            </div>
            <span className="text-xs text-gray-500 mt-1">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoursePerformanceChart() {
  const [data, setData] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/instructor/course-performance');
        const json = await res.json();
        setData(json.courses || []);
      } catch (err) {
        console.error('Failed to fetch course performance:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((course, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate" title={course.name}>{course.name}</span>
            <span className="text-gray-500">{course.students} students</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-brand-blue-500 to-brand-green-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${course.completion}%` }}
            >
              <span className="text-xs text-white font-medium">{course.completion}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


