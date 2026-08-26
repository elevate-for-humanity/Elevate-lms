import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { QMA } from "@/data/programs/qma";

export const revalidate = 3600;

export default async function QmaPage() {
  const loaded = await loadProgramForPage("qma");
  const p = loaded?.program ?? QMA;
  const banner = heroBanners["qma"] ?? null;
  return <ProgramDetailPage program={p} banner={banner} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("qma");
  const p = loaded?.program ?? QMA;
  return {
    title: p.metaTitle ?? p.title ?? "QMA",
    description: p.metaDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/qma" },
  };
}
