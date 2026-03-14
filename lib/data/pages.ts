import { createClient } from '@/lib/supabase/server';

export interface PageSection {
  id: string;
  page_id: string;
  component: string;
  position: number;
  props: Record<string, unknown>;
}

export interface Page {
  id: string;
  slug: string;
  title: string | null;
  status: 'published' | 'draft' | 'archived';
  meta_title: string | null;
  meta_desc: string | null;
  sections: PageSection[];
}

export async function getPage(slug: string): Promise<Page | null> {
  const supabase = await createClient();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!page) return null;

  const { data: sections } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .order('position');

  return { ...page, sections: sections ?? [] };
}

export async function getAllPages(): Promise<Omit<Page, 'sections'>[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('pages')
    .select('id, slug, title, status, meta_title, meta_desc')
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function upsertPage(
  slug: string,
  fields: Partial<Omit<Page, 'id' | 'slug' | 'sections'>>
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .upsert({ slug, ...fields }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error || !data) throw new Error('Failed to upsert page');
  return data.id;
}

export async function upsertSections(
  pageId: string,
  sections: Omit<PageSection, 'id' | 'page_id'>[]
): Promise<void> {
  const supabase = await createClient();

  // Replace all sections for this page atomically
  await supabase.from('page_sections').delete().eq('page_id', pageId);

  if (sections.length === 0) return;

  const rows = sections.map((s, i) => ({
    page_id: pageId,
    component: s.component,
    position: i,
    props: s.props,
  }));

  const { error } = await supabase.from('page_sections').insert(rows);
  if (error) throw new Error('Failed to save sections');
}
