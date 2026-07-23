import { loadProgramForPage } from "@/lib/programs/load-program-page";
import { ProgramDetailPageComponent } from "@/components/programs/public/ProgramDetailPageComponent";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function HvacTechnicianPage() {
  const loaded = await loadProgramForPage("hvac-technician");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["hvac-technician"] ?? null;

  return (
    <ProgramDetailPageComponent program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("hvac-technician");
  if (!loaded) { return { title: "Hvac Technician" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Hvac Technician",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/hvac-technician" },
  };
}
