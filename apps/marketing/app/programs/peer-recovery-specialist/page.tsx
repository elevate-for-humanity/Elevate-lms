import { loadProgramForPage } from "@/lib/programs/load-program-page";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";
import heroBanners from "@/content/heroBanners";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function PeerRecoverySpecialistPage() {
  const loaded = await loadProgramForPage("peer-recovery-specialist");
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners["peer-recovery-specialist"] ?? null;
  return <ProgramDetailPage program={p} banner={banner} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage("peer-recovery-specialist");
  if (!loaded) return { title: "Peer Recovery Specialist" };
  const p = loaded.program;
  return {
    title: p.metaTitle ?? p.title ?? "Peer Recovery Specialist",
    description: p.metaDescription ?? p.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/peer-recovery-specialist" },
  };
}
