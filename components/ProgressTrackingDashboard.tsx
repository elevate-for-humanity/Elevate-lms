"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActivity: string;
  status: 'on-track' | 'behind' | 'ahead';
  nextMilestone: string;
}

export function ProgressTrackingDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [overallProgress, setOverallProgress] = useState({ completionRate: 0, studyHours: 0, coursesInProgress: 0, coursesCompleted: 0, streak: 0, averageScore: 0 });
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; hours: number; completed: number }[]>([]);
  const [milestones, setMilestones] = useState<{ title: string; completed: boolean; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/learner/progress?range=${timeRange}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setOverallProgress(p => d.data.overallProgress || p);
          setCourses(d.data.courses || []);
          setWeeklyActivity(d.data.weeklyActivity || []);
          setMilestones(d.data.milestones || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [timeRange]);

  const maxHours = weeklyActivity.length ? Math.max(...weeklyActivity.map(d => d.hours)) : 1;

  if (loading) return <div className="py-12 text-center text-slate-500">Loading progress...</div>;
  if (!courses.length) return <div className="py-12 text-center text-slate-500">No progress data yet. Enroll in a course to get started.</div>;

  const milestonesFull = milestones.length ? milestones : [
    { title: 'Complete 10 Lessons', completed: false, date: '' },
    { title: 'First Quiz Passed', completed: false, date: '' },
    { title: 'Mid-Course Project', completed: false, date: '' },
    { title: 'Advanced Module Started', completed: false, date: 'In Progress' },
    { title: 'Final Project', completed: false, date: 'Upcoming' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Progress Dashboard</h1>
          <p className="text-white">Track your learning journey in real-time</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Overview</h2>
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Overall Completion</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{overallProgress.completionRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="   h-2 rounded-full"
                style={{ width: `${overallProgress.completionRate}%` }}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Study Hours</h3>
            <p className="text-3xl font-bold text-brand-orange-500">{overallProgress.studyHours}h</p>
            <p className="text-sm text-brand-green-600 mt-2">↑ 15% from last week</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Current Streak</h3>
            <p className="text-3xl font-bold text-brand-green-600">{overallProgress.streak} days</p>
            <p className="text-sm text-black mt-2">🔥 Keep it going!</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Courses In Progress</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{overallProgress.coursesInProgress}</p>
            <p className="text-sm text-black mt-2">{overallProgress.coursesCompleted} completed</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-purple-600">{overallProgress.averageScore}%</p>
            <p className="text-sm text-brand-green-600 mt-2">Above target</p>
          </Card>

          <Card className="p-6   ">
            <h3 className="text-sm text-black mb-2">Next Goal</h3>
            <p className="text-lg font-bold text-brand-red-700">Complete React Module</p>
            <p className="text-sm text-black mt-2">3 lessons remaining</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Weekly Activity</h3>
            <div className="space-y-3">
              {weeklyActivity.map((day) => (
                <div key={day.day}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{day.day}</span>
                    <span className="text-black">{day.hours}h • {day.completed} lessons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="   h-2 rounded-full"
                      style={{ width: `${(day.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Learning Milestones</h3>
            <div className="space-y-3">
              {milestonesFull.map((milestone, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.completed ? 'bg-brand-green-500 text-white' : 'bg-gray-300 text-black'
                  }`}>
                    {milestone.completed ? '•' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${milestone.completed ? 'text-black' : 'text-black'}`}>
                      {milestone.title}
                    </p>
                    <p className="text-sm text-gray-500">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Course Progress</h3>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1">{course.course_name}</h4>
                    <p className="text-sm text-black">
                      {course.lessonsCompleted} of {course.totalLessons} lessons completed
                    </p>
                    <p className="text-sm text-gray-500">Last activity: {course.lastActivity}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-orange-600">{course.progress}%</div>
                    <span className={`inline-block mt-1 px-2 py-2 rounded text-xs font-medium ${
                      course.status === 'on-track' ? 'bg-brand-green-100 text-brand-green-700' :
                      course.status === 'behind' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-brand-blue-100 text-brand-blue-700'
                    }`}>
                      {course.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="   h-3 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-black">
                    <span className="font-semibold">Next:</span> {course.nextMilestone}
                  </p>
                  <Button size="sm">Continue</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6   ">
            <h3 className="font-bold mb-2">🎯 On Track</h3>
            <p className="text-sm text-black">
              You're making great progress! Keep up the consistent study schedule.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">💡 Tip</h3>
            <p className="text-sm text-black">
              Your best learning time is 9-11 AM. Schedule difficult topics during this window.
            </p>
          </Card>

          <Card className="p-6   ">
            <h3 className="font-bold mb-2">🏆 Achievement</h3>
            <p className="text-sm text-black">
              You've maintained a 7-day streak! Unlock the "Dedicated Learner" badge at 14 days.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
