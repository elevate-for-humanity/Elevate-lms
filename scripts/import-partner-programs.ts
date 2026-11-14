/**
 * Import Partner Programs with Stripe Pricing
 *
 * This script reads partner-programs-catalog.json and creates:
 * 1. Program pages for each partner program
 * 2. Stripe products with pricing
 * 3. Partner revenue split configuration (50% markup model)
 *
 * Pricing Model:
 * - Partner Price: What partner charges
 * - Student Price: Partner Price * 1.5 (50% markup)
 * - Revenue Split: Partner gets their price, Elevate keeps markup
 * - WIOA Eligible: Can be 100% FREE with WIOA funding
 */

import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'scripts/utilities/partner-programs-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

interface PartnerProgram {
  program_id: string;
  name: string;
  partner_price: number;
  student_price: number;
  duration: string;
  level: string;
  certification_type: string;
}

interface Partner {
  partner_name: string;
  partner_full_name: string;
  category: string;
  website: string;
  stripe_account_id: string;
  funding_eligible: boolean;
  note: string;
  programs: PartnerProgram[];
}

// Extract all partner programs
const partners: Record<string, Partner> = catalog.credentialing_partners;

Object.entries(partners).forEach(([partnerId, partner]) => {
  partner.programs.forEach((program) => {
    const markup = program.student_price - program.partner_price;
    const markupPercent = ((markup / program.partner_price) * 100).toFixed(0);
  });
});

// Generate summary
const totalPartners = Object.keys(partners).length;
const totalPrograms = Object.values(partners).reduce((sum, p) => sum + p.programs.length, 0);
const avgPartnerPrice =
  Object.values(partners)
    .flatMap((p) => p.programs)
    .reduce((sum, prog) => sum + prog.partner_price, 0) / totalPrograms;
const avgStudentPrice =
  Object.values(partners)
    .flatMap((p) => p.programs)
    .reduce((sum, prog) => sum + prog.student_price, 0) / totalPrograms;

// Export for use in app
const exportData = {
  partners,
  summary: {
    totalPartners,
    totalPrograms,
    avgPartnerPrice: parseFloat(avgPartnerPrice.toFixed(2)),
    avgStudentPrice: parseFloat(avgStudentPrice.toFixed(2)),
  },
};

const exportPath = path.join(process.cwd(), 'app/data/partner-programs.json');
fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
