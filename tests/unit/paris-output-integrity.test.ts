import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  result: { data: null, error: null } as any,
  image: vi.fn(),
  chat: vi.fn(),
  execute: vi.fn(),
  calls: [] as {method: string; args: any[]}[],
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => {
  const query: any = new Proxy({}, { get: (_, key) => key === 'then'
    ? (resolve: any) => Promise.resolve(h.result).then(resolve)
    : (...args: any[]) => {h.calls.push({method:String(key),args});return query;} });
  return { from: () => query, rpc: async () => h.result };
} }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/ai/ai-service', () => ({ aiGenerateImage: h.image, aiChat: h.chat }));
vi.mock('@/lib/ai/runtime/command-executor', () => ({ executeAICommand: h.execute }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => (await import('@supabase/supabase-js')).createClient('test','test') }));
vi.mock('@/lib/social/publisher', () => ({}));
vi.mock('@/lib/paris/workforce', () => ({}));
vi.mock('@/lib/paris/import-engine', () => ({ importSource: vi.fn(), quickAnalyze: vi.fn() }));

import { ParisAI } from '@/lib/ai/paris-ai';
import { generateImage, editImage, generateAltText, optimizeImage, getMediaStats, trackMediaUsage, saveToBrandLibrary, getBrandAssets, unifiedMediaSearch } from '@/lib/paris/media-studio/api';
import { analyzeContentPerformance } from '@/lib/paris/marketing';
import { executeCommand } from '@/lib/paris/dev-studio';
import { generateCurriculumMetadata, generateCurriculumLicense, generateRenewalQuote } from '@/lib/paris/licensing-platform';
import { logActivity, addAgentKnowledge, addAgentMemory } from '@/lib/paris/workforce/agent-manager';
import { requestApproval, approveWorkflow } from '@/lib/paris/workforce/approval-workflow';
import { importAPI, generateSupabaseEdgeFunction } from '@/lib/paris/import-engine/api-importer';
import { analyzeGitHubRepository } from '@/lib/paris/import-engine/github-analyzer';
import { generateReadinessReport } from '@/lib/paris/qa-designer';
import { saveWorkOneAnswer } from '@/lib/paris/application-self-service';
import { generateContent } from '@/lib/paris/marketing/content-generator';
import { CONTENT_TEMPLATES } from '@/lib/paris/marketing/types';
import { getFundingRecommendation, PROGRAM_IDS } from '@/lib/paris/paris-knowledge';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

