'use client';

import { ColoredLivePreviewFrame } from './ColoredLivePreviewFrame';
import type { SitePreviewTarget } from './types';

export default function SitePreviewPanelWrapper({ sites }: { sites: SitePreviewTarget[] }) {
  return <ColoredLivePreviewFrame targets={sites} minHeight={580} />;
}
