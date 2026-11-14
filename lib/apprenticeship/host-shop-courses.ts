import 'server-only';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
export async function loadHostShopCourses(userId:string) {
 const board=await getHostShopBoard(userId);
 const slugs=[...new Set([board.tradeInfo.programSlug,...board.apprentices.map(a=>a.program_slug)].filter(Boolean))];
 const db=await requireAdminClient();
 const {data:programs,error:programError}=await db.from('programs').select('id').in('slug',slugs);
 if(programError) throw programError;
 const ids=(programs||[]).map(p=>p.id);
 const {data:courses,error}=ids.length ? await db.from('courses').select('id,title,program_id,status,is_active,duration_weeks').in('program_id',ids).eq('is_active',true) : {data:[],error:null};
 if(error) throw error;
 return {db,board,courses:courses||[]};
}
