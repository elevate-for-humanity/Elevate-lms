// Redirect to unified Dev Studio
import { redirect } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function DevStudioRedirect() {
  redirect("/admin/studio");
}
