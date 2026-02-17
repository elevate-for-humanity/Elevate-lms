"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ARModule {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completionRate: number;
  thumbnail: string;
  features: string[];
}

export function ARTrainingModules() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const modules: ARModule[] = [
    {
      id: '1',
      title: 'HVAC System Assembly',
      category: 'Technical Training',
      description: 'Learn to assemble and troubleshoot HVAC systems using interactive 3D models',
      duration: '45 minutes',
      difficulty: 'intermediate',
      completionRate: 0,
      thumbnail: '🔧',
      features: [
        '3D component visualization',
        'Step-by-step assembly guide',
        'Virtual troubleshooting scenarios',
        'Safety protocol training',
      ],
    },
    {
      id: '2',
      title: 'Medical Equipment Operation',
      category: 'Healthcare',
      description: 'Practice operating medical equipment in a safe, virtual environment',
      duration: '30 minutes',
      difficulty: 'beginner',
      completionRate: 0,
      thumbnail: '🏥',
      features: [
        'Interactive equipment models',
        'Patient care simulations',
        'Emergency response training',
        'Hygiene protocol practice',
      ],
    },
    {
      id: '3',
      title: 'Automotive Engine Repair',
      category: 'Automotive',
      description: 'Explore engine components and learn repair procedures through AR',
      duration: '60 minutes',
      difficulty: 'advanced',
      completionRate: 0,
      thumbnail: '🚗',
      features: [
        'Exploded view diagrams',
        'Component identification',
        'Diagnostic procedures',
        'Repair technique demonstrations',
      ],
    },
    {
      id: '4',
      title: 'Electrical Wiring Basics',
      category: 'Electrical',
      description: 'Master electrical wiring techniques with interactive AR guidance',
      duration: '40 minutes',
      difficulty: 'beginner',
      completionRate: 0,
      thumbnail: '⚡',
      features: [
        'Circuit visualization',
        'Wire color coding',
        'Safety procedures',
        'Code compliance training',
      ],
    },
    {
      id: '5',
      title: 'Welding Techniques',
      category: 'Manufacturing',
      description: 'Practice welding techniques in a virtual environment before hands-on work',
      duration: '50 minutes',
      difficulty: 'intermediate',
      completionRate: 0,
      thumbnail: '🔥',
      features: [
        'Angle and distance guidance',
        'Bead pattern practice',
        'Material preparation',
        'Safety equipment training',
      ],
    },
    {
      id: '6',
      title: 'Culinary Knife Skills',
      category: 'Culinary Arts',
      description: 'Learn proper knife techniques and food preparation through AR',
      duration: '35 minutes',
      difficulty: 'beginner',
      completionRate: 0,
      thumbnail: '🔪',
      features: [
        'Cutting technique demonstrations',
        'Hand positioning guidance',
        'Speed and precision training',
        'Safety practices',
      ],
    },
  ];

  const selectedModuleData = modules.find(m => m.id === selectedModule);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">AR Training Modules</h1>
          <p className="text-brand-red-100">Immersive hands-on learning with augmented reality</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8   ">
          <div className="flex items-start gap-4">
            <div className="text-5xl text-3xl md:text-4xl lg:text-5xl">🥽</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Experience Learning in 3D</h3>
              <p className="text-black mb-3">
                Our AR training modules use your device's camera to overlay interactive 3D models in your real environment.
                Practice skills safely before working with actual equipment.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>Works on mobile & tablet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>No special equipment needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>Track your progress</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {!selectedModule ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3 text-4xl md:text-5xl lg:text-6xl">{module.thumbnail}</div>
                    <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                    <span className="px-3 py-2 bg-brand-orange-100 text-brand-orange-700 text-xs rounded">
                      {module.category}
                    </span>
                  </div>

                  <p className="text-black text-sm mb-4">{module.description}</p>

                  <div className="flex justify-between text-sm text-black mb-4">
                    <span>⏱️ {module.duration}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      module.difficulty === 'beginner' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      module.difficulty === 'intermediate' ? 'bg-purple-100 text-purple-700' :
                      'bg-brand-red-100 text-brand-red-700'
                    }`}>
                      {module.difficulty}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-black mb-2">Features:</p>
                    <ul className="space-y-1">
                      {module.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-black flex items-start">
                          <span className="text-brand-green-500 mr-1">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setSelectedModule(module.id)}
                  >
                    Start Module
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="secondary"
              onClick={() => setSelectedModule(null)}
              className="mb-6"
            >
              ← Back to Modules
            </Button>

            {selectedModuleData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="p-6 mb-6">
                    <div className="aspect-video    rounded-lg flex items-center justify-center text-white mb-4">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🥽</div>
                        <p className="text-2xl font-bold mb-2">AR Experience Active</p>
                        <p className="text-purple-200">Point your camera at a flat surface to begin</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1">📷 Launch AR</Button>
                      <Button variant="secondary">⏸️ Pause</Button>
                      <Button variant="secondary">🔄 Reset</Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Module Steps</h3>
                    <div className="space-y-3">
                      {[
                        'Introduction and safety overview',
                        'Component identification',
                        'Assembly procedure',
                        'Quality check and testing',
                        'Final assessment',
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-brand-orange-600 text-white' : 'bg-gray-300 text-black'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={idx === 0 ? 'font-semibold' : 'text-black'}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">{selectedModuleData.title}</h3>
                    <p className="text-black text-sm mb-4">{selectedModuleData.description}</p>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black">Duration:</span>
                        <span className="font-semibold">{selectedModuleData.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Difficulty:</span>
                        <span className="font-semibold capitalize">{selectedModuleData.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Category:</span>
                        <span className="font-semibold">{selectedModuleData.category}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold mb-3">Progress</h3>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion</span>
                        <span className="font-semibold">{selectedModuleData.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="   h-2 rounded-full"
                          style={{ width: `${selectedModuleData.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold mb-3">Features</h3>
                    <ul className="space-y-2">
                      {selectedModuleData.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-black flex items-start">
                          <span className="text-brand-green-500 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6   ">
                    <h3 className="font-bold mb-2">💡 Pro Tip</h3>
                    <p className="text-sm text-black">
                      Use headphones for the best experience. Audio cues will guide you through each step.
                    </p>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
