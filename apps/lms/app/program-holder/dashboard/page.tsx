import type { Metadata } from 'next';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Program Holder Dashboard', description: 'Manage enrolled students, assigned programs, hours, documents, reports, and compliance.', robots: { index: false, follow: false } };
export default function Page() { return <ProgramHolderWorkspaceView section="dashboard" />; }
