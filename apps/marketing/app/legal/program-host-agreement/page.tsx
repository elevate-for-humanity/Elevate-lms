import type { Metadata } from 'next';
import FullProgramHostAgreement from '@/components/program-holder/FullProgramHostAgreement';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Master Program Host Agreement', robots: { index: false, follow: false } };
export default function ProgramHostAgreementPage() { return <FullProgramHostAgreement showSignature />; }
