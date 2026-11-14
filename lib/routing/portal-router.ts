/** Runtime navigation helper derived entirely from the canonical portal map. */

import { MARKETING_HOST, PORTAL_MAP, type PortalKey } from './portal-map';

export { type PortalKey } from './portal-map';

export const PORTAL_KEYS = Object.keys(PORTAL_MAP) as PortalKey[];

export interface PortalMeta {
  key: PortalKey;
  label: string;
  description: string;
  colorClass: string;
  iconName: string;
}

export const PORTAL_META = Object.fromEntries(
  PORTAL_KEYS.map((key) => {
    const portal = PORTAL_MAP[key];
    return [key, {
      key,
      label: portal.label,
      description: portal.description,
      colorClass: portal.colorClass,
      iconName: portal.iconName,
    }];
  }),
) as Record<PortalKey, PortalMeta>;

export const PortalRouter = {
  get(key: PortalKey): string {
    const portal = PORTAL_MAP[key];
    return `${portal.host}${portal.defaultPath}`;
  },

  getPath(key: PortalKey, path: string): string {
    const portal = PORTAL_MAP[key];
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.host}${portal.basePath}${cleanPath}`;
  },

  path(key: PortalKey, path = ''): string {
    const portal = PORTAL_MAP[key];
    if (!path) return portal.defaultPath;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.basePath}${cleanPath}`;
  },

  basePath(key: PortalKey): string {
    return PORTAL_MAP[key].basePath;
  },

  has(key: string): key is PortalKey {
    return key in PORTAL_MAP;
  },

  meta(key: PortalKey): PortalMeta {
    return PORTAL_META[key];
  },

  keys(): PortalKey[] {
    return PORTAL_KEYS;
  },

  fallback(): string {
    return MARKETING_HOST;
  },
};
