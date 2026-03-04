import React from 'react';
import { Metadata } from 'next';
// Image asset: /images/pages/philanthropy-hero.jpg

export const metadata: Metadata = {
  title: "Sign Up - Create Your Account",
  description: "Create your free account to access career training programs, track your progress, and connect with employers.",
  keywords: ["sign up", "create account", "register", "student portal", "start now"],
  openGraph: {
    title: "Sign Up - Create Your Account | Elevate for Humanity",
    description: "Create your free account to access career training programs and track your progress.",
    images: ["/images/pages/comp-home-highlight-health.jpg"],
    type: "website",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
