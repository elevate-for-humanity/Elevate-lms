import { Metadata } from "next";
import ChecksheetsContent from "./ChecksheetsContent";

export const metadata: Metadata = {
  title: "Performance Checksheets | Elevate HVAC Training",
  description:
    "OJT skill verification checksheets for HVAC technician training performance competencies.",
};

export default function ChecksheetsPage() {
  return <ChecksheetsContent />;
}
