import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function CnaPage() {
  const loaded = await loadProgramForPage("cna");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["cna"] ?? null;

  return (
    <ProgramDetailPage program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("cna");
  if (!loaded) { return { title: "Cna" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Cna",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/cna" },
  };
}
