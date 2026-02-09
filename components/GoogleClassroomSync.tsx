"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function GoogleClassroomSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    syncCourses: true,
    syncAssignments: true,
    syncGrades: true,
  });

  // Load last sync time from database
  React.useEffect(() => {
    const loadSyncStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('google_classroom_sync')
        .select('last_sync_at, settings')
        .eq('user_id', user.id)
        .single();

      if (data) {
        if (data.last_sync_at) setLastSync(new Date(data.last_sync_at));
        if (data.settings) setSettings(data.settings);
      }
    };
    loadSyncStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Call sync API
      await fetch('/api/integrations/google-classroom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const now = new Date();
      setLastSync(now);

      // Save sync status to database
      if (user) {
        await supabase.from('google_classroom_sync').upsert({
          user_id: user.id,
          last_sync_at: now.toISOString(),
          settings,
          status: 'completed',
        });
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-black">Last Sync</p>
            <p className="font-medium">
              {lastSync ? lastSync.toLocaleString() : 'Never'}
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sync Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Au courses</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span>Sync assignments</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span>Sync grades</span>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </Card>
    </div>
  );
}
