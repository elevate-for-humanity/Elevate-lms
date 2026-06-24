import { redirect } from "next/navigation";

// Redirect typo /employee/payrol to correct /employee/payroll
// Primary redirect handled by Netlify edge, this catches local dev
export default function PayrollTypoRedirect() {
  redirect("/employee/payroll");
}
