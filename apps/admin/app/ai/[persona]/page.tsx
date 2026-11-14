import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

// Preserve old PARIS/ELLIE/LIZZY/ZORA bookmarks while using one governed console.
// Never create separate persona conversations or bypass Admin authorization.
const LEGACY_PERSONAS = new Set(['paris', 'ellie', 'lizzy', 'zora']);

export default async function LegacyAIPersonaPage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  if (!LEGACY_PERSONAS.has(persona.toLowerCase())) notFound();
  await requireRole(['admin', 'super_admin']);
  redirect('/ai-team');
}
