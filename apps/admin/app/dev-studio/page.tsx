// Redirect to unified Dev Studio
import { redirect } from "next/navigation";

export default function DevStudioRedirect() {
  redirect("/admin/studio");
}
