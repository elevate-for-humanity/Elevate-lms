import { NextRequest,NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError,safeError } from '@/lib/api/safe-error';
import { refreshSecrets } from '@/lib/secrets';
import { getGoogleServices,googleProjectId } from '@/lib/google/runtime';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const INFRA_OWNED_KEYS=new Set(['PORT','HOSTNAME','NODE_ENV','SERVICE_ROLE','SERVICE_NAME']);
function valid(key:string){return /^[A-Z][A-Z0-9_]{1,127}$/.test(key)}
function category(key:string){if(/^(GROQ|OPENAI|ANTHROPIC|GEMINI|ELEVENLABS)/.test(key))return'ai';if(/^(GOOGLE|CLOUDFLARE|SUPABASE|DATABASE|NEXTAUTH|CRON)/.test(key))return'infra';if(/^(QB_|PAYPAL)/.test(key))return'payments';return'integrations'}
export async function GET(req:NextRequest){const rl=await applyRateLimit(req,'api');if(rl)return rl;const auth=await apiRequireDevStudio(req);if(auth.error)return auth.error;return NextResponse.json({provider:'google-cloud',project:googleProjectId(),secretAuthority:'google-secret-manager',services:getGoogleServices().map(({key,id,label})=>({key,id,label})),fetchedAt:new Date().toISOString()});}
export async function POST(req:NextRequest){const rl=await applyRateLimit(req,'strict');if(rl)return rl;const auth=await apiRequireDevStudio(req);if(auth.error)return auth.error;const body=await req.json().catch(()=>null);const key=String(body?.key??'').trim().toUpperCase();const value=typeof body?.value==='string'?body.value.trim():'';if(!valid(key))return safeError('Valid ENV-style key is required',400);if(INFRA_OWNED_KEYS.has(key))return safeError(key+' is infrastructure-owned',409);if(!value)return safeError('A value is required',400);const db=await requireAdminClient();const {error}=await db.rpc('set_platform_secret',{p_key:key,p_value:value,p_description:`Updated through Dev Studio by ${auth.id}; Google deployment secret binding`,p_category:category(key)});if(error)return safeDbError(error,`Failed to persist ${key}`);await refreshSecrets();return NextResponse.json({success:true,key,provider:'google-cloud',secretAuthority:'canonical-encrypted-store',updatedServices:body?.service?[String(body.service)]:getGoogleServices().map(s=>s.key),deploymentRequired:true});}
export async function DELETE(req:NextRequest){const rl=await applyRateLimit(req,'strict');if(rl)return rl;const auth=await apiRequireDevStudio(req);if(auth.error)return auth.error;return safeError('Delete the canonical secret through the governed secret lifecycle; direct runtime deletion is disabled.',409);}
