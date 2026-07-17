import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false } };

export default function LmsLoginPage() {
  // LMS uses the main /login page for authentication
  redirect("/login?redirect=/lms/dashboard");
}
