"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

interface CareerRecommendation {
  title: string;
  matchScore: number;
  salary: string;
  growth: string;
  skills: string[];
}

export default function AICareerCounseling() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      content: "Hi! I'm your AI Career Counselor. I'm here to help you explore career paths, plan your education, and achieve your professional goals. What would you like to discuss today?",
      timestamp: new Date().toLocaleTimeString(),
      suggestions: [
        'Explore career options',
        'Review my skills',
        'Plan my learning path',
        'Salary expectations',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const recommendations: CareerRecommendation[] = [
    {
      title: 'Full-Stack Developer',
      matchScore: 95,
      salary: '$75k - $120k',
      growth: '+22% (5 years)',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    },
    {
      title: 'Frontend Developer',
      matchScore: 88,
      salary: '$65k - $110k',
      growth: '+18% (5 years)',
      skills: ['React', 'CSS', 'JavaScript', 'UI/UX'],
    },
    {
      title: 'DevOps Engineer',
      matchScore: 75,
      salary: '$80k - $130k',
      growth: '+25% (5 years)',
      skills: ['AWS', 'Docker', 'CI/CD', 'Linux'],
    },
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Simulate AI response
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      content: "Based on your JavaScript skills and interest in web development, I recommend focusing on React and Node.js. These technologies are in high demand and align well with your learning style. Would you like me to create a personalized learning path?",
      timestamp: new Date().toLocaleTimeString(),
      suggestions: [
        'Yes, create learning path',
        'Show me job opportunities',
        'What skills should I learn next?',
      ],
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInputMessage('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">AI Career Counseling</h1>
          <p className="text-red-100">Get personalized career guidance powered by AI</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-12 h-12    rounded-full flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold">AI Career Counselor</h3>
                  <p className="text-sm text-green-600">● Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${
                        message.sender === 'user'
                          ? 'bg-brand-blue-600 text-white'
                          : 'bg-gray-100 text-black'
                      } rounded-lg p-4`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender === 'user' ? 'text-red-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>

                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3 ml-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  <Button onClick={handleSendMessage}>Send</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Your Profile</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-black">Current Level</p>
                  <p className="font-semibold">Intermediate Developer</p>
                </div>
                <div>
                  <p className="text-black">Primary Skills</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['JavaScript', 'React', 'CSS'].map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-black">Career Goal</p>
                  <p className="font-semibold">Full-Stack Developer</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Top Career Matches</h3>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                      <span className="text-xs font-bold text-brand-blue-600">{rec.matchScore}%</span>
                    </div>
                    <p className="text-xs text-black mb-1">💰 {rec.salary}</p>
                    <p className="text-xs text-green-600">📈 {rec.growth}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6   ">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button size="sm" variant="secondary" className="w-full">
                  📊 View Career Report
                </Button>
                <Button size="sm" variant="secondary" className="w-full">
                  📚 Learning Resources
                </Button>
                <Button size="sm" variant="secondary" className="w-full">
                  💼 Job Opportunities
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-3">AI Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="font-semibold text-blue-900 mb-1">💡 Skill Gap</p>
                  <p className="text-xs text-blue-700">
                    Focus on TypeScript to increase your marketability by 30%
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="font-semibold text-green-900 mb-1">🎯 Next Step</p>
                  <p className="text-xs text-green-700">
                    Complete Node.js course to qualify for 15 new job openings
                  </p>
                </div>
                <div className="p-3 bg-brand-red-50 rounded">
                  <p className="font-semibold text-brand-red-900 mb-1">📈 Trend Alert</p>
                  <p className="text-xs text-brand-red-700">
                    React developers in your area earn 18% above average
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
