"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminMobileNav from "./AdminMobileNav";

interface AdminShellClientProps {
  children: React.ReactNode;
  userName?: string;
  userInitial?: string;
  notifs?: import("./AdminHeader").AdminHeaderNotif[];
}

export default function AdminShellClient({
  children,
  userName,
  userInitial,
  notifs,
}: AdminShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar — receives open state */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset on desktop by sidebar width */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header — passes hamburger trigger down */}
        <AdminHeader
          userName={userName}
          userInitial={userInitial}
          notifs={notifs}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content — pt-16 matches header height, pb-20 clears mobile bottom nav */}
        <main
          id="main-content"
          className="flex-1 pt-16 pb-20 lg:pb-8 px-4 sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav />
    </div>
  );
}
