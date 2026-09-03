'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { License } from './index';

interface FeatureGateProps {
  feature: keyof License['features'];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFeature() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.tenant_id) {
        setLoading(false);
        return;
      }

      const { data: license } = await supabase
        .from('licenses')
        .select('features')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (license?.features?.[feature]) {
        setEnabled(true);
      }

      setLoading(false);
    }

    checkFeature();
  }, [feature]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>;
  }

  if (!enabled) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
      <p className="text-gray-600 mb-4">
        {feature.replace(/_/g, ' ')} is available on Professional and Enterprise plans.
      </p>
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Upgrade Now
      </button>
    </div>
  );
}
