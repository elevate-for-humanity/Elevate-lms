import { loadProgramForPage } from "@/lib/programs/load-program-page";
import { ProgramDetailPageComponent } from "@/components/programs/public/ProgramDetailPageComponent";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function CprFirstAidPage() {
  const loaded = await loadProgramForPage("cpr-first-aid");
  if (!loaded) { return notFound(); }
  const p = loaded.program;
  const banner = heroBanners["cpr-first-aid"] ?? null;

  return (
    <ProgramDetailPageComponent program={p} banner={banner} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("cpr-first-aid");
  if (!loaded) { return { title: "Cpr First Aid" }; }
  const p = loaded.program;
  return {
    title: p.seoTitle ?? p.title ?? "Cpr First Aid",
    description: p.seoDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/cpr-first-aid" },
  };
}
