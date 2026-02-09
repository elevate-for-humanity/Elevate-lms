"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Pin, Mail, Bell, Eye, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt: Date;
  isPinned: boolean;
  isRead: boolean;
  viewCount: number;
  sendEmail: boolean;
  sendPush: boolean;
}

interface AnnouncementsSystemProps {
  courseId: string;
  announcements?: Announcement[];
  canCreate?: boolean;
  onCreateAnnouncement?: (data: any) => void;
}

export function AnnouncementsSystem({
  courseId,
  announcements: initialAnnouncements = [],
  canCreate = false,
  onCreateAnnouncement
}: AnnouncementsSystemProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    isPinned: false,
    sendEmail: true,
    sendPush: true,
    sendSMS: false
  });

  // Fetch announcements from database
  const fetchAnnouncements = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: Announcement[] = data.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        authorName: (a.profiles as any)?.full_name || 'Admin',
        authorAvatar: (a.profiles as any)?.avatar_url,
        publishedAt: new Date(a.created_at),
        isPinned: a.is_pinned || false,
        isRead: false,
        viewCount: a.view_count || 0,
        sendEmail: a.send_email || false,
        sendPush: a.send_push || false,
      }));
      setAnnouncements(formatted);
    }
  }, [courseId]);

  useEffect(() => {
    if (initialAnnouncements.length === 0) {
      fetchAnnouncements();
    }
  }, [fetchAnnouncements, initialAnnouncements.length]);

  const handleCreate = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('announcements').insert({
      course_id: courseId,
      author_id: user?.id,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      is_pinned: newAnnouncement.isPinned,
      send_email: newAnnouncement.sendEmail,
      send_push: newAnnouncement.sendPush,
    });

    if (!error) {
      await onCreateAnnouncement?.(newAnnouncement);
      setNewAnnouncement({
        title: '',
        content: '',
        isPinned: false,
        sendEmail: true,
        sendPush: true,
        sendSMS: false
      });
      setIsCreating(false);
      fetchAnnouncements();
    }
  };

  const pinnedAnnouncements = announcements.filter(a => a.isPinned);
  const regularAnnouncements = announcements.filter(a => !a.isPinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-orange-600" />
          Announcements
        </h2>
        {canCreate && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition"
          >
            {isCreating ? 'Cancel' : 'New Announcement'}
          </button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-black mb-4">Create Announcement</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Title
              </label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Announcement title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Content
              </label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Write your announcement..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAnnouncement.isPinned}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                  className="rounded border-slate-300 text-brand-orange-600 focus:ring-emerald-500"
                />
                <Pin className="w-4 h-4 text-black" />
                <span className="text-sm text-black">Pin to top</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAnnouncement.sendEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, sendEmail: e.target.checked })}
                  className="rounded border-slate-300 text-brand-orange-600 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-black" />
                <span className="text-sm text-black">Send email notification</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAnnouncement.sendPush}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, sendPush: e.target.checked })}
                  className="rounded border-slate-300 text-brand-orange-600 focus:ring-emerald-500"
                />
                <Bell className="w-4 h-4 text-black" />
                <span className="text-sm text-black">Send push notification</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAnnouncement.sendSMS}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewAnnouncement({ ...newAnnouncement, sendSMS: e.target.checked })}
                  className="rounded border-slate-300 text-brand-orange-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-black">Send SMS notification (if enabled)</span>
              </label>
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-brand-orange-600 text-white py-2 rounded-lg hover:bg-brand-orange-700 transition"
            >
              Post Announcement
            </button>
          </div>
        </div>
      )}

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-black uppercase tracking-wide flex items-center gap-2">
            <Pin className="w-4 h-4" />
            Pinned
          </h3>
          {pinnedAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      {/* Regular Announcements */}
      <div className="space-y-4">
        {regularAnnouncements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>

      {announcements.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-black">No announcements yet</p>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className={`bg-white rounded-lg border-2 p-6 ${
      announcement.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200'
    } ${!announcement.isRead ? 'shadow-md' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {announcement.authorAvatar ? (
            <Image
              src={announcement.authorAvatar}
              alt={announcement.authorName}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-semibold">
              {announcement.authorName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-black">{announcement.authorName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {announcement.publishedAt.toLocaleDateString()}
            </div>
          </div>
        </div>
        {announcement.isPinned && (
          <Pin className="w-5 h-5 text-yellow-600" />
        )}
      </div>

      <h3 className="text-xl font-bold text-black mb-2">{announcement.title}</h3>
      <p className="text-black whitespace-pre-wrap mb-3">{announcement.content}</p>

      <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-200">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {announcement.viewCount} views
        </span>
        {!announcement.isRead && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
            New
          </span>
        )}
      </div>
    </div>
  );
}
