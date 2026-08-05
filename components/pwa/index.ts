/**
 * PWA components barrel export.
 *
 * Domain-specific registration (mount ONE per app):
 *   Admin    → AdminPwaRegister       (registers /sw-admin.js)
 *   Marketing → MarketingPwaRegistration (registers /sw-marketing.js)
 *   LMS      → LmsPwaRegistration   (registers /sw-lms.js)
 *   Portal   → PortalPwaRegistration (registers /sw-portal.js)
 *
 * Install UI (use in any app):
 *   PwaInstallBanner  → fixed bottom banner with install CTA
 *   PwaInstallButton  → standalone button component
 *   usePwaInstall     → hook returning canInstall, isInstalled, promptInstall
 *
 * Legacy (deprecated — migrate to canonical components above):
 *   ServiceWorkerRegistration  → unmounted, unused
 *   InstallPrompt              → use PwaInstallBanner
 *   AdminInstallPrompt         → use PwaInstallButton
 *   AdminInstallButton         → use PwaInstallButton
 */

// Install infrastructure (canonical — use these in all apps)
export { PwaInstallBanner } from './PwaInstallBanner';
export { PwaInstallButton } from './PwaInstallButton';
export { usePwaInstall } from '@/hooks/usePwaInstall';

// Domain-specific registration (mount ONE per app)
export { AdminPwaRegister } from './AdminPwaRegister';
export { MarketingPwaRegistration } from './MarketingPwaRegistration';
export { LmsPwaRegistration } from './LmsPwaRegistration';
export { PortalPwaRegistration } from './PortalPwaRegistration';
