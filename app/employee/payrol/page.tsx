import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

import { redirect } from "next/navigation";

// Redirect typo /employee/payrol to correct /employee/payroll
// Primary redirect handled by Netlify edge, this catches local dev
export default function PayrollTypoRedirect() {
  redirect("/employee/payroll");
}
