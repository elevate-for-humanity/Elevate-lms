'use client';

import { useEffect, useState } from 'react';
import { TrialBanner } from './TrialBanner';
import {
  getLicenseAccessMode,
  type License,
  type AccessMode,
} from '@/lib/licensing/billing-authority';

interface AdminLicenseWrapperProps {
  children: React.ReactNode;
  license: License | null;
  userRole: string;
  tenantId: string;
}

/**
 * Wrapper for admin pages that:
 * 1. Shows TrialBanner when appropriate
 * 2. Handles read-only hold mode
 * 3. Blocks mutations when in hold mode
 */
export function AdminLicenseWrapper({
  children,
  license,
  userRole,
  tenantId,
}: AdminLicenseWrapperProps) {
  const [accessMode, setAccessMode] = useState<AccessMode>('full');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const result = getLicenseAccessMode(license, userRole);
    setAccessMode(result.mode);

    // Show banner for trial licenses (active or in hold)
    const isTrial = license?.tier === 'trial';
    const shouldShowBanner =
      isTrial && (result.mode === 'full' || result.mode === 'admin_readonly_hold');
    setShowBanner(shouldShowBanner);
  }, [license, userRole]);

  // Calculate completed steps (would come from actual data in production)
  const completedSteps: string[] = [];

  return (
    <div className="min-h-screen">
      {/* Trial Banner - only for trial licenses */}
      {showBanner && license && license.expires_at && (
        <TrialBanner
          expiresAt={new Date(license.expires_at)}
          licenseId={license.id || ''}
          tenantId={tenantId}
          completedSteps={completedSteps}
          dismissible={accessMode === 'full'}
        />
      )}

      {/* Read-only hold banner */}
      {accessMode === 'admin_readonly_hold' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-amber-800 font-medium">
              <span className="font-bold">Billing Hold:</span> Your workspace is in read-only mode.
              Upgrade to restore full access.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div data-access-mode={accessMode}>{children}</div>
    </div>
  );
}

/**
 * Hook to check if mutations are allowed
 * Use this in forms/buttons to disable when in hold mode
 */
export function useLicenseAccess(license: License | null, userRole: string) {
  const result = getLicenseAccessMode(license, userRole);

  return {
    mode: result.mode,
    canRead: result.canRead,
    canMutate: result.canMutate,
    message: result.message,
    isHoldMode: result.mode === 'admin_readonly_hold',
  };
}
