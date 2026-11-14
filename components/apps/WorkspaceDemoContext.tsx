'use client';
import { createContext } from 'react';
/** Public demos inject a browser-only transport. Paid workspaces use their authenticated API by default. */
export const WorkspaceDemoContext = createContext<null | {
  request: (app: 'sam-gov' | 'grants', body: Record<string, any> | FormData) => Promise<any>;
  refresh: () => void;
  documentHref: (id: string) => string | undefined;
}>(null);
