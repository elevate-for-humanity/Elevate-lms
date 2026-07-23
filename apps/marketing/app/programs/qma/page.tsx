import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function QmaPage() {
  const loaded = await loadProgramForPage("qma");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["qma"] ?? null;

  return (
    <ProgramDetailPage program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("qma");
  if (!loaded) { return { title: "Qma" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Qma",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/qma" },
  };
}
