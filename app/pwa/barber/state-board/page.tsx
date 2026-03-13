'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, BookOpen, Clock, Play,
  FileText, Award, AlertCircle, Loader2, Lock,
  ChevronRight, TrendingUp, Target
} from 'lucide-react';

interface PracticeTest {
  id: string;
  title: string;
  question_count: number;
  time_limit_minutes: number | null;
  passing_score: number;
  category: string;
}

interface TestAttempt {
  test_id: string;
  score: number;
  passed: boolean;
  completed_at: string | null;
}

interface StudyTopic {
  id: string;
  title: string;
  content: string | null;
  category: string;
  resources: any[];
  sort_order: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  theory: { bg: 'bg-brand-blue-500/20', text: 'text-brand-blue-400' },
  practical: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  sanitation: { bg: 'bg-brand-green-500/20', text: 'text-brand-green-400' },
  laws: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

export default function StateBoardPrepPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'practice'>('study');
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const [testsRes, attemptsRes, topicsRes, hoursRes] = await Promise.all([
          supabase.from('practice_tests').select('*').eq('is_active', true).order('created_at'),
          supabase.from('practice_test_attempts').select('test_id, score, passed, completed_at').eq('user_id', user.id),
          supabase.from('study_topics').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('hour_entries').select('hours_claimed, accepted_hours').eq('user_id', user.id).eq('status', 'approved'),
        ]);

        setTests(testsRes.data || []);
        setAttempts(attemptsRes.data || []);
        setTopics(topicsRes.data || []);
        setTotalHours((hoursRes.data || []).reduce((sum, h) => sum + (Number(h.accepted_hours) || Number(h.hours_claimed) || 0), 0));
      } catch {
        // Fail gracefully — show empty state
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  // Best attempt per test
  const bestAttempts = new Map<string, TestAttempt>();
  attempts.forEach(a => {
    const existing = bestAttempts.get(a.test_id);
    if (!existing || a.score > existing.score) bestAttempts.set(a.test_id, a);
  });

  const completedTests = tests.filter(t => bestAttempts.get(t.id)?.passed).length;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;
  const isEligible = totalHours >= 2000;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-brand-blue-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">State Board Prep</h1>
            <p className="text-brand-blue-200 text-sm">Indiana Barber License Exam</p>
          </div>
        </div>

        {/* Eligibility banner */}
        <div className={`rounded-xl p-3 ${isEligible ? 'bg-brand-green-500/20' : 'bg-amber-500/20'}`}>
          <div className="flex items-center gap-3">
            {isEligible ? (
              <Award className="w-6 h-6 text-brand-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <p className={`font-medium ${isEligible ? 'text-brand-green-300' : 'text-amber-300'}`}>
                {isEligible ? 'Eligible for State Board Exam' : `${Math.round(totalHours).toLocaleString()} / 2,000 hours`}
              </p>
              <p className="text-xs text-white/60">
                {isEligible ? 'You meet the hour requirement' : `${(2000 - totalHours).toLocaleString()} hours remaining`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{topics.length}</p>
            <p className="text-brand-blue-200 text-xs">Topics</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{completedTests}/{tests.length}</p>
            <p className="text-brand-blue-200 text-xs">Tests Passed</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{avgScore}%</p>
            <p className="text-brand-blue-200 text-xs">Avg Score</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('study')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'study' ? 'bg-brand-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" />
            Study Topics
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'practice' ? 'bg-brand-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Practice Tests
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {activeTab === 'study' ? (
          topics.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No study topics available yet.</p>
            </div>
          ) : (
            topics.map(topic => {
              const colors = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.theory;
              return (
                <div key={topic.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {topic.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-white">{topic.title}</h3>
                      {topic.content && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{topic.content}</p>
                      )}
                      {topic.resources && topic.resources.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2">{topic.resources.length} resources</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 mt-1" />
                  </div>
                </div>
              );
            })
          )
        ) : (
          tests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No practice tests available yet.</p>
            </div>
          ) : (
            tests.map(test => {
              const best = bestAttempts.get(test.id);
              const passed = best?.passed;
              return (
                <div key={test.id} className={`bg-slate-800 rounded-xl p-4 border ${
                  passed ? 'border-brand-green-500/30' : 'border-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{test.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {test.question_count} questions
                        </span>
                        {test.time_limit_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {test.time_limit_minutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {test.passing_score}% to pass
                        </span>
                      </div>
                      {best && (
                        <div className="mt-2">
                          <span className={`text-sm font-medium ${passed ? 'text-brand-green-400' : 'text-amber-400'}`}>
                            Best: {best.score}% {passed ? '✓ Passed' : '— Not passed'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      passed ? 'bg-brand-green-500/20' : 'bg-brand-blue-600'
                    }`}>
                      {passed ? (
                        <TrendingUp className="w-5 h-5 text-brand-green-400" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
