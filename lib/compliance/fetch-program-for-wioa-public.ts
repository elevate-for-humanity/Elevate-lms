import { createPublicClient } from '@/lib/supabase/public';

export type WioaPublicProgram = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cip_code: string | null;
  soc_code: string | null;
  credential_name: string | null;
  intraining_program_id: string | null;
  etpl_requires_initial_eligibility: boolean;
};

export async function fetchProgramForWioaPublic(slug: string): Promise<WioaPublicProgram | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, slug, title, description, cip_code, soc_code, credential_name, intraining_program_id, etpl_requires_initial_eligibility',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('programs')
      .select('id, slug, title, description, cip_code, soc_code, credential_name')
      .eq('slug', slug)
      .maybeSingle();
    if (!fallback) return null;
    return {
      ...fallback,
      intraining_program_id: null,
      etpl_requires_initial_eligibility: true,
    } as WioaPublicProgram;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    cip_code: data.cip_code,
    soc_code: data.soc_code,
    credential_name: data.credential_name,
    intraining_program_id: (data as { intraining_program_id?: string | null }).intraining_program_id ?? null,
    etpl_requires_initial_eligibility:
      (data as { etpl_requires_initial_eligibility?: boolean }).etpl_requires_initial_eligibility ??
      true,
  };
}
