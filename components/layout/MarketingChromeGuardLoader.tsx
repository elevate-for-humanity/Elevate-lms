'use client';

// Client boundary that owns the MarketingChromeGuard.
// Imported directly — no dynamic() needed since this file is already
// 'use client' and MarketingChromeGuard has no SSR output to suppress.

import MarketingChromeGuard from './MarketingChromeGuard';

export default function MarketingChromeGuardLoader() {
  return <MarketingChromeGuard />;
}
