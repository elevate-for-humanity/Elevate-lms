import { loadProgramForPage } from "@/lib/programs/load-program-page";
import { ProgramDetailPageComponent } from "@/components/programs/public/ProgramDetailPageComponent";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function CdlTrainingPage() {
  const loaded = await loadProgramForPage("cdl-training");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["cdl-training"] ?? null;

  return (
    <ProgramDetailPageComponent program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("cdl-training");
  if (!loaded) { return { title: "Cdl Training" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Cdl Training",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/cdl-training" },
  };
}
