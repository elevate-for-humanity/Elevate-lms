/**
 * Admin application root layout.
 *
 * The authenticated Admin surface owns its navigation and operational UI.
 * Public/marketing support widgets and marketing-style footers must not be
 * mounted here because they compete with the mobile admin navigation layer and
 * expose canned public actions inside a privileged workspace.
 */
import type { Metadata } from "next";
import "./globals.css";
import '../../../styles/contrast-guardrails.css';
import BuildVersionSync from '@/components/BuildVersionSync';
import AdminHeader from '@/components/admin/AdminHeader';
import { I18nProvider } from '@/lib/i18n/context';
import { AdminPwaRegister } from '@/components/pwa/AdminPwaRegister';
import { AdminUpdateNotice } from '@/components/pwa/AdminUpdateNotice';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';

export const metadata: Metadata = {
  title: {
    default: "Elevate Admin",
    template: "%s | Elevate Admin",
  },
  description:
    "Manage Elevate for Humanity programs, courses, students, website content, and operations.",
  manifest: "/manifest-admin.json",
  applicationName: "Elevate Admin",
  robots: { index: false, follow: false },
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
  themeColor: "#f97316",
};

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body className="admin-portal efh-contrast">
        <SupabaseConfigBootstrap />
        <AdminPwaRegister />
        <AdminUpdateNotice />
        <I18nProvider>
          <div className="min-h-dvh min-w-0 overflow-x-clip bg-slate-50">
            <BuildVersionSync />
            <AdminHeader />
            <main className="min-w-0 overflow-x-clip">
              {children}
            </main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
