import { getStaticProgram } from "@/data/programs/index";
import heroBanners from "@/content/heroBanners";
import CosmetologyApprenticeshipClient from "./CosmetologyApprenticeshipClient";

export default async function CosmetologyApprenticeshipPage() {
  const program = getStaticProgram("cosmetology-apprenticeship");
  const banner = heroBanners["cosmetology-apprenticeship"] ?? null;
  return (
    <CosmetologyApprenticeshipClient program={program} banner={banner} />
  );
}

export async function generateMetadata() {
  const program = getStaticProgram("cosmetology-apprenticeship");
  return {
    title: program?.seoTitle ?? program?.title ?? "Cosmetology Apprenticeship",
    description: program?.seoDescription ?? program?.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship" },
  };
}
