/**
 * PWA components barrel export.
 *
 * Domain-specific registration (mount ONE per canonical app):
 *   Admin     → AdminPwaRegister
 *   Marketing → MarketingPwaRegistration
 *   LMS       → LmsPwaRegistration
 *
 * Install UI (use in any app):
 *   PwaInstallBanner  → fixed bottom banner with install CTA
 *   PwaInstallButton  → standalone button component
 *   usePwaInstall     → hook returning canInstall, isInstalled, promptInstall
 */

export { PwaInstallBanner } from './PwaInstallBanner';
export { PwaInstallButton } from './PwaInstallButton';
export { usePwaInstall } from '@/hooks/usePwaInstall';

export { AdminPwaRegister } from './AdminPwaRegister';
export { MarketingPwaRegistration } from './MarketingPwaRegistration';
export { LmsPwaRegistration } from './LmsPwaRegistration';
