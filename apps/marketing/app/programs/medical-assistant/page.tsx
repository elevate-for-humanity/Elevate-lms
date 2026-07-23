import { getStaticProgram } from "@/data/programs/index";
import heroBanners from "@/content/heroBanners";
import MedicalAssistantProgramPageClient from "./MedicalAssistantProgramPageClient";

export default async function MedicalAssistantPage() {
  const program = getStaticProgram("medical-assistant");
  const banner = heroBanners["medical-assistant"] ?? null;
  return (
    <MedicalAssistantProgramPageClient program={program} banner={banner} />
  );
}

export async function generateMetadata() {
  const program = getStaticProgram("medical-assistant");
  return {
    title: program?.seoTitle ?? program?.title ?? "Medical Assistant",
    description: program?.seoDescription ?? program?.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/medical-assistant" },
  };
}
