import { Metadata } from "next";
import TranscriptContent from "./TranscriptContent";

export const metadata: Metadata = {
  title: "Student Transcript | Elevate HVAC Training",
  description:
    "Official student transcript showing competency mastery, assessment scores, and clock hours.",
};

export default function TranscriptPage() {
  return <TranscriptContent />;
}
