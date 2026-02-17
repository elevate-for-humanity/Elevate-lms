"use client";

import { Award, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earned: boolean;
  earned_at?: string;
  progress?: number;
  progress_max?: number;
}

interface BadgeShowcaseProps {
  userId?: string;
  badges?: Badge[];
  limit?: number;
}

export function BadgeShowcase({ userId, badges: initialBadges, limit = 6 }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges || []);
  const [loading, setLoading] = useState(!initialBadges);

  useEffect(() => {
    if (initialBadges || !userId) return;

    async function fetchBadges() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', userId)
          .limit(limit);

        if (!error && data) {
          setBadges(data.map((ub: any) => ({
            id: ub.badge_id,
            name: ub.badges?.name || 'Badge',
            description: ub.badges?.description || '',
            icon_url: ub.badges?.icon_url,
            rarity: ub.badges?.rarity || 'common',
            earned: true,
            earned_at: ub.earned_at,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [userId, initialBadges, limit]);

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-gray-100 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return " ";
      case "rare":
        return " ";
      case "epic":
        return " ";
      case "legendary":
        return " ";
      default:
        return " ";
    }
  };

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-orange-400" />
            Your Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className={` ${getRarityColor(badge.rarity)} rounded-lg p-4 text-center`}
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">{badge.name}</h4>
                <p className="text-xs text-white/80 mb-2">{badge.description}</p>
                {badge.earned_at && (
                  <p className="text-xs text-white/60">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-slate-400" />
            Locked Badges ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-slate-800 rounded-lg p-4 text-center opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-700 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-slate-500" />
                </div>
                <h4 className="font-semibold text-white mb-1">{badge.name}</h4>
                <p className="text-xs text-slate-400 mb-2">{badge.description}</p>
                {badge.progress !== undefined && badge.progress_max && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-brand-orange-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(badge.progress / badge.progress_max) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {badge.progress} / {badge.progress_max}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
