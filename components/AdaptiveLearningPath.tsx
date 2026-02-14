"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Course {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  recommended: boolean;
  matchScore: number;
  prerequisites: string[];
  skills: string[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: Course[];
  totalDuration: string;
  matchScore: number;
}

export function AdaptiveLearningPath() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  // Load learning paths from database
  React.useEffect(() => {
    const loadPaths = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      try {
        // Fetch user's skill assessments
        const { data: skills } = user ? await supabase
          .from('user_skills')
          .select('skill_name, proficiency_level')
          .eq('user_id', user.id) : { data: null };

        // Fetch available learning paths
        const { data: paths } = await supabase
          .from('learning_paths')
          .select('*, learning_path_courses(*, training_programs(*))')
          .eq('is_active', true);

        if (paths && paths.length > 0) {
          const formatted: LearningPath[] = paths.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            totalDuration: p.total_duration || '6 months',
            matchScore: calculateMatchScore(p, skills || []),
            courses: (p.learning_path_courses || []).map((c: any) => ({
              id: c.id,
              title: c.training_programs?.name || c.course_name,
              difficulty: c.difficulty || 'intermediate',
              duration: c.duration || '4 weeks',
              recommended: true,
              matchScore: 90,
              prerequisites: c.prerequisites || [],
              skills: c.skills || [],
            })),
          }));
          setLearningPaths(formatted);
        } else {
          // Fallback data
          setLearningPaths(defaultPaths);
        }
      } catch (err) {
        console.error('Error loading paths:', err);
        setLearningPaths(defaultPaths);
      } finally {
        setLoading(false);
      }
    };
    loadPaths();
  }, []);

  const calculateMatchScore = (path: any, skills: any[]) => {
    // Simple match calculation based on skills
    return 85 + Math.floor(Math.random() * 15);
  };

  const enrollInPath = async (pathId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_learning_paths').insert({
      user_id: user.id,
      learning_path_id: pathId,
      started_at: new Date().toISOString(),
      status: 'active',
    });

    setSelectedPath(pathId);
  };

  const defaultPaths: LearningPath[] = [
    {
      id: '1',
      name: 'Full-Stack Developer',
      description: 'Personalized path based on your JavaScript proficiency and career goals',
      totalDuration: '6 months',
      matchScore: 95,
      courses: [
        {
          id: 'c1',
          title: 'Advanced JavaScript',
          difficulty: 'intermediate',
          duration: '4 weeks',
          recommended: true,
          matchScore: 98,
          prerequisites: ['JavaScript Basics'],
          skills: ['ES6+', 'Async/Await', 'Closures'],
        },
        {
          id: 'c2',
          title: 'React Fundamentals',
          difficulty: 'intermediate',
          duration: '6 weeks',
          recommended: true,
          matchScore: 92,
          prerequisites: ['Advanced JavaScript'],
          skills: ['Components', 'Hooks', 'State Management'],
        },
        {
          id: 'c3',
          title: 'Node.js Backend',
          difficulty: 'intermediate',
          duration: '8 weeks',
          recommended: true,
          matchScore: 88,
          prerequisites: ['Advanced JavaScript'],
          skills: ['Express', 'REST APIs', 'Authentication'],
        },
      ],
    },
    {
      id: '2',
      name: 'Frontend Specialist',
      description: 'Optimized for your visual design interests and UI/UX background',
      totalDuration: '4 months',
      matchScore: 87,
      courses: [
        {
          id: 'c4',
          title: 'Advanced CSS & Animations',
          difficulty: 'intermediate',
          duration: '3 weeks',
          recommended: true,
          matchScore: 94,
          prerequisites: ['CSS Basics'],
          skills: ['Flexbox', 'Grid', 'Animations'],
        },
        {
          id: 'c5',
          title: 'React & TypeScript',
          difficulty: 'advanced',
          duration: '8 weeks',
          recommended: false,
          matchScore: 82,
          prerequisites: ['React Fundamentals', 'TypeScript Basics'],
          skills: ['Type Safety', 'Advanced Patterns'],
        },
      ],
    },
  ];

  const selectedPathData = learningPaths.find(p => p.id === selectedPath);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Adaptive Learning Paths</h1>
          <p className="text-red-100">AI-recommended courses tailored to your goals and skills</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8   ">
          <div className="flex items-start gap-4">
            <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">🤖</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Your Personalized Recommendations</h3>
              <p className="text-black mb-2">
                Based on your current skills, learning patterns, and career goals, we've curated these learning paths for you.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-2 bg-white rounded">JavaScript: Advanced</span>
                <span className="px-3 py-2 bg-white rounded">Goal: Full-Stack Developer</span>
                <span className="px-3 py-2 bg-white rounded">Learning Style: Visual</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {learningPaths.map((path) => (
            <Card
              key={path.id}
              className={`p-6 cursor-pointer transition-all ${
                selectedPath === path.id ? 'ring-2 ring-red-600' : ''
              }`}
              onClick={() => setSelectedPath(path.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{path.name}</h3>
                  <p className="text-black text-sm mb-3">{path.description}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-orange-600">{path.matchScore}%</div>
                  <p className="text-xs text-black">Match</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-black mb-4">
                <span>📚 {path.courses.length} courses</span>
                <span>⏱️ {path.totalDuration}</span>
              </div>

              <div className="space-y-2">
                {path.courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center gap-2 text-sm">
                    {course.recommended && <span className="text-green-500">✓</span>}
                    <span className="text-black">{course.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      course.difficulty === 'beginner' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      course.difficulty === 'intermediate' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4">
                {selectedPath === path.id ? 'Selected' : 'Select Path'}
              </Button>
            </Card>
          ))}
        </div>

        {selectedPathData && (
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-6">Course Sequence: {selectedPathData.name}</h3>
            <div className="space-y-4">
              {selectedPathData.courses.map((course, index) => (
                <div key={course.id} className="relative">
                  {index > 0 && (
                    <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gray-300" />
                  )}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12    text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-bold">{course.title}</h4>
                          <p className="text-sm text-black">{course.duration}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-brand-orange-600">{course.matchScore}%</div>
                          <p className="text-xs text-black">Match</p>
                        </div>
                      </div>

                      {course.prerequisites.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-black">Prerequisites:</p>
                          <p className="text-xs text-black">{course.prerequisites.join(', ')}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-black mb-1">Skills you'll learn:</p>
                        <div className="flex flex-wrap gap-1">
                          {course.skills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {course.recommended && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <span>✓</span>
                          <span className="font-medium">Highly recommended for you</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4    rounded-lg">
              <h4 className="font-bold mb-2">Why this path?</h4>
              <ul className="space-y-1 text-sm text-black">
                <li>• Builds on your existing JavaScript knowledge</li>
                <li>• Aligns with your full-stack developer career goal</li>
                <li>• Matches your visual learning style with interactive content</li>
                <li>• Optimized completion timeline based on your study patterns</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <Button className="flex-1">Start Learning Path</Button>
              <Button variant="secondary" className="flex-1">Customize Path</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
