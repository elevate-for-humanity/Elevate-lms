"use client";

import React from 'react';

import { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: 'Introduction to Barbering',
    duration: '12:30',
    completed: true,
    locked: false,
  },
  {
    id: 2,
    title: 'Tools and Equipment',
    duration: '18:45',
    completed: true,
    locked: false,
  },
  {
    id: 3,
    title: 'Basic Cutting Techniques',
    duration: '25:15',
    completed: false,
    locked: false,
  },
  {
    id: 4,
    title: 'Advanced Styling',
    duration: '22:00',
    completed: false,
    locked: true,
  },
  {
    id: 5,
    title: 'Client Consultation',
    duration: '15:30',
    completed: false,
    locked: true,
  },
];

export function CoursePlayer() {
  const [currentLesson, setCurrentLesson] = useState(lessons[2]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="grid lg:grid-cols-[1fr,380px] gap-6">
      {/* Video Player */}
      <div className="space-y-4">
        {/* Video Container */}
        <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-20 h-20 rounded-full bg-brand-orange-600 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-brand-orange-700 transition-colors">
                {isPlaying ? (
                  <Pause
                    className="h-10 w-10"
                    onClick={() => setIsPlaying(false)}
                  />
                ) : (
                  <Play
                    className="h-10 w-10 ml-1"
                    onClick={() => setIsPlaying(true)}
                  />
                )}
              </div>
              <p className="text-lg font-semibold">{currentLesson.title}</p>
              <p className="text-sm text-gray-400 mt-1">
                {currentLesson.duration}
              </p>
            </div>
          </div>
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0    p-4">
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-red-500 transition-colors">
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              <div className="flex-1 h-1 bg-gray-600 rounded-full">
                <div className="h-full w-1/3 bg-brand-orange-600 rounded-full" />
              </div>
              <span className="text-white text-sm">
                8:30 / {currentLesson.duration}
              </span>
              <button className="text-white hover:text-red-500 transition-colors">
                <Volume2 className="h-5 w-5" />
              </button>
              <button className="text-white hover:text-red-500 transition-colors">
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Lesson Info */}
        <div className="elevate-card">
          <h2 className="text-2xl font-bold text-black mb-2">
            {currentLesson.title}
          </h2>
          <p className="text-black mb-4">
            Learn the fundamental techniques of basic cutting in this
            comprehensive lesson. You'll master the essential skills needed to
            perform professional haircuts.
          </p>
          <div className="flex items-center gap-4 mb-6">
            <div className="elevate-pill elevate-pill--blue">
              Lesson {currentLesson.id} of {lessons.length}
            </div>
            <div className="text-sm text-black">
              Duration: {currentLesson.duration}
            </div>
          </div>
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              className="elevate-btn-secondary flex items-center gap-2"
              disabled={currentLesson.id === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Lesson
            </button>
            <button className="elevate-btn-primary flex items-center gap-2 flex-1">
              Mark Complete & Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Resources & Notes */}
        <div className="elevate-card">
          <h3 className="font-bold text-black mb-4">Lesson Resources</h3>
          <div className="space-y-2">
            <button
              onClick={() => alert('Resource download Available Now!')}
              className="flex items-center gap-2 text-brand-orange-600 hover:text-brand-blue-700 text-sm w-full text-left"
            >
              📄 Cutting Techniques Guide.pdf
            </button>
            <button
              onClick={() => alert('Resource download Available Now!')}
              className="flex items-center gap-2 text-brand-orange-600 hover:text-brand-blue-700 text-sm w-full text-left"
            >
              📊 Practice Worksheet.pdf
            </button>
            <button
              onClick={() => alert('Resource download Available Now!')}
              className="flex items-center gap-2 text-brand-orange-600 hover:text-brand-blue-700 text-sm w-full text-left"
            >
              🎥 Bonus: Advanced Tips Video
            </button>
          </div>
        </div>
      </div>
      {/* Lesson Sidebar */}
      <div className="elevate-card h-fit sticky top-4">
        <h3 className="font-bold text-black mb-4">Course Content</h3>
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => !lesson.locked && setCurrentLesson(lesson)}
              disabled={lesson.locked}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                currentLesson.id === lesson.id
                  ? 'border-red-500 bg-red-50'
                  : lesson.locked
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {lesson.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : lesson.locked ? (
                    <Lock className="h-5 w-5 text-gray-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-black">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lesson.duration}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {/* Progress */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black">Course Progress</span>
            <span className="font-bold text-black">40%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-orange-600 h-2 rounded-full"
              style={{ width: '40%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">2 of 5 lessons completed</p>
        </div>
      </div>
    </div>
  );
}
