
"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, MessageCircle, Video, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
}

interface RealTimeCollaborationProps {
  roomId: string;
  currentUser: CollaborationUser;
}

export function RealTimeCollaboration({
  roomId,
  currentUser,
}: RealTimeCollaborationProps) {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [messages, setMessages] = useState<Array<{ user: string; text: string; time: string }>>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchRoomData = useCallback(async () => {
    const supabase = createClient();
    
    // Update presence
    await supabase.from('collaboration_presence').upsert({
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      status: 'online',
      last_seen: new Date().toISOString(),
    }).catch(() => {});

    // Fetch active users
    const { data: presence } = await supabase
      .from('collaboration_presence')
      .select('*')
      .eq('room_id', roomId)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (presence) {
      const users: CollaborationUser[] = presence.map(p => ({
        id: p.user_id,
        name: p.user_name,
        avatar: p.avatar_url || '/media/avatars/default.jpg',
        status: 'online',
        currentPage: p.current_page,
      }));
      setActiveUsers(users);
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from('collaboration_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (msgs) {
      setMessages(msgs.map(m => ({
        user: m.user_name,
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString(),
      })).reverse());
    }
  }, [roomId, currentUser]);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const supabase = createClient();
    await supabase.from('collaboration_messages').insert({
      room_id: roomId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      content: newMessage,
    });
    
    setNewMessage('');
    fetchRoomData();
  };

  // Fallback mock users for demo
  const displayUsers: CollaborationUser[] = activeUsers.length > 0 ? activeUsers : [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '/media/avatars/avatar-1.jpg',
      status: 'online',
      currentPage: 'Lesson 3: Patient Care',
    },
    {
      id: '2',
      name: 'Michael Chen',
      avatar: '/media/avatars/avatar-2.jpg',
      status: 'online',
      currentPage: 'Quiz: Safety Protocols',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: '/media/avatars/avatar-3.jpg',
      status: 'away',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-brand-green-500';
      case 'away':
        return 'bg-brand-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-brand-orange-600" size={24} />
              <CardTitle>Study Group ({activeUsers.length} online)</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              <Video size={16} className="mr-2" />
              Start Video Call
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="relative">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{user.name}</div>
                  {user.currentPage && (
                    <div className="text-xs text-black">{user.currentPage}</div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <MessageCircle size={14} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Chat */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageCircle className="text-brand-orange-600" size={24} />
            <CardTitle>Group Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.user}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <div className="bg-white p-2 rounded text-sm">{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
              />
              <Button onClick={sendMessage} className="bg-brand-orange-600 hover:bg-brand-orange-700">
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen Sharing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Share2 className="text-brand-green-600" size={24} />
            <CardTitle>Screen Sharing</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Share2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-black mb-4">Share your screen with the study group</p>
            <Button className="bg-brand-green-600 hover:bg-brand-green-700">
              Start Screen Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
