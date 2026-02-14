"use client";

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'instructor' | 'student';
  handRaised: boolean;
  muted: boolean;
  videoOn: boolean;
}

interface ChatMessage {
  id: string;
  author: string;
  message: string;
  timestamp: string;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  active: boolean;
}

interface LiveStreamingClassroomProps {
  sessionId?: string;
}

export function LiveStreamingClassroom({ sessionId }: LiveStreamingClassroomProps) {
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | 'polls'>('chat');
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', author: 'Alex Chen', message: 'Could you explain the closure example again?', timestamp: '10:23 AM' },
    { id: '2', author: 'Dr. Emily Rodriguez', message: 'Sure! Let me share my screen and walk through it step by step.', timestamp: '10:24 AM' },
    { id: '3', author: 'Sarah Williams', message: 'This is really helpful, thank you!', timestamp: '10:25 AM' },
  ]);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Log attendance
    if (user) {
      await supabase.from('live_session_attendance').upsert({
        session_id: sessionId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
      }).catch(() => {});
    }

    // Fetch participants
    const { data: attendees } = await supabase
      .from('live_session_attendance')
      .select('*, profiles(full_name, avatar_url, role)')
      .eq('session_id', sessionId);

    if (attendees) {
      const formatted: Participant[] = attendees.map(a => ({
        id: a.user_id,
        name: a.profiles?.full_name || 'Participant',
        avatar: a.profiles?.avatar_url || '/images/team/founder/elizabeth-greene-founder-hero-01.jpg',
        role: a.profiles?.role === 'instructor' ? 'instructor' : 'student',
        handRaised: a.hand_raised || false,
        muted: true,
        videoOn: false,
      }));
      setParticipants(formatted);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Fallback participants for demo
  const fallbackParticipants: Participant[] = [
    {
      id: '1',
      name: 'Dr. Emily Rodriguez',
      avatar: '👩‍🏫',
      role: 'instructor',
      handRaised: false,
      muted: false,
      videoOn: true,
    },
    {
      id: '2',
      name: 'Alex Chen',
      avatar: '👨‍🎓',
      role: 'student',
      handRaised: true,
      muted: true,
      videoOn: true,
    },
    {
      id: '3',
      name: 'Sarah Williams',
      avatar: '👩‍💻',
      role: 'student',
      handRaised: false,
      muted: true,
      videoOn: false,
    },
  ];

  // Chat messages initialized in useState above

  const poll: Poll = {
    id: '1',
    question: 'Do you understand the concept of closures?',
    options: [
      { text: 'Yes, completely', votes: 12 },
      { text: 'Somewhat', votes: 8 },
      { text: 'Need more explanation', votes: 3 },
    ],
    active: true,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">JavaScript Advanced Concepts</h1>
            <p className="text-sm text-gray-400">Live Session • 45 participants</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">🔴 Recording</Button>
            <Button variant="secondary" size="sm">⚙️ Settings</Button>
            <Button size="sm" className="bg-brand-orange-600 hover:bg-brand-orange-700">Leave</Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col bg-black">
            {/* Video Stream */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4 text-4xl md:text-5xl lg:text-6xl">🎥</div>
                <p className="text-xl">Live Stream Active</p>
                <p className="text-sm text-gray-400 mt-2">Dr. Emily Rodriguez is presenting</p>
              </div>

              {/* Screen Share Indicator */}
              <div className="absolute top-4 left-4 bg-brand-orange-600 text-white px-3 py-2 rounded text-sm">
                🖥️ Screen Sharing
              </div>

              {/* Participant Thumbnails */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                {participants.slice(0, 3).map((p) => (
                  <div key={p.id} className="relative">
                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-3xl">
                      {p.avatar}
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded truncate">
                      {p.name.split(' ')[0]}
                    </div>
                    {!p.muted && (
                      <div className="absolute top-1 right-1 bg-green-500 w-2 h-2 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-6 py-4 flex justify-center gap-4">
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white">
                🎤 Mute
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white">
                📹 Video
              </button>
              <button
                onClick={() => setHandRaised(!handRaised)}
                className={`p-3 rounded-full text-white ${
                  handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                ✋ {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white">
                🖥️ Share
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white">
                💬 Reactions
              </button>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 bg-gray-800 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700">
              {(['chat', 'participants', 'polls'] as const).map((panel) => (
                <button
                  key={panel}
                  onClick={() => setActivePanel(panel)}
                  className={`flex-1 py-3 text-sm font-medium capitalize ${
                    activePanel === panel
                      ? 'text-white border-b-2 border-red-600'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {panel}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-white text-sm">{msg.author}</span>
                          <span className="text-xs text-gray-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-300">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border-none focus:ring-2 focus:ring-red-600"
                      />
                      <button className="px-4 py-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'participants' && (
                <div className="p-4 space-y-2">
                  <div className="text-sm text-gray-400 mb-3">
                    {participants.length} participants
                  </div>
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{p.avatar}</div>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{p.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {p.handRaised && <span className="text-yellow-500">✋</span>}
                        {p.muted && <span className="text-gray-500">🎤</span>}
                        {!p.videoOn && <span className="text-gray-500">📹</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePanel === 'polls' && (
                <div className="p-4">
                  {poll.active && (
                    <Card className="p-4 bg-gray-700 border-gray-600">
                      <h3 className="text-white font-bold mb-3">{poll.question}</h3>
                      <div className="space-y-2">
                        {poll.options.map((option, idx) => {
                          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                          return (
                            <button
                              key={idx}
                              className="w-full text-left p-3 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-white text-sm">{option.text}</span>
                                <span className="text-gray-300 text-sm">{option.votes} votes</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                  className="bg-brand-orange-600 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
