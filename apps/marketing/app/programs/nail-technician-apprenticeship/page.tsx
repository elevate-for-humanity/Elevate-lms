import { loadProgramForPage } from "@/lib/programs/load-program-page";
import { ProgramDetailPageComponent } from "@/components/programs/public/ProgramDetailPageComponent";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function NailTechnicianApprenticeshipPage() {
  const loaded = await loadProgramForPage("nail-technician-apprenticeship");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["nail-technician-apprenticeship"] ?? null;

  return (
    <ProgramDetailPageComponent program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("nail-technician-apprenticeship");
  if (!loaded) { return { title: "Nail Technician Apprenticeship" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Nail Technician Apprenticeship",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship" },
  };
}
