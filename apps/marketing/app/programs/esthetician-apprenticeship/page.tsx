import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function EstheticianApprenticeshipPage() {
  const loaded = await loadProgramForPage("esthetician-apprenticeship");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["esthetician-apprenticeship"] ?? null;

  return (
    <ProgramDetailPage program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("esthetician-apprenticeship");
  if (!loaded) { return { title: "Esthetician Apprenticeship" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Esthetician Apprenticeship",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/esthetician-apprenticeship" },
  };
}
