'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, CheckCircle, Clock, Users, Award, Shield, 
  ArrowRight, Phone, Download, FileText, BookOpen,
  GraduationCap, Star, Heart, MessageCircle
} from 'lucide-react';

const MODULES = [
  { num: 1, title: 'Welcome to Elevate', duration: '5 min', icon: <Star className="w-5 h-5" /> },
  { num: 2, title: 'Your Apprenticeship Journey', duration: '10 min', icon: <GraduationCap className="w-5 h-5" /> },
  { num: 3, title: 'How the Program Works', duration: '15 min', icon: <BookOpen className="w-5 h-5" /> },
  { num: 4, title: 'Requirements & Expectations', duration: '10 min', icon: <CheckCircle className="w-5 h-5" /> },
  { num: 5, title: 'Support & Resources', duration: '8 min', icon: <Heart className="w-5 h-5" /> },
];

export default function OrientationVideoPage() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const toggleComplete = (num: number) => {
    if (completed.includes(num)) {
      setCompleted(completed.filter(n => n !== num));
    } else {
      setCompleted([...completed, num]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-black text-gray-900">
              ELEVATE<span className="text-amber-500">.</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                Back to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-4">
            <Play className="w-4 h-4" />
            ORIENTATION VIDEO SERIES
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Welcome to Your <span className="text-amber-500">Apprenticeship Journey</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch these 5 videos to learn everything you need to know about your program, 
            requirements, and how to succeed as an apprentice.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Your Progress</h3>
            <span className="text-amber-600 font-bold">{completed.length}/{MODULES.length} Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completed.length / MODULES.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
              {/* Video Placeholder - Replace with actual video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-amber-400 transition-all">
                    <Play className="w-12 h-12 ml-2" />
                  </div>
                  <p className="text-xl font-bold">{MODULES[currentVideo].title}</p>
                  <p className="text-gray-400">{MODULES[currentVideo].duration}</p>
                </div>
              </div>
              
              {/* Video Controls Placeholder */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <button className="p-2 text-white hover:text-amber-400">
                    <Play className="w-8 h-8" />
                  </button>
                  <div className="flex-1 bg-gray-700 h-2 rounded-full">
                    <div className="bg-amber-500 w-0 h-2 rounded-full" />
                  </div>
                  <span className="text-white text-sm">0:00 / {MODULES[currentVideo].duration}</span>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Module {MODULES[currentVideo].num}: {MODULES[currentVideo].title}
              </h2>
              <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {MODULES[currentVideo].duration}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Required
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                In this orientation module, you'll learn about Elevate's apprenticeship program structure, 
                what to expect during your training, and how to make the most of your experience.
              </p>
              
              {/* Mark Complete */}
              <button
                onClick={() => toggleComplete(MODULES[currentVideo].num)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  completed.includes(MODULES[currentVideo].num)
                    ? 'bg-green-500 text-white'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {completed.includes(MODULES[currentVideo].num) ? (
                  <>✓ Marked as Complete</>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Module List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-900 text-white p-4">
                <h3 className="font-bold">Orientation Modules</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {MODULES.map((mod, idx) => (
                  <button
                    key={mod.num}
                    onClick={() => setCurrentVideo(idx)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-all text-left ${
                      currentVideo === idx ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      completed.includes(mod.num) 
                        ? 'bg-green-500 text-white' 
                        : currentVideo === idx 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {completed.includes(mod.num) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        mod.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        Module {mod.num}: {mod.title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mod.duration}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Handbook Download */}
            <div className="mt-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
              <FileText className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Download Your Handbook</h3>
              <p className="text-sm text-white/80 mb-4">
                Get the complete apprentice handbook with all rules, policies, and resources.
              </p>
              <a 
                href="/api/handbook/download" 
                className="flex items-center justify-center gap-2 bg-white text-amber-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </a>
            </div>

            {/* Need Help */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
              <MessageCircle className="w-8 h-8 text-amber-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Have questions about your orientation? Our team is here to help.
              </p>
              <a href="tel:3173143757" className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800">
                <Phone className="w-5 h-5" />
                Call (317) 314-3757
              </a>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {completed.length === MODULES.length && (
          <div className="mt-12 text-center">
            <div className="bg-green-500 text-white rounded-2xl p-8 max-w-2xl mx-auto">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-white/80 mb-6">You've completed your orientation. You're ready to start your apprenticeship!</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white text-green-600 py-4 px-8 rounded-xl font-bold hover:bg-gray-100">
                Go to Your Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
