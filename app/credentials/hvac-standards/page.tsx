import { Metadata } from "next";
import HVACStandardsContent from "./HVACStandardsContent";

export const metadata: Metadata = {
  title: "HVAC Competency Standards | Elevate for Humanity",
  description:
    "Elevate HVAC Technician Training Program competency standards, domains, and performance verification requirements.",
};

export default function HVACStandardsPage() {
  return <HVACStandardsContent />;
}
