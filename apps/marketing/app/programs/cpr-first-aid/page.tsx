import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function CprFirstAidPage() {
  const loaded = await loadProgramForPage("cpr-first-aid");
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners["cpr-first-aid"] ?? null;
  return <ProgramDetailPage program={p} banner={banner} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("cpr-first-aid");
  if (!loaded) return { title: "CPR & First Aid" };
  const p = loaded.program;
  return {
    title: p.metaTitle ?? p.title ?? "CPR & First Aid",
    description: p.metaDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/cpr-first-aid" },
  };
}
