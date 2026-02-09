'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, CheckCircle, Clock, Play,
  FileText, Award, AlertCircle, Loader2, Lock,
  ChevronRight, Scissors, TrendingUp, Target
} from 'lucide-react';

interface PracticeTest {
  id: string;
  title: string;
  questions: number;
  duration: string;
  completed: boolean;
  score?: number;
  passingScore: number;
}

interface StudyTopic {
  id: string;
  title: string;
  description: string;
  lessons: number;
  completed: number;
  category: 'theory' | 'practical' | 'sanitation' | 'laws';
}

const PRACTICE_TESTS: PracticeTest[] = [
  { id: '1', title: 'Written Exam Practice 1', questions: 50, duration: '60 min', completed: true, score: 84, passingScore: 75 },
  { id: '2', title: 'Written Exam Practice 2', questions: 50, duration: '60 min', completed: true, score: 88, passingScore: 75 },
  { id: '3', title: 'Written Exam Practice 3', questions: 75, duration: '90 min', completed: false, passingScore: 75 },
  { id: '4', title: 'Full Mock Exam', questions: 100, duration: '120 min', completed: false, passingScore: 75 },
];

const STUDY_TOPICS: StudyTopic[] = [
  { id: '1', title: 'Sanitation & Infection Control', description: 'Sterilization, disinfection, safety protocols', lessons: 12, completed: 12, category: 'sanitation' },
  { id: '2', title: 'Hair Structure & Chemistry', description: 'Hair anatomy, chemical processes', lessons: 8, completed: 6, category: 'theory' },
  { id: '3', title: 'Cutting Techniques', description: 'Clipper cuts, shears, razors', lessons: 15, completed: 10, category: 'practical' },
  { id: '4', title: 'Shaving & Facial Hair', description: 'Straight razor, beard trimming', lessons: 10, completed: 4, category: 'practical' },
  { id: '5', title: 'Indiana State Laws', description: 'Licensing requirements, regulations', lessons: 6, completed: 2, category: 'laws' },
  { id: '6', title: 'Business & Ethics', description: 'Client relations, professional conduct', lessons: 5, completed: 0, category: 'theory' },
];

const CATEGORY_COLORS = {
  theory: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  practical: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  sanitation: { bg: 'bg-green-500/20', text: 'text-green-400' },
  laws: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

export default function StateBoardPrepPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'practice'>('study');
  const [hoursComplete, setHoursComplete] = useState(847);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const totalLessons = STUDY_TOPICS.reduce((sum, t) => sum + t.lessons, 0);
  const completedLessons = STUDY_TOPICS.reduce((sum, t) => sum + t.completed, 0);
  const studyProgress = Math.round((completedLessons / totalLessons) * 100);
  
  const completedTests = PRACTICE_TESTS.filter(t => t.completed).length;
  const avgScore = PRACTICE_TESTS.filter(t => t.completed && t.score)
    .reduce((sum, t, _, arr) => sum + (t.score || 0) / arr.length, 0);

  const isEligible = hoursComplete >= 1500;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-indigo-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/barber/training" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">State Board Prep</h1>
            <p className="text-indigo-200 text-sm">Indiana Barber Exam</p>
          </div>
        </div>

        {/* Eligibility Status */}
        <div className={`rounded-xl p-4 ${isEligible ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
          <div className="flex items-center gap-3">
            {isEligible ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <p className={`font-medium ${isEligible ? 'text-green-300' : 'text-amber-300'}`}>
                {isEligible ? 'Eligible to Take Exam' : 'Not Yet Eligible'}
              </p>
              <p className="text-white/70 text-sm">
                {isEligible 
                  ? 'You have enough hours to schedule your state board exam'
                  : `${1500 - hoursComplete} more hours needed (1,500 required)`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('study')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'study' ? 'bg-indigo-500 text-white' : 'text-slate-400'
            }`}
          >
            Study Materials
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'practice' ? 'bg-indigo-500 text-white' : 'text-slate-400'
            }`}
          >
            Practice Tests
          </button>
        </div>
      </div>

      <main className="px-4 space-y-6">
        {activeTab === 'study' ? (
          <>
            {/* Study Progress */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">Study Progress</span>
                <span className="text-white font-bold">{studyProgress}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${studyProgress}%` }}
                />
              </div>
              <p className="text-slate-500 text-sm mt-2">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>

            {/* Study Topics */}
            <div className="space-y-3">
              {STUDY_TOPICS.map((topic) => {
                const progress = (topic.completed / topic.lessons) * 100;
                const colors = CATEGORY_COLORS[topic.category];
                
                return (
                  <Link
                    key={topic.id}
                    href={`/pwa/barber/training?topic=${topic.id}`}
                    className="block bg-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        {progress === 100 ? (
                          <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                        ) : (
                          <BookOpen className={`w-5 h-5 ${colors.text}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{topic.title}</h3>
                        <p className="text-slate-500 text-sm">{topic.description}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{topic.completed}/{topic.lessons} lessons</span>
                            <span className={colors.text}>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${colors.bg.replace('/20', '')}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Test Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Target className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{completedTests}/{PRACTICE_TESTS.length}</p>
                <p className="text-slate-500 text-sm">Tests Completed</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{avgScore > 0 ? `${Math.round(avgScore)}%` : '--'}</p>
                <p className="text-slate-500 text-sm">Average Score</p>
              </div>
            </div>

            {/* Practice Tests */}
            <div className="space-y-3">
              {PRACTICE_TESTS.map((test) => (
                <div
                  key={test.id}
                  className={`bg-slate-800 rounded-xl p-4 ${!isEligible && !test.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      test.completed 
                        ? test.score && test.score >= test.passingScore 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'
                        : 'bg-slate-700'
                    }`}>
                      {test.completed ? (
                        test.score && test.score >= test.passingScore ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-400" />
                        )
                      ) : !isEligible ? (
                        <Lock className="w-5 h-5 text-slate-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{test.title}</h3>
                      <p className="text-slate-500 text-sm">
                        {test.questions} questions • {test.duration}
                      </p>
                      {test.completed && test.score && (
                        <p className={`text-sm mt-1 ${
                          test.score >= test.passingScore ? 'text-green-400' : 'text-red-400'
                        }`}>
                          Score: {test.score}% {test.score >= test.passingScore ? '(Passed)' : '(Need 75%)'}
                        </p>
                      )}
                    </div>
                    {!test.completed && isEligible && (
                      <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                    )}
                    {test.completed && (
                      <button className="text-indigo-400 text-sm font-medium">
                        Retake
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Exam Info */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
              <h3 className="text-indigo-300 font-medium mb-2">About the Indiana State Board Exam</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• Written exam: 100 questions, 75% to pass</li>
                <li>• Practical exam: Demonstrate cutting, shaving, sanitation</li>
                <li>• Must complete 1,500 hours before scheduling</li>
                <li>• Exam fee: $50 (written) + $75 (practical)</li>
              </ul>
              <a 
                href="https://www.in.gov/pla/professions/barber-board/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-indigo-400 text-sm font-medium"
              >
                Visit Indiana PLA Website →
              </a>
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
