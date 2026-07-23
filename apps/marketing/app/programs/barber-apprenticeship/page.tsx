import { getStaticProgram } from "@/data/programs/index";
import heroBanners from "@/content/heroBanners";
import BarberApprenticeshipClient from "./BarberApprenticeshipClient";
import BarberChatAssistant from "./BarberChatAssistant";

export default async function BarberApprenticeshipPage() {
  const program = getStaticProgram("barber-apprenticeship");
  const banner = heroBanners["barber-apprenticeship"] ?? null;
  return (
    <>
      <BarberApprenticeshipClient program={program} banner={banner} />
      <BarberChatAssistant />
    </>
  );
}

export async function generateMetadata() {
  const program = getStaticProgram("barber-apprenticeship");
  return {
    title: program?.seoTitle ?? program?.title ?? "Barber Apprenticeship",
    description: program?.seoDescription ?? program?.subtitle ?? "",
    alternates: { canonical: "https://www.elevateforhumanity.org/programs/barber-apprenticeship" },
  };
}
