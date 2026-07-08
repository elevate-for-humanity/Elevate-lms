import { redirect } from "next/navigation";

export default function LmsLoginPage() {
  // LMS uses the main /login page for authentication
  redirect("/login?redirect=/lms/dashboard");
}
