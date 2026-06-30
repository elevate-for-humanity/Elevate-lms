import { createStaticClient } from '@/lib/supabase/static';
import NextStepsPage from './NextStepsClient';

export const revalidate = 3600;

export default async function Page() {
  const supabase = createStaticClient();
  const { data: programs } = await supabase
    .from('programs').select('id, title, slug')
    .eq('is_active', true).eq('published', true).order('title');
  return <NextStepsPage programs={programs ?? []} />;
}
