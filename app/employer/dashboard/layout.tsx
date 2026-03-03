import React from 'react';
import { Metadata } from 'next';
// Image asset: /images/programs-new/program-23.jpg

export const metadata: Metadata = {
  title: "Employer Dashboard - Manage Jobs & Candidates",
  description: "Post jobs, review candidates, and manage your workforce pipeline. Connect with job-ready talent trained in healthcare, skilled trades, and more.",
  keywords: ["employer dashboard", "post jobs", "hire talent", "workforce pipeline", "candidate management"],
  openGraph: {
    title: "Employer Dashboard | Elevate for Humanity",
    description: "Post jobs, review candidates, and manage your workforce pipeline.",
    images: ["/images/heroes-hq/programs-hero.jpg"],
    type: "website",
  },
};

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