beforeEach(() => {
  h.result = { data: null, error: null };
  h.image.mockReset();
  h.chat.mockReset();
  h.execute.mockReset();
  h.calls = [];
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('does not fabricate an AI response when its provider is unavailable', async () => {
  h.chat.mockRejectedValue(Error('Provider not configured'));
  await expect(new ParisAI().sendMessage([{role:'user',content:'Hire an agent'}])).rejects.toThrow('Provider not configured');
  expect(h.execute).not.toHaveBeenCalled();
});
it.each([401, 429, 503])('does not turn provider HTTP %s into demo success', async status => {
  h.chat.mockRejectedValue(Error(`Provider HTTP ${status}`));
  await expect(new ParisAI().sendMessage([{role:'user',content:'Deploy'}])).rejects.toThrow(`Provider HTTP ${status}`);
});
it('propagates a network failure instead of claiming execution', async () => {
  h.execute.mockRejectedValue(Error('network unavailable'));
  await expect(new ParisAI().executeCommand('Deploy',{actorId:'owner',actorRoles:['admin'],adminOrigin:'https://admin.example'})).rejects.toThrow('network unavailable');
});
it('reads actual canonical provider text and rejects an empty provider body', async () => {
  h.chat.mockResolvedValue({content:'actual provider output'});
  expect(await new ParisAI().sendMessage([{role:'user',content:'Analyze'}])).toBe('actual provider output');
  h.chat.mockResolvedValue({content:''});
  await expect(new ParisAI().sendMessage([])).rejects.toThrow('PARIS_AI_EMPTY_RESPONSE');
});
it.each(['{"success":true,"actions":["deploy"],"message":"Deployed"}', 'Deployed successfully'])('cannot use model prose or JSON as an execution receipt: %s', async text => {
  h.chat.mockResolvedValue({content:text});
  const result = await new ParisAI().executeCommand('Deploy');
  expect(result).toMatchObject({success:false,actions:[]});
  expect(h.execute).not.toHaveBeenCalled();
});
it('returns an actual image provider artifact instead of unrelated stock', async () => {
  h.image.mockResolvedValue([{url:'https://provider.example/generated/123.png'}]);
  const result = await generateImage({prompt:'A specific requested training scene',dimensions:{width:1920,height:1080}} as any);
  expect(result).toEqual({success:true,imageUrl:'https://provider.example/generated/123.png'});
  expect(h.image).toHaveBeenCalledWith(expect.objectContaining({prompt:'A specific requested training scene',size:'1792x1024'}));
});
it('does not create an image result when the provider fails or returns none', async () => {
  h.image.mockRejectedValue(Error('offline'));
  expect(await generateImage({prompt:'requested scene'} as any)).toMatchObject({success:false});
  h.image.mockResolvedValue([]);
  expect(await generateImage({prompt:'requested scene'} as any)).toMatchObject({success:false});
  expect(await generateImage({} as any)).toMatchObject({success:false});
});
it.each(['remove_background','upscale','crop'])('cannot claim %s without an editing artifact', async action => {
  expect(await editImage('https://original.example/image.png',{action} as any)).toMatchObject({success:false});
});
it('cannot invent image descriptions, optimization, or measured analytics', async () => {
  await expect(generateAltText('https://original.example/image.png')).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
  await expect(optimizeImage('https://original.example/image.png',{width:400})).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
  await expect(analyzeContentPerformance('content')).rejects.toThrow('CONTENT_METRICS_UNAVAILABLE');
});
it('cannot claim content was queued without a publishing receipt', async () => {
  expect(await executeCommand({intent:'publish_content',entities:{},confidence:100,originalCommand:'Publish'})).toMatchObject({success:false});
});
const terms = {name:'Owner offer',durationMonths:12,pricePerStudent:7,minimumStudents:2,annualMaintenanceFee:11};
it('leaves new curriculum and licenses pending verified publication and eligibility', () => {
  expect(generateCurriculumMetadata({curriculumId:'id',courseName:'Course',credentialSlug:'slug',provider:'provider',category:'training'})).toMatchObject({status:'draft',productionReady:false,wioaEligible:false,qualityScore:null,averageCompletion:null});
  const license = generateCurriculumLicense({curriculumId:'id',curriculumName:'Course',licenseType:terms,studentSeats:3});
  expect(license).toMatchObject({status:'pending',autoRenew:false,renewalEligible:false});
  expect(() => generateRenewalQuote(license)).toThrow('PARIS_RENEWAL_TERMS_REQUIRED');
  expect(generateRenewalQuote(license,{licenseType:terms,studentSeats:3}).total).toBe(32);
});
it.each(['database failure','missing receipt'])('never returns generated persistence IDs after %s', async failure => {
  h.result = {data:null,error:failure === 'database failure' ? {code:'write_failed'} : null};
  await expect(logActivity('agent',{type:'task',action:'action',status:'completed'} as any)).rejects.toThrow('PARIS_DATABASE_WRITE_UNVERIFIED');
  await expect(addAgentKnowledge('agent','knowledge')).rejects.toThrow('PARIS_DATABASE_WRITE_UNVERIFIED');
  await expect(addAgentMemory('agent','short_term','memory' as any)).rejects.toThrow('PARIS_DATABASE_WRITE_UNVERIFIED');
  await expect(requestApproval('agent','task','grant_submission','Review')).rejects.toThrow('PARIS_DATABASE_WRITE_UNVERIFIED');
});
it('uses the actual returned saved row ID', async () => {
  h.result = {data:{id:'database-returned-id'},error:null};
  expect(await addAgentKnowledge('agent','knowledge')).toBe('database-returned-id');
});
it('does not fabricate zero inventory when a media query fails', async () => {
  h.result = {data:null,error:{code:'unavailable'}};
  await expect(getMediaStats('organization')).rejects.toThrow('PARIS_DATABASE_OPERATION_FAILED');
  await expect(trackMediaUsage('image','page','add')).rejects.toThrow('PARIS_DATABASE_OPERATION_FAILED');
});

it('resolves an actual relative API server and never fabricates api.example.com', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({openapi:'3.0.0',info:{title:'Actual service',version:'1'},servers:[{url:'/v2'}],paths:{}})));
  const result = await importAPI('https://service.example/openapi.json');
  expect(result.success).toBe(true);
  expect(result.analysis).toMatchObject({baseUrl:'https://service.example/v2'});
});
it('generated API scaffolding cannot report an unimplemented operation as success', () => {
  const source = generateSupabaseEdgeFunction({method:'POST',path:'/items',responses:[]} as any,'items');
  expect(source).toContain('status: 501');
  expect(source).toContain('success: false');
  expect(source).not.toContain('success: true');
});
it('rejects unresolved API server variables before URL encoding can hide them', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({openapi:'3.0.0',info:{title:'Service',version:'1'},servers:[{url:'/api/{region}'}],paths:{}})));
  expect(await importAPI('https://service.example/openapi.json')).toMatchObject({success:false,errors:['API_SERVER_VARIABLES_REQUIRE_VALUES']});
});
it('passes the supplied GitHub identity on every request and uses the real default branch', async () => {
  const fetcher = vi.fn(async (input: string) => {
    if (input.includes('/contents/')) return Response.json([]);
    return Response.json({default_branch:'release',html_url:'https://github.com/owner/repo',topics:[]});
  });
  vi.stubGlobal('fetch', fetcher);
  const result = await analyzeGitHubRepository('owner','repo',{token:'test-installation-identity'});
  expect(result.licensing).toMatchObject({name:'Unknown',compatible:false});
  expect(fetcher.mock.calls.some(([url]) => url.includes('?ref=release'))).toBe(true);
  for (const [,init] of vi.mocked(fetch).mock.calls) expect((init?.headers as any).Authorization).toBe('Bearer test-installation-identity');
});
it('does not analyze a denied repository as an empty successful repository', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: string) => input.includes('/contents/')
    ? new Response('',{status:403}) : Response.json({default_branch:'main',topics:[]})));
  await expect(analyzeGitHubRepository('owner','repo')).rejects.toThrow('PARIS_REPOSITORY_CONTENTS_HTTP_403');
});
it('cannot give empty curriculum a perfect readiness or fabricated license', () => {
  const report = generateReadinessReport({courseId:'course',courseName:'Course',lessons:[],modules:[],competencies:[],blueprintTopics:[],mediaAssets:[]});
  expect(report).toMatchObject({isReady:false,runtimeVerified:false,assessmentBasis:'static-heuristic',licensingMetadata:null});
  expect(report.blueprintCoverage.percentage).toBe(0);
});
it('does not report an application answer saved after a database error', async () => {
  h.result = {data:null,error:{code:'write_failed'}};
  const db = (await import('@supabase/supabase-js')).createClient('test','test');
  await expect(saveWorkOneAnswer(db,{id:'application'},'workone_visited',true)).rejects.toThrow('PARIS_DATABASE_WRITE_UNVERIFIED');
});
it('does not return marketing drafts as saved when their insert fails', async () => {
  h.result = {data:null,error:{code:'write_failed'}};
  const template = CONTENT_TEMPLATES[0];
  await expect(generateContent(template.id,{title:'Verified title',description:'Provided facts only'},{platforms:['facebook']})).rejects.toThrow('PARIS_DATABASE_OPERATION_FAILED');
});
it('uses UUIDs and real database columns for a saved media artifact', async () => {
  h.result = {data:{id:'saved-id',type:'image',url:'https://asset.example/actual.png',title:'Actual artifact',source:'brand_library',file_size:123,used_count:2,used_on:['page-a','page-b'],created_at:'2026-11-07',updated_at:'2026-11-07'},error:null};
  const result = await saveToBrandLibrary({type:'image',url:'https://asset.example/actual.png',title:'Actual artifact',source:'brand_library',thumbnailUrl:'https://asset.example/thumb.png',tags:[],seoKeywords:[],usedOn:[],usedCount:0} as any,'organization');
  const inserted = h.calls.find(call=>call.method==='insert')!.args[0];
  expect(inserted.id).toMatch(/^[a-f0-9-]{36}$/);
  expect(inserted).toMatchObject({thumbnail_url:'https://asset.example/thumb.png',org_id:'organization'});
  expect(inserted).not.toHaveProperty('thumbnailUrl');
  expect(result).toMatchObject({id:'saved-id',fileSize:123,usedCount:2,usedOn:['page-a','page-b']});
});
it('maps saved brand assets without inventing missing brand logos', async () => {
  h.result = {data:{logo_primary:'https://actual.example/logo.svg',color_primary:'#123456',font_heading:'Actual font'},error:null};
  expect(await getBrandAssets('organization')).toMatchObject({logos:{primary:'https://actual.example/logo.svg'},colors:{primary:'#123456'},fonts:{heading:'Actual font'}});
  h.result = {data:null,error:null};
  expect(await getBrandAssets('organization')).toBeNull();
});
it('preserves unknown storage size and reads actual saved AI assets within the organization', async () => {
  h.result = {data:[{id:'saved',url:'https://actual.example/image.png',title:'Requested',source:'ai_generated',used_count:1,file_size:null,created_at:'2026-11-07',updated_at:'2026-11-07'}],error:null};
  expect((await getMediaStats('organization')).totalStorage).toBeNull();
  const results = await unifiedMediaSearch('Requested',{sources:['ai_generated'],orgId:'organization'});
  expect(results.ai_generated.items[0].id).toBe('saved');
  expect(h.calls).toContainEqual({method:'eq',args:['org_id','organization']});
  await expect(unifiedMediaSearch('Requested',{sources:['ai_generated']})).rejects.toThrow('PARIS_MEDIA_ORGANIZATION_REQUIRED');
});
it('does not invent an award percentage from an interview rubric', () => {
  expect(PROGRAM_IDS).toContain('data_science');
  expect(getFundingRecommendation(90,'data_science')).toMatchObject({percentage:null,status:'requires_funder_verification'});
  expect(()=>getFundingRecommendation(90,'not-a-program')).toThrow('PARIS_PROGRAM_NOT_FOUND');
});
it('keeps known fabrication markers out of production PARIS libraries', () => {
  const script = resolve(process.cwd(),'scripts/audit-paris-output-integrity.mjs');
  const result = JSON.parse(execFileSync(process.execPath,[script],{encoding:'utf8'}));
  expect(result.files).toBeGreaterThan(40);
  expect(result.findings).toEqual([]);
});
