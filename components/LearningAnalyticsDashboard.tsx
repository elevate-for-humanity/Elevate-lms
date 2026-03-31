"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PredictiveInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  action?: string;
}

export default function LearningAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [learningMetrics, setLearningMetrics] = useState({
    studyTime: 0,
    completionRate: 0,
    averageScore: 0,
    engagementScore: 0,
    predictedGrade: 'N/A',
    onTrackPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load analytics from database
  React.useEffect(() => {
    const loadAnalytics = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch learning activity
        const daysAgo = parseInt(timeRange);
        const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

        const { data: activity } = await supabase
          .from('learning_activity')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate);

        // Fetch grades
        const { data: grades } = await supabase
          .from('grades')
          .select('points, max_points')
          .eq('student_id', user.id);

        // Fetch enrollments
        const { data: enrollments } = await supabase
          .from('program_enrollments')
          .select('status, progress_percent')
          .eq('user_id', user.id);

        // Calculate metrics
        const totalStudyMinutes = activity?.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) || 0;
        const avgScore = grades?.length 
          ? grades.reduce((sum, g) => sum + (g.points / g.max_points) * 100, 0) / grades.length 
          : 0;
        const completionRate = enrollments?.length
          ? enrollments.filter(e => e.status === 'completed').length / enrollments.length * 100
          : 0;

        setLearningMetrics({
          studyTime: Math.round(totalStudyMinutes / 60),
          completionRate: Math.round(completionRate),
          averageScore: Math.round(avgScore),
          engagementScore: Math.min(100, Math.round((activity?.length || 0) / daysAgo * 10)),
          predictedGrade: avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : 'D',
          onTrackPercentage: Math.round(enrollments?.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / (enrollments?.length || 1)),
        });

        // Generate insights based on data
        const generatedInsights: PredictiveInsight[] = [];
        if (avgScore < 70) {
          generatedInsights.push({
            id: '1',
            type: 'risk',
            title: 'At-Risk of Course Failure',
            description: 'Based on current scores, consider additional study time',
            confidence: 78,
            action: 'Schedule tutoring session',
          });
        }
        if (avgScore >= 85) {
          generatedInsights.push({
            id: '2',
            type: 'opportunity',
            title: 'Ready for Advanced Topics',
            description: 'Your performance indicates readiness for advanced courses',
            confidence: 92,
            action: 'Enroll in advanced course',
          });
        }
        setInsights(generatedInsights.length > 0 ? generatedInsights : [
          { id: '1', type: 'recommendation', title: 'Keep Up the Good Work', description: 'You are on track with your learning goals', confidence: 85 },
        ]);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [timeRange]);

  const weeklyActivity = [
    { day: 'Mon', hours: 6, score: 85 },
    { day: 'Tue', hours: 4, score: 78 },
    { day: 'Wed', hours: 8, score: 92 },
    { day: 'Thu', hours: 5, score: 88 },
    { day: 'Fri', hours: 7, score: 90 },
    { day: 'Sat', hours: 3, score: 75 },
    { day: 'Sun', hours: 9, score: 95 },
  ];

  const maxHours = Math.max(...weeklyActivity.map(d => d.hours));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Learning Analytics</h1>
          <p className="text-brand-red-100">Automated insights into your learning journey</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Study Time (hours)</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{learningMetrics.studyTime}</p>
            <p className="text-sm text-brand-green-600">↑ 12% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold text-brand-orange-500">{learningMetrics.completionRate}%</p>
            <p className="text-sm text-brand-green-600">↑ 5% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-brand-green-600">{learningMetrics.averageScore}%</p>
            <p className="text-sm text-brand-green-600">↑ 3% from last period</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Engagement Score</h3>
            <p className="text-3xl font-bold text-brand-blue-600">{learningMetrics.engagementScore}%</p>
            <p className="text-sm text-yellow-600">→ Stable</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Predicted Final Grade</h3>
            <p className="text-3xl font-bold text-purple-600">{learningMetrics.predictedGrade}</p>
            <p className="text-sm text-black">Based on current trajectory</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">On Track</h3>
            <p className="text-3xl font-bold text-brand-green-600">{learningMetrics.onTrackPercentage}%</p>
            <p className="text-sm text-black">Meeting milestones</p>
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
                    <span className="text-black">{day.hours}h • {day.score}%</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="   h-2 rounded-full"
                        style={{ width: `${(day.hours / maxHours) * 100}%` }}
                      />
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full"
                        style={{ width: `${day.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Learning Patterns</h3>
            <div className="space-y-4">
              <div className="p-4 bg-brand-blue-50 rounded">
                <h4 className="font-semibold text-brand-blue-900 mb-1">Peak Performance Time</h4>
                <p className="text-sm text-brand-blue-700">9:00 AM - 11:00 AM</p>
                <p className="text-xs text-brand-blue-600 mt-1">Highest scores achieved during this window</p>
              </div>

              <div className="p-4 bg-purple-50 rounded">
                <h4 className="font-semibold text-purple-900 mb-1">Preferred Learning Style</h4>
                <p className="text-sm text-purple-700">Visual & Interactive</p>
                <p className="text-xs text-purple-600 mt-1">Video content and hands-on exercises work best</p>
              </div>

              <div className="p-4 bg-brand-orange-50 rounded">
                <h4 className="font-semibold text-brand-orange-900 mb-1">Optimal Session Length</h4>
                <p className="text-sm text-brand-orange-700">45-60 minutes</p>
                <p className="text-xs text-brand-orange-600 mt-1">Performance drops after 60 minutes</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">AI-Powered Insights</h3>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'risk' ? 'bg-brand-red-50 border-brand-red-500' :
                  insight.type === 'opportunity' ? 'bg-brand-green-50 border-brand-green-500' :
                  'bg-brand-blue-50 border-brand-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg ${
                        insight.type === 'risk' ? '⚠️' :
                        insight.type === 'opportunity' ? '🎯' : '💡'
                      }`}>
                        {insight.type === 'risk' ? '⚠️' :
                         insight.type === 'opportunity' ? '🎯' : '💡'}
                      </span>
                      <h4 className="font-bold">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-black mb-2">{insight.description}</p>
                    <p className="text-xs text-black">Confidence: {insight.confidence}%</p>
                  </div>
                  {insight.action && (
                    <Button size="sm" variant="secondary">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6   ">
          <h3 className="text-xl font-bold mb-4">Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded">
              <h4 className="font-semibold mb-2">📚 Study Strategy</h4>
              <p className="text-sm text-black">
                Focus on JavaScript fundamentals before moving to frameworks. Your assessment scores suggest gaps in core concepts.
              </p>
            </div>
            <div className="p-4 bg-white rounded">
              <h4 className="font-semibold mb-2">⏰ Time Management</h4>
              <p className="text-sm text-black">
                Increase study time by 5 hours/week to stay on track for certification deadline.
              </p>
            </div>
            <div className="p-4 bg-white rounded">
              <h4 className="font-semibold mb-2">🤝 Peer Learning</h4>
              <p className="text-sm text-black">
                Join study groups for React topics. Collaborative learning improves retention by 40%.
              </p>
            </div>
            <div className="p-4 bg-white rounded">
              <h4 className="font-semibold mb-2">🎯 Next Milestone</h4>
              <p className="text-sm text-black">
                Complete Module 5 by Friday to maintain your current pace and predicted grade.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
