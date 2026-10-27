import {NextRequest,NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth/require-role';
import {HOST_SHOP_ROLES} from '@/lib/rbac/role-matrix';
import {loadHostShopCourses} from '@/lib/apprenticeship/host-shop-courses';
import {signedLessonPlayback} from '@/lib/storage/lesson-playback';
import {renderMediaUrl} from '@/lib/ultimate-course-builder/media/playback-source.mjs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest) {
 const {user}=await requireRole(HOST_SHOP_ROLES);
 const courseId=req.nextUrl.searchParams.get('courseId')||'';const lessonId=req.nextUrl.searchParams.get('lessonId')||'';
 const {db,courses}=await loadHostShopCourses(user.id);
 if(!courses.some(c=>c.id===courseId))return NextResponse.json({error:'Course not assigned to this Host Shop'},{status:403});
 const {data:lesson}=await db.from('course_lessons').select('video_url,content_json').eq('id',lessonId).eq('course_id',courseId).eq('is_published',true).maybeSingle();
 const source=renderMediaUrl(lesson?.content_json?.film)||lesson?.video_url;if(!source)return NextResponse.json({error:'Published video unavailable'},{status:404});
 return new NextResponse(null,{status:307,headers:{Location:await signedLessonPlayback(db,source),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
