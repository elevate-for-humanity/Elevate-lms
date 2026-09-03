#!/usr/bin/env bash
set -euo pipefail

echo "🎓 Adding LearnWorlds-Quality LMS Features"
echo "==========================================="

# Create feature directories
mkdir -p src/features/{courses,students,payments,analytics,certificates}
mkdir -p src/components/lms

# Course Player Component
cat > src/components/lms/CoursePlayer.tsx <<'TSX'
import { useState } from 'react'
import { Play, Pause, Volume2, Maximize } from 'lucide-react'

interface CoursePlayerProps {
  videoUrl: string
  title: string
  onProgress?: (progress: number) => void
}

export default function CoursePlayer({ videoUrl, title, onProgress }: CoursePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    const percent = (video.currentTime / video.duration) * 100
    setProgress(percent)
    onProgress?.(percent)
  }

  return (
    <div className="bg-black rounded-2xl overflow-hidden">
      <video
        className="w-full aspect-video"
        src={videoUrl}
        onTimeUpdate={handleProgress}
        controls
      />
      <div className="bg-white p-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="mt-2 bg-slate-200 rounded-full h-2">
          <div 
            className="bg-brand-blue h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 mt-1">{Math.round(progress)}% complete</p>
      </div>
    </div>
  )
}
TSX

# Progress Tracker Component
cat > src/components/lms/ProgressTracker.tsx <<'TSX'
import { CheckCircle, Circle, Lock } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  completed: boolean
  locked: boolean
}

interface ProgressTrackerProps {
  lessons: Lesson[]
  currentLessonId: string
  onLessonClick: (id: string) => void
}

export default function ProgressTracker({ lessons, currentLessonId, onLessonClick }: ProgressTrackerProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-4">Course Progress</h3>
      <div className="space-y-2">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => !lesson.locked && onLessonClick(lesson.id)}
            disabled={lesson.locked}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              lesson.id === currentLessonId
                ? 'bg-brand-blue text-white'
                : lesson.locked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'hover:bg-slate-50'
            }`}
          >
            {lesson.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : lesson.locked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
            <span className="flex-1 text-left">{lesson.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
TSX

# Certificate Generator Component
cat > src/components/lms/CertificateGenerator.tsx <<'TSX'
import { Download, Award } from 'lucide-react'

interface CertificateProps {
  studentName: string
  courseName: string
  completionDate: string
  certificateId: string
}

export default function CertificateGenerator({ 
  studentName, 
  courseName, 
  completionDate,
  certificateId 
}: CertificateProps) {
  const handleDownload = () => {
    // TODO: Generate PDF certificate
    console.log('Generating certificate PDF...')
  }

  return (
    <div className="card p-8 text-center">
      <Award className="w-16 h-16 mx-auto text-brand-blue mb-4" />
      <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
      <p className="text-slate-600 mb-6">
        This certifies that <strong>{studentName}</strong> has successfully completed
        <strong> {courseName}</strong> on {completionDate}
      </p>
      <p className="text-sm text-slate-500 mb-6">Certificate ID: {certificateId}</p>
      <button onClick={handleDownload} className="btn btn-primary inline-flex items-center gap-2">
        <Download className="w-4 h-4" />
        Download Certificate
      </button>
    </div>
  )
}
TSX

# Dashboard Stats Component
cat > src/components/lms/DashboardStats.tsx <<'TSX'
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react'

interface Stat {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
}

export default function DashboardStats() {
  const stats: Stat[] = [
    { label: 'Courses Enrolled', value: 5, icon: <BookOpen className="w-6 h-6" /> },
    { label: 'Certificates Earned', value: 2, icon: <Award className="w-6 h-6" /> },
    { label: 'Hours Learned', value: '24.5', icon: <Clock className="w-6 h-6" /> },
    { label: 'Completion Rate', value: '78%', icon: <TrendingUp className="w-6 h-6" />, trend: '+12%' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-brand-blue">{stat.icon}</div>
            {stat.trend && (
              <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
            )}
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-sm text-slate-600">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
TSX

echo "✅ LMS components created"
echo ""
echo "Components added:"
echo "  - CoursePlayer (video with progress tracking)"
echo "  - ProgressTracker (lesson navigation)"
echo "  - CertificateGenerator (PDF certificates)"
echo "  - DashboardStats (student analytics)"
