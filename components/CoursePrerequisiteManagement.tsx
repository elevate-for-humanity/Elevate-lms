"use client";

import React from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Course {
  id: string;
  title: string;
  prerequisites: string[];
  unlocks: string[];
  status: 'locked' | 'available' | 'completed';
}

export function CoursePrerequisiteManagement() {
  const courses: Course[] = [
    {
      id: '1',
      title: 'JavaScript Fundamentals',
      prerequisites: [],
      unlocks: ['2', '3'],
      status: 'completed',
    },
    {
      id: '2',
      title: 'React Basics',
      prerequisites: ['1'],
      unlocks: ['4'],
      status: 'available',
    },
    {
      id: '3',
      title: 'Node.js Backend',
      prerequisites: ['1'],
      unlocks: ['5'],
      status: 'available',
    },
    {
      id: '4',
      title: 'Advanced React',
      prerequisites: ['2'],
      unlocks: ['6'],
      status: 'locked',
    },
    {
      id: '5',
      title: 'Database Design',
      prerequisites: ['3'],
      unlocks: ['6'],
      status: 'locked',
    },
    {
      id: '6',
      title: 'Full-Stack Project',
      prerequisites: ['4', '5'],
      unlocks: [],
      status: 'locked',
    },
  ];

  const getPrerequisiteTitles = (prereqIds: string[]) => {
    return prereqIds.map(id => courses.find(c => c.id === id)?.title || '').filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Course Prerequisites</h1>
          <p className="text-white">Manage learning path dependencies</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8   ">
          <h3 className="text-xl font-bold mb-2">Learning Path Structure</h3>
          <p className="text-black">
            Courses are organized in a logical sequence. Complete prerequisites to unlock advanced courses.
          </p>
        </Card>

        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id} className={`p-6 ${
              course.status === 'locked' ? 'opacity-60' : ''
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{course.course_name}</h3>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${
                      course.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                      course.status === 'available' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      'bg-gray-100 text-black'
                    }`}>
                      {course.status.toUpperCase()}
                    </span>
                  </div>

                  {course.prerequisites.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-black mb-1">Prerequisites:</p>
                      <div className="flex flex-wrap gap-2">
                        {getPrerequisiteTitles(course.prerequisites).map((title) => (
                          <span key={title} className="px-2 py-2 bg-brand-orange-100 text-brand-orange-700 text-xs rounded">
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.unlocks.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-black mb-1">Unlocks:</p>
                      <div className="flex flex-wrap gap-2">
                        {getPrerequisiteTitles(course.unlocks).map((title) => (
                          <span key={title} className="px-2 py-2 bg-purple-100 text-purple-700 text-xs rounded">
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {course.status === 'completed' && (
                    <div className="text-brand-green-600 text-3xl">•</div>
                  )}
                  {course.status === 'available' && (
                    <Button size="sm">Start Course</Button>
                  )}
                  {course.status === 'locked' && (
                    <div className="text-gray-400 text-3xl">🔒</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
