"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Tutor {
  id: string;
  name: string;
  avatar: string;
  subjects: string[];
  rating: number;
  reviews: number;
  hourlyRate: number;
  availability: string;
  bio: string;
}

export function PeerTutoringMarketplace() {
  const [selectedSubject, setSelectedSubject] = useState('all');

  const tutors: Tutor[] = [
    {
      id: '1',
      name: 'Alex Chen',
      avatar: '👨‍🎓',
      subjects: ['Mathematics', 'Physics'],
      rating: 4.9,
      reviews: 45,
      hourlyRate: 25,
      availability: 'Mon-Fri 6-9pm',
      bio: 'Engineering student with 2 years tutoring experience',
    },
    {
      id: '2',
      name: 'Sarah Williams',
      avatar: '👩‍🎓',
      subjects: ['English', 'Writing'],
      rating: 4.8,
      reviews: 38,
      hourlyRate: 20,
      availability: 'Weekends',
      bio: 'English major passionate about helping students improve writing',
    },
    {
      id: '3',
      name: 'Graduate',
      avatar: '👨‍💻',
      subjects: ['Programming', 'Web Development'],
      rating: 5.0,
      reviews: 52,
      hourlyRate: 30,
      availability: 'Flexible',
      bio: 'Full-stack developer and coding mentor',
    },
  ];

  const subjects = ['all', ...Array.from(new Set(tutors.flatMap(t => t.subjects)))];
  const filteredTutors = selectedSubject === 'all'
    ? tutors
    : tutors.filter(t => t.subjects.includes(selectedSubject));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Peer Tutoring Marketplace</h1>
          <p className="text-red-100">Connect with expert student tutors</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedSubject === subject
                  ? 'bg-brand-orange-600 text-white'
                  : 'bg-white text-black border hover:bg-gray-50'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">{tutor.avatar}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{tutor.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{tutor.rating}</span>
                    <span className="text-gray-500">({tutor.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-black text-sm mb-4">{tutor.bio}</p>

              <div className="mb-4">
                <p className="text-sm font-semibold text-black mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject) => (
                    <span key={subject} className="px-2 py-2 bg-orange-100 text-orange-700 text-xs rounded">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4 text-sm text-black">
                <p>📅 {tutor.availability}</p>
                <p className="font-bold text-brand-orange-600 text-lg mt-2">${tutor.hourlyRate}/hour</p>
              </div>

              <Button className="w-full">Book Session</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
