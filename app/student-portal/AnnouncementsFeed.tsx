'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, Info, AlertTriangle } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'event' | 'important' | 'urgent';
  published_at: string;
};

/**
 * AnnouncementsFeed - Database-backed announcements
 * 
 * Rules:
 * - Fetches from /api/announcements (student audience)
 * - No data = no component (returns null)
 * - No hardcoded/fake announcements
 */
export default function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements?audience=student&limit=3');
        if (!res.ok) {
          setAnnouncements([]);
          return;
        }
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  // Loading state - minimal skeleton
  if (loading) {
    return (
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <Bell className="w-8 h-8 text-brand-orange-600" />
            <h2 className="text-3xl font-black text-black">Announcements</h2>
          </div>
          <div className="animate-pulse grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 h-32" />
            <div className="bg-white rounded-xl p-6 h-32" />
            <div className="bg-white rounded-xl p-6 h-32" />
          </div>
        </div>
      </section>
    );
  }

  // No announcements = no component (strict rendering)
  if (announcements.length === 0) {
    return null;
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'important':
      case 'urgent':
        return <AlertTriangle className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  const getLabel = (severity: string) => {
    switch (severity) {
      case 'important':
        return 'Important';
      case 'urgent':
        return 'Urgent';
      case 'event':
        return 'Event';
      default:
        return 'Info';
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'important':
      case 'urgent':
        return 'border-brand-red-600';
      case 'event':
        return 'border-brand-green-600';
      default:
        return 'border-brand-blue-600';
    }
  };

  const getBadgeColor = (severity: string) => {
    switch (severity) {
      case 'important':
      case 'urgent':
        return 'bg-brand-red-100 text-brand-red-700';
      case 'event':
        return 'bg-brand-green-100 text-brand-green-700';
      default:
        return 'bg-brand-blue-100 text-brand-blue-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-8 h-8 text-brand-orange-600" />
          <h2 className="text-3xl font-black text-black">Announcements</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl p-6 border-l-4 ${getBorderColor(announcement.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-black">
                  {announcement.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${getBadgeColor(announcement.severity)}`}
                >
                  {getIcon(announcement.severity)}
                  {getLabel(announcement.severity)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {formatDate(announcement.published_at)}
              </p>
              <p className="text-gray-600">{announcement.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
