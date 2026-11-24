'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

type ConfigState = [TenantSiteConfig, Dispatch<SetStateAction<TenantSiteConfig>>];
const WebsiteConfigContext = createContext<ConfigState | null>(null);
type PublicationState = [boolean, Dispatch<SetStateAction<boolean>>];
const WebsitePublicationContext = createContext<PublicationState | null>(null);

/** Keeps manual changes, PARIS, preview, and publication on the same saved config. */
export function WebsiteConfigProvider({ initialConfig, initiallyPublished = false, children }: { initialConfig: TenantSiteConfig; initiallyPublished?: boolean; children: ReactNode }) {
  const [config, setConfig] = useState(() => ensureComposableSiteConfig(initialConfig));
  const [published, setPublished] = useState(initiallyPublished);
  const value = useMemo<ConfigState>(() => [config, setConfig], [config]);
  const publication = useMemo<PublicationState>(() => [published, setPublished], [published]);
  return <WebsitePublicationContext.Provider value={publication}><WebsiteConfigContext.Provider value={value}>{children}</WebsiteConfigContext.Provider></WebsitePublicationContext.Provider>;
}

export function useWebsitePublication(initiallyPublished: boolean): PublicationState {
  const shared = useContext(WebsitePublicationContext);
  const local = useState(initiallyPublished);
  return shared || local;
}

export function useWebsiteConfig(initialConfig: TenantSiteConfig): ConfigState {
  const shared = useContext(WebsiteConfigContext);
  const local = useState(() => ensureComposableSiteConfig(initialConfig));
  return shared || local;
}
