'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

const PreviewWebsite = createContext<string | null>(null);

/** This identifier selects a draft; the server independently authorizes every request. */
export function TenantPreviewProvider({ websiteId, children }: { websiteId: string; children: ReactNode }) {
  return <PreviewWebsite.Provider value={websiteId}>{children}</PreviewWebsite.Provider>;
}

export function useTenantRequestHeaders(): Record<string, string> {
  const websiteId = useContext(PreviewWebsite);
  return useMemo<Record<string, string>>(() => websiteId ? { 'X-Website-Preview-ID': websiteId } : {}, [websiteId]);
}
