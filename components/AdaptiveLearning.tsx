"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Brain, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface LearningPath {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  topics: string[];
  recommended: boolean;
}

interface AdaptiveLearningProps {
  userId: string;
  currentSkillLevel: number;
  completedTopics: string[];
}

export function AdaptiveLearning({
  userId,
  currentSkillLevel,
  completedTopics,
}: AdaptiveLearningProps) {
  const [recommendations, setRecommendations] = useState<LearningPath[]>([]);
  const [learningStyle, setLearningStyle] = useState<'visual' | 'auditory' | 'kinesthetic'>('visual');

  useEffect(() => {
    // AI-powered recommendations based on user performance
    const generateRecommendations = () => {
      const paths: LearningPath[] = [
        {
          id: '1',
          title: 'Advanced Patient Care Techniques',
          difficulty: 'advanced',
          estimatedTime: '2 hours',
          topics: ['Critical Care', 'Emergency Response', 'Advanced Monitoring'],
          recommended: currentSkillLevel >= 70,
        },
        {
          id: '2',
          title: 'Communication Skills Mastery',
          difficulty: 'intermediate',
          estimatedTime: '1.5 hours',
          topics: ['Patient Communication', 'Family Interaction', 'Documentation'],
          recommended: currentSkillLevel >= 50,
        },
        {
          id: '3',
          title: 'Fundamentals Review',
          difficulty: 'beginner',
          estimatedTime: '1 hour',
          topics: ['Basic Care', 'Safety Protocols', 'Hygiene'],
          recommended: currentSkillLevel < 50,
        },
      ];

      setRecommendations(paths.filter(p => p.recommended));
    };

    generateRecommendations();
  }, [currentSkillLevel, completedTopics]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-brand-green-100 text-brand-green-800';
      case 'intermediate':
        return 'bg-brand-orange-100 text-brand-orange-800';
      case 'advanced':
        return 'bg-brand-red-100 text-brand-red-800';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Insights */}
      <Card className="  ">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange-600 rounded-lg">
              <Brain className="text-white" size={24} />
            </div>
            <CardTitle>Your Learning Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-orange-600">{currentSkillLevel}%</div>
              <div className="text-sm text-black">Skill Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-orange-600">{completedTopics.length}</div>
              <div className="text-sm text-black">Topics Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-green-600">
                {learningStyle === 'visual' ? '👁️' : learningStyle === 'auditory' ? '👂' : '✋'}
              </div>
              <div className="text-sm text-black">Learning Style</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Learning Paths */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lightbulb className="text-brand-orange-600" size={24} />
            <CardTitle>Recommended for You</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((path) => (
              <div
                key={path.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-brand-red-600 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{path.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-2 rounded text-xs font-semibold ${getDifficultyColor(path.difficulty)}`}>
                        {path.difficulty}
                      </span>
                      <span className="text-sm text-black">{path.estimatedTime}</span>
                    </div>
                  </div>
                  <Target className="text-brand-orange-600" size={20} />
                </div>

                <div className="mb-4">
                  <div className="text-sm text-black mb-2">Topics covered:</div>
                  <div className="flex flex-wrap gap-2">
                    {path.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-2 bg-gray-100 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-brand-orange-600 hover:bg-brand-orange-700">
                  Start Learning Path
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-green-600" size={24} />
            <CardTitle>Your Progress Trends</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Quiz Performance</span>
                <span className="text-sm text-brand-green-600">↑ 15%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green-600" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Assignment Completion</span>
                <span className="text-sm text-brand-green-600">↑ 8%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange-600" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Study Consistency</span>
                <span className="text-sm text-brand-orange-600">↓ 3%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange-600" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
