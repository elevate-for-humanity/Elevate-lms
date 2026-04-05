"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminMobileNav from "./AdminMobileNav";

interface AdminShellClientProps {
  children: React.ReactNode;
  userName?: string;
  notifs?: import("./AdminHeader").AdminHeaderNotif[];
}

export default function AdminShellClient({
  children,
  userName,
  notifs,
}: AdminShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  // Initialise dark mode from localStorage only — never auto-apply OS preference
  useEffect(() => {
    const stored = localStorage.getItem("admin-dark-mode");
    const enabled = stored === "true"; // default is always light
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("admin-dark-mode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <AdminHeader
          userName={userName}
          notifs={notifs}
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />

        {/* Content */}
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
