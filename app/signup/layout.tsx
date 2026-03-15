import React from 'react';
import { Metadata } from 'next';
// Image asset: /images/pages/philanthropy-hero.jpg

export const metadata: Metadata = {
  title: "Sign Up - Create Your Account",
  description: "Create your free account to access career training programs, track your progress, and connect with employers.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
