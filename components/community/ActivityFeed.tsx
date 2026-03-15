'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  MessageSquare, 
  Heart, 
  Award, 
  BookOpen, 
  Users, 
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
  link?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && !error) {
      setActivities(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'discussion':
        return <MessageSquare className="w-5 h-5 text-brand-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-brand-red-500" />;
      case 'achievement':
      case 'certificate':
        return <Award className="w-5 h-5 text-yellow-500" />;
      case 'course':
      case 'lesson':
        return <BookOpen className="w-5 h-5 text-brand-green-500" />;
      case 'group':
      case 'member':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-brand-orange-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-gray-900">Activity Feed</h2>
        <button
          onClick={fetchActivities}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="divide-y">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user_name}</span>{' '}
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(activity.created_at)}
                  </p>
                </div>
                {activity.link && (
                  <Link
                    href={activity.link}
                    className="text-brand-blue-600 text-sm hover:underline flex-shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t">
        <Link
          href="/community"
          className="text-brand-blue-600 text-sm font-medium hover:underline"
        >
          View all activity →
        </Link>
      </div>
    </div>
  );
}
