/**
 * Admin group layout - shared UI wrapper with proper branding.
 * Auth check is handled by middleware to avoid redirect loops.
 */
import type { Metadata } from "next";
import "./globals.css";
import BuildVersionSync from '@/components/BuildVersionSync';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminFooter } from '@/components/admin/AdminFooter';
import { I18nProvider } from '@/lib/i18n/context';
import { AdminPwaRegister } from '@/components/pwa/AdminPwaRegister';
import { AdminUpdateNotice } from '@/components/pwa/AdminUpdateNotice';

export const metadata: Metadata = {
  title: {
    default: "Elevate Admin",
    template: "%s | Elevate Admin",
  },
  description:
    "Manage Elevate for Humanity programs, courses, students, website content, and operations.",
  manifest: "/manifest.webmanifest",
  applicationName: "Elevate Admin",
  appleWebApp: {
    capable: true,
    title: "Elevate Admin",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminPwaRegister />
        <AdminUpdateNotice />
        <I18nProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <BuildVersionSync />
            <AdminHeader />
            <main className="flex-1">
              {children}
            </main>
            <AdminFooter />
            <LiveChatWidget />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
