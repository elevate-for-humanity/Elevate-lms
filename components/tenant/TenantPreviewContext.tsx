'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

const ReadOnlyPreview = createContext(false);
export function useReadOnlyTenantPreview() { return useContext(ReadOnlyPreview); }

const PreviewWebsite = createContext<string | null>(null);

/** This identifier selects a draft; the server independently authorizes every request. */
export function TenantPreviewProvider({ websiteId, children, readOnly = false }: { websiteId: string; children: ReactNode; readOnly?: boolean }) {
  return <PreviewWebsite.Provider value={websiteId}><ReadOnlyPreview.Provider value={readOnly}>{children}</ReadOnlyPreview.Provider></PreviewWebsite.Provider>;
}

export function useTenantRequestHeaders(): Record<string, string> {
  const websiteId = useContext(PreviewWebsite);
  return useMemo<Record<string, string>>(() => websiteId ? { 'X-Website-Preview-ID': websiteId } : {}, [websiteId]);
}
