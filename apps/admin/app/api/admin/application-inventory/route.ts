import {NextRequest,NextResponse} from 'next/server';
import {apiRequireRoles} from '@/lib/admin/guards';
import {getApplicationInventory} from '@/lib/google/application-inventory.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  const auth=await apiRequireRoles(request,['super_admin','admin']);
  if(auth.error)return auth.error;
  const inventory=await getApplicationInventory();
  return NextResponse.json(inventory,{headers:{'Cache-Control':'no-store'}});
}
