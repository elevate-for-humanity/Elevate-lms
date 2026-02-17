'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, Info, AlertTriangle, AlertCircle } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'event' | 'important' | 'urgent';
  published_at: string;
};

/**
 * AnnouncementsList - Full announcements page
 * 
 * Rules:
 * - Fetches from /api/announcements (student audience)
 * - No data = helpful message (not fake data)
 * - Severity icons consistent with AnnouncementsFeed
 */
export default function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements?audience=student&limit=50');
        if (!res.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-red-50 rounded-xl p-6 border border-brand-red-200">
        <div className="flex items-center gap-3 text-brand-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Unable to load announcements. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Announcements</h2>
        <p className="text-gray-600">
          There are no announcements at this time. Check back later for updates.
        </p>
      </div>
    );
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'important':
      case 'urgent':
        return <AlertTriangle className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
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
        return 'border-l-brand-red-600';
      case 'event':
        return 'border-l-brand-green-600';
      default:
        return 'border-l-brand-blue-600';
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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`bg-white rounded-xl p-6 border-l-4 shadow-sm ${getBorderColor(announcement.severity)}`}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getBadgeColor(announcement.severity)}`}>
                {getIcon(announcement.severity)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {announcement.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatDate(announcement.published_at)}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${getBadgeColor(announcement.severity)}`}
            >
              {getLabel(announcement.severity)}
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed">{announcement.body}</p>
        </div>
      ))}
    </div>
  );
}
