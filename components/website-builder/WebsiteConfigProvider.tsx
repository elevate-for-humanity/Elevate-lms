'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

type ConfigState = [TenantSiteConfig, Dispatch<SetStateAction<TenantSiteConfig>>];
const WebsiteConfigContext = createContext<ConfigState | null>(null);

/** Keeps manual changes, PARIS, preview, and publication on the same saved config. */
export function WebsiteConfigProvider({ initialConfig, children }: { initialConfig: TenantSiteConfig; children: ReactNode }) {
  const [config, setConfig] = useState(() => ensureComposableSiteConfig(initialConfig));
  const value = useMemo<ConfigState>(() => [config, setConfig], [config]);
  return <WebsiteConfigContext.Provider value={value}>{children}</WebsiteConfigContext.Provider>;
}

export function useWebsiteConfig(initialConfig: TenantSiteConfig): ConfigState {
  const shared = useContext(WebsiteConfigContext);
  const local = useState(() => ensureComposableSiteConfig(initialConfig));
  return shared || local;
}
