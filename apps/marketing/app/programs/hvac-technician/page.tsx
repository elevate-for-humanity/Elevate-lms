import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function HvacTechnicianPage() {
  const loaded = await loadProgramForPage("hvac-technician");
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners["hvac-technician"] ?? null;
  const heroBanner =
    banner?.primaryCta?.href?.includes('/apply')
      ? { ...banner, primaryCta: undefined }
      : banner;
  return <ProgramDetailPage program={p} banner={heroBanner} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("hvac-technician");
  if (!loaded) return { title: "HVAC Technician" };
  const p = loaded.program;
  return {
    title: p.metaTitle ?? p.title ?? "HVAC Technician",
    description: p.metaDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/hvac-technician" },
  };
}
