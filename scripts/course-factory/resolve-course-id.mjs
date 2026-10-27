import {pathToFileURL} from 'node:url';
export async function resolveCourseId(slug,{request=fetch,env=process.env}={}) {
  if (!/^[a-z0-9-]+$/.test(slug??'')) throw new Error('canonical_course_slug_invalid');
  const root=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  if (!root||!key) throw new Error('database_connection_missing');
  const url=new URL('/rest/v1/courses',root);
  url.searchParams.set('select','id');url.searchParams.set('slug','eq.'+slug);url.searchParams.set('limit','2');
  const response=await request(url,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error('canonical_course_lookup_failed');
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length!==1||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rows[0]?.id??''))
    throw new Error('canonical_course_missing_or_ambiguous');
  return rows[0].id;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  resolveCourseId(process.argv[2]).then(id=>console.log(id)).catch(()=>{console.error('Canonical course lookup failed; no course data changed');process.exitCode=1;});
