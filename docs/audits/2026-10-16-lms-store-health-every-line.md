# LMS and Store health — every-line audit

Baseline: deployed ad774208f3f247f9e21997026885636f56d089ae compared with fab6a69122fb62b824cbf968792d80e14f7d4fb8. These 11 files are identical across those commits. 566 physical lines, including comments and blank lines, are listed below. No production code changed in this audit.

Fresh public probes at 21:05:41 UTC returned HTTP 200 for ping, readiness and health on both services. Both reported deployed ad774208. Historical monitoring run 38957164897 recorded LMS/Store dependency 503s while liveness/readiness passed. It also failed Marketing QuickBooks at HTTP 503. Its summarized output cannot establish the exact earlier dependency error.

LMS release run 38964844912/job 117191090183 failed with quota_exceeded when adding the candidate tag, then failed tag cleanup with the same classification. Candidate HTTP health testing and public promotion did not run. CPU versus memory quota is not established by these logs.

Findings below distinguish code limitations and diagnostic gaps from confirmed production failures. Auth-settings availability is not a complete database or learner workflow test. No platform-wide health pass or signed-in workflow acceptance is claimed.

## lib/health/service-health.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>export type RuntimeReadiness = {</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 2 | <code>  ready: boolean;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 3 | <code>  missing: string[];</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 4 | <code>  commit: string;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 5 | <code>  buildId: string;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 6 | <code>  builtAt: string;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 7 | <code>  revision: string &#124; null;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 8 | <code>};</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 9 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 10 | <code>export type DependencyHealth = {</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 11 | <code>  ok: boolean;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 12 | <code>  status: number &#124; null;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 13 | <code>  latencyMs: number;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 14 | <code>  error?: string;</code> | EXPECTED: Declares readiness/dependency response fields; no network or writes. |
| 15 | <code>};</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 16 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 17 | <code>const REQUIRED_RUNTIME_CONFIG = [</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 18 | <code>  'NEXT_PUBLIC_SUPABASE_URL',</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 19 | <code>  'NEXT_PUBLIC_SUPABASE_ANON_KEY',</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 20 | <code>] as const;</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 21 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 22 | <code>function normalized(value: string &#124; undefined): string {</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 23 | <code>  return value?.trim() ?? '';</code> | EXPECTED: Defines required public Supabase configuration and trims values. |
| 24 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 25 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 26 | <code>export function getRuntimeReadiness(</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 27 | <code>  additionalRequired: readonly string[] = [],</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 28 | <code>): RuntimeReadiness {</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 29 | <code>  const required = [...REQUIRED_RUNTIME_CONFIG, ...additionalRequired];</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 30 | <code>  const missing = required.filter((name) =&gt; !normalized(process.env[name]));</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 31 | <code>  const commit = normalized(</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 32 | <code>    process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA,</code> | GAP: nullish precedence accepts an empty GIT_SHA instead of falling through to a populated alternative. |
| 33 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 34 | <code>  const buildId = normalized(process.env.NEXT_PUBLIC_BUILD_ID);</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 35 | <code>  const builtAt = normalized(process.env.BUILD_TIMESTAMP);</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 36 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 37 | <code>  if (!commit &#124;&#124; commit === 'unknown' &#124;&#124; commit === 'MISSING') missing.push('BUILD_COMMIT');</code> | GAP: a nonempty malformed commit is treated as ready; this check does not require a 40-character SHA. |
| 38 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 39 | <code>  return {</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 40 | <code>    ready: missing.length === 0,</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 41 | <code>    missing: [...new Set(missing)],</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 42 | <code>    commit: commit &#124;&#124; 'unknown',</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 43 | <code>    buildId: buildId &#124;&#124; 'unknown',</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 44 | <code>    builtAt: builtAt &#124;&#124; 'unknown',</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 45 | <code>    revision: normalized(process.env.K_REVISION) &#124;&#124; null,</code> | EXPECTED: Builds configuration/build readiness and revision metadata; does not claim dependency success. |
| 46 | <code>  };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 47 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 48 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 49 | <code>export async function checkSupabaseHealth(timeoutMs = 2500): Promise&lt;DependencyHealth&gt; {</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 50 | <code>  const url = normalized(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, '');</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 51 | <code>  const anonKey = normalized(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 52 | <code>  const started = Date.now();</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 53 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 54 | <code>  if (!url &#124;&#124; !anonKey) {</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 55 | <code>    return {</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 56 | <code>      ok: false,</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 57 | <code>      status: null,</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 58 | <code>      latencyMs: Date.now() - started,</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 59 | <code>      error: 'missing_configuration',</code> | EXPECTED: Returns a truthful unavailable result when public Supabase configuration is absent. |
| 60 | <code>    };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 61 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 62 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 63 | <code>  try {</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 64 | <code>    const response = await fetch(&#96;${url}/auth/v1/settings&#96;, {</code> | LIMIT: probes Supabase Auth settings, not SQL/PostgREST reads, RLS, Storage or privileged database access. |
| 65 | <code>      method: 'GET',</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 66 | <code>      headers: {</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 67 | <code>        apikey: anonKey,</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 68 | <code>        Authorization: &#96;Bearer ${anonKey}&#96;,</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 69 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 70 | <code>      cache: 'no-store',</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 71 | <code>      signal: AbortSignal.timeout(timeoutMs),</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 72 | <code>    });</code> | EXPECTED: Performs a bounded, uncached, read-only Auth-settings request using the public key. |
| 73 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 74 | <code>    return {</code> | EXPECTED: Preserves HTTP status and elapsed request time; only successful HTTP statuses pass. |
| 75 | <code>      ok: response.ok,</code> | EXPECTED: Preserves HTTP status and elapsed request time; only successful HTTP statuses pass. |
| 76 | <code>      status: response.status,</code> | EXPECTED: Preserves HTTP status and elapsed request time; only successful HTTP statuses pass. |
| 77 | <code>      latencyMs: Date.now() - started,</code> | EXPECTED: Preserves HTTP status and elapsed request time; only successful HTTP statuses pass. |
| 78 | <code>      ...(response.ok ? {} : { error: 'non_success_status' }),</code> | EXPECTED: Preserves HTTP status and elapsed request time; only successful HTTP statuses pass. |
| 79 | <code>    };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 80 | <code>  } catch (error) {</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 81 | <code>    return {</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 82 | <code>      ok: false,</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 83 | <code>      status: null,</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 84 | <code>      latencyMs: Date.now() - started,</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 85 | <code>      error: error instanceof Error ? error.name : 'request_failed',</code> | EXPECTED: Catches request failures and returns safe error class plus latency without credentials. |
| 86 | <code>    };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 87 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 88 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## lib/health/public-runtime-service.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>/** Shared website code reports the deployed service, never a request Host header. */</code> | EXPECTED: explanatory comment; does not execute. |
| 2 | <code>export function getPublicRuntimeService(</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 3 | <code>  env: Readonly&lt;Record&lt;string, string &#124; undefined&gt;&gt; = process.env,</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 4 | <code>): 'marketing' &#124; 'store' {</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 5 | <code>  // Cloud Run supplies K_SERVICE. Explicit Marketing identity takes precedence</code> | EXPECTED: explanatory comment; does not execute. |
| 6 | <code>  // over a stale Store flag so the public website cannot mislabel itself.</code> | EXPECTED: explanatory comment; does not execute. |
| 7 | <code>  if (env.K_SERVICE === 'elevate-marketing-migration') return 'marketing';</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 8 | <code>  if (env.K_SERVICE === 'elevate-store-migration') return 'store';</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 9 | <code>  return env.STORE_ONLY_RUNTIME === 'true' ? 'store' : 'marketing';</code> | EXPECTED: resolves Store/Marketing identity from Cloud Run service or explicit local flag, not caller Host. |
| 10 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/lms/app/api/ping/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>/**</code> | EXPECTED: explanatory comment; does not execute. |
| 2 | <code> * GET /api/ping</code> | EXPECTED: explanatory comment; does not execute. |
| 3 | <code> *</code> | EXPECTED: explanatory comment; does not execute. |
| 4 | <code> * Liveness probe - verifies the process is alive, node is running,</code> | EXPECTED: explanatory comment; does not execute. |
| 5 | <code> * and the container is alive. NO database checks.</code> | EXPECTED: explanatory comment; does not execute. |
| 6 | <code> */</code> | EXPECTED: explanatory comment; does not execute. |
| 7 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 8 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 9 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 10 | <code>export const runtime = 'nodejs';</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 11 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 12 | <code>export const revalidate = 0;</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 13 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 14 | <code>export async function GET() {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 15 | <code>  return NextResponse.json(</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 16 | <code>    {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 17 | <code>      ok: true,</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 18 | <code>      service: 'lms',</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 19 | <code>      commit:</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 20 | <code>        process.env.GITHUB_SHA ??</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 21 | <code>        process.env.GIT_SHA ??</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 22 | <code>        process.env.NEXT_PUBLIC_GIT_SHA ??</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 23 | <code>        'unknown',</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 24 | <code>      uptime: Math.floor(process.uptime()),</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 25 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 26 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 27 | <code>    {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 28 | <code>      status: 200,</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 29 | <code>      headers: {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 30 | <code>        'Cache-Control': 'no-store',</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 31 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 32 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 33 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 34 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/lms/app/api/ready/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 2 | <code>import { getRuntimeReadiness } from '@/lib/health/service-health';</code> | EXPECTED: imports the dependency used by this module. |
| 3 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 4 | <code>export const runtime = 'nodejs';</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 5 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 6 | <code>export const revalidate = 0;</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 7 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 8 | <code>export async function GET() {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 9 | <code>  const readiness = getRuntimeReadiness();</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 10 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 11 | <code>  return NextResponse.json(</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 12 | <code>    {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 13 | <code>      service: 'lms',</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 14 | <code>      ready: readiness.ready,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 15 | <code>      status: readiness.ready ? 'ready' : 'not_ready',</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 16 | <code>      commit: readiness.commit,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 17 | <code>      buildId: readiness.buildId,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 18 | <code>      builtAt: readiness.builtAt,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 19 | <code>      missing: readiness.missing,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 20 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 21 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 22 | <code>    {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 23 | <code>      status: readiness.ready ? 200 : 503,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 24 | <code>      headers: { 'Cache-Control': 'no-store' },</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 25 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 26 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 27 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/lms/app/api/health/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>/**</code> | EXPECTED: explanatory comment; does not execute. |
| 2 | <code> * GET /api/health</code> | EXPECTED: explanatory comment; does not execute. |
| 3 | <code> *</code> | EXPECTED: explanatory comment; does not execute. |
| 4 | <code> * Dependency-aware service health. Container readiness uses /api/ready so a</code> | EXPECTED: explanatory comment; does not execute. |
| 5 | <code> * downstream outage is reported truthfully without evicting every runnable pod.</code> | EXPECTED: explanatory comment; does not execute. |
| 6 | <code> */</code> | EXPECTED: explanatory comment; does not execute. |
| 7 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 8 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 9 | <code>import { checkSupabaseHealth, getRuntimeReadiness } from '@/lib/health/service-health';</code> | EXPECTED: imports the dependency used by this module. |
| 10 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 11 | <code>export const runtime = 'nodejs';</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 12 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 13 | <code>export const revalidate = 0;</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 14 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 15 | <code>export async function GET() {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 16 | <code>  const readiness = getRuntimeReadiness();</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 17 | <code>  const supabase = await checkSupabaseHealth();</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 18 | <code>  const healthy = readiness.ready &amp;&amp; supabase.ok;</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 19 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 20 | <code>  return NextResponse.json(</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 21 | <code>    {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 22 | <code>      service: 'lms',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 23 | <code>      status: healthy ? 'healthy' : readiness.ready ? 'degraded' : 'unhealthy',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 24 | <code>      healthy,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 25 | <code>      ready: readiness.ready,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 26 | <code>      canonicalDashboard: '/lms/dashboard',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 27 | <code>      healthContract: 'lms-v4',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 28 | <code>      commit: readiness.commit,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 29 | <code>      revision: readiness.revision,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 30 | <code>      buildId: readiness.buildId,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 31 | <code>      builtAt: readiness.builtAt,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 32 | <code>      configuration: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 33 | <code>        ok: readiness.ready,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 34 | <code>        missing: readiness.missing,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 35 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 36 | <code>      dependencies: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 37 | <code>        supabase,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 38 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 39 | <code>      environment: process.env.NODE_ENV,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 40 | <code>      uptime: Math.floor(process.uptime()),</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 41 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 42 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 43 | <code>    {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 44 | <code>      status: healthy ? 200 : 503,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 45 | <code>      headers: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 46 | <code>        'Cache-Control': 'no-store',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 47 | <code>        'X-EFH-Service': 'lms',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 48 | <code>        'X-EFH-Commit': readiness.commit,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 49 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 50 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 51 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 52 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/marketing/app/api/ping/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>/**</code> | EXPECTED: explanatory comment; does not execute. |
| 2 | <code> * GET /api/ping</code> | EXPECTED: explanatory comment; does not execute. |
| 3 | <code> *</code> | EXPECTED: explanatory comment; does not execute. |
| 4 | <code> * Liveness probe - verifies the process is alive, node is running,</code> | EXPECTED: explanatory comment; does not execute. |
| 5 | <code> * and the container is alive. NO database checks.</code> | EXPECTED: explanatory comment; does not execute. |
| 6 | <code> */</code> | EXPECTED: explanatory comment; does not execute. |
| 7 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 8 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 9 | <code>import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';</code> | EXPECTED: imports the dependency used by this module. |
| 10 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 11 | <code>export const runtime = 'nodejs';</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 12 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 13 | <code>export const revalidate = 0;</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 14 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 15 | <code>export async function GET() {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 16 | <code>  return NextResponse.json(</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 17 | <code>    {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 18 | <code>      ok: true,</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 19 | <code>      service: getPublicRuntimeService(),</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 20 | <code>      commit: process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? 'unknown',</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 21 | <code>      uptime: Math.floor(process.uptime()),</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 22 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 23 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 24 | <code>    {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 25 | <code>      status: 200,</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 26 | <code>      headers: {</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 27 | <code>        'Cache-Control': 'no-store',</code> | EXPECTED: liveness response uses no dependency request; reports identity, build and process uptime without caching. |
| 28 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 29 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 30 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 31 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/marketing/app/api/ready/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 2 | <code>import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';</code> | EXPECTED: imports the dependency used by this module. |
| 3 | <code>import { getRuntimeReadiness } from '@/lib/health/service-health';</code> | EXPECTED: imports the dependency used by this module. |
| 4 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 5 | <code>export const runtime = 'nodejs';</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 6 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 7 | <code>export const revalidate = 0;</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 8 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 9 | <code>export async function GET() {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 10 | <code>  const readiness = getRuntimeReadiness();</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 11 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 12 | <code>  return NextResponse.json(</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 13 | <code>    {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 14 | <code>      service: getPublicRuntimeService(),</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 15 | <code>      ready: readiness.ready,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 16 | <code>      status: readiness.ready ? 'ready' : 'not_ready',</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 17 | <code>      commit: readiness.commit,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 18 | <code>      buildId: readiness.buildId,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 19 | <code>      builtAt: readiness.builtAt,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 20 | <code>      missing: readiness.missing,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 21 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 22 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 23 | <code>    {</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 24 | <code>      status: readiness.ready ? 200 : 503,</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 25 | <code>      headers: { 'Cache-Control': 'no-store' },</code> | EXPECTED: reports configuration readiness and missing variable names; returns 503 when required configuration is absent. |
| 26 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 27 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 28 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## apps/marketing/app/api/health/route.ts

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>/**</code> | EXPECTED: explanatory comment; does not execute. |
| 2 | <code> * GET /api/health</code> | EXPECTED: explanatory comment; does not execute. |
| 3 | <code> *</code> | EXPECTED: explanatory comment; does not execute. |
| 4 | <code> * Dependency-aware service health. Container readiness uses /api/ready so a</code> | EXPECTED: explanatory comment; does not execute. |
| 5 | <code> * downstream outage is reported truthfully without evicting every runnable pod.</code> | EXPECTED: explanatory comment; does not execute. |
| 6 | <code> */</code> | EXPECTED: explanatory comment; does not execute. |
| 7 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 8 | <code>import { NextResponse } from 'next/server';</code> | EXPECTED: imports the dependency used by this module. |
| 9 | <code>import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';</code> | EXPECTED: imports the dependency used by this module. |
| 10 | <code>import { checkSupabaseHealth, getRuntimeReadiness } from '@/lib/health/service-health';</code> | EXPECTED: imports the dependency used by this module. |
| 11 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 12 | <code>export const runtime = 'nodejs';</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 13 | <code>export const dynamic = 'force-dynamic';</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 14 | <code>export const revalidate = 0;</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 15 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 16 | <code>export async function GET() {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 17 | <code>  const readiness = getRuntimeReadiness();</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 18 | <code>  const supabase = await checkSupabaseHealth();</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 19 | <code>  const healthy = readiness.ready &amp;&amp; supabase.ok;</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 20 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 21 | <code>  return NextResponse.json(</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 22 | <code>    {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 23 | <code>      service: getPublicRuntimeService(),</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 24 | <code>      status: healthy ? 'healthy' : readiness.ready ? 'degraded' : 'unhealthy',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 25 | <code>      healthy,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 26 | <code>      ready: readiness.ready,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 27 | <code>      healthContract: &#96;${getPublicRuntimeService()}-v4&#96;,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 28 | <code>      commit: readiness.commit,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 29 | <code>      revision: readiness.revision,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 30 | <code>      github: process.env.GITHUB_SHA ?? 'unknown',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 31 | <code>      publicCommit: process.env.NEXT_PUBLIC_GIT_SHA ?? 'unknown',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 32 | <code>      buildId: readiness.buildId,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 33 | <code>      buildTime: readiness.builtAt,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 34 | <code>      configuration: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 35 | <code>        ok: readiness.ready,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 36 | <code>        missing: readiness.missing,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 37 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 38 | <code>      dependencies: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 39 | <code>        supabase,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 40 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 41 | <code>      nodeEnv: process.env.NODE_ENV,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 42 | <code>      uptime: Math.floor(process.uptime()),</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 43 | <code>      timestamp: new Date().toISOString(),</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 44 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 45 | <code>    {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 46 | <code>      status: healthy ? 200 : 503,</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 47 | <code>      headers: {</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 48 | <code>        'Cache-Control': 'no-store',</code> | EXPECTED: combines configuration readiness and bounded Supabase dependency result; truthful 200/503 with no-store. |
| 49 | <code>      },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 50 | <code>    },</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 51 | <code>  );</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 52 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## scripts/gcp/verify-public-health.mjs

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>import { pathToFileURL } from 'node:url';</code> | EXPECTED: imports the dependency used by this module. |
| 2 | <code>import { healthPassed } from './audit-runtime-parity.mjs';</code> | EXPECTED: imports the dependency used by this module. |
| 3 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 4 | <code>export const sites = {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 5 | <code>  marketing: 'https://www.elevateforhumanity.org',</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 6 | <code>  admin: 'https://admin.elevateforhumanity.org',</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 7 | <code>  lms: 'https://app.elevateforhumanity.org',</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 8 | <code>  store: 'https://store.elevateforhumanity.org',</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 9 | <code>};</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 10 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 11 | <code>export async function verifySite(component, request = fetch) {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 12 | <code>  const base = sites[component];</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 13 | <code>  if (!base) throw new Error('Unknown public service');</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 14 | <code>  const processService = component;</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 15 | <code>  const results = [];</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 16 | <code>  for (const path of ['/api/ping', '/api/health', '/api/ready']) {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 17 | <code>    try {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 18 | <code>      const r = await request(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 19 | <code>      const body = await r.json();</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 20 | <code>      const passed = path === '/api/ping'</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 21 | <code>        ? r.status === 200 &amp;&amp; body.ok === true &amp;&amp; body.service === processService</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 22 | <code>        : healthPassed(processService, path, r.status, body);</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 23 | <code>      results.push({ component, path, status: r.status, passed,</code> | FINDING: output drops dependency error/status/latency and revision/configuration detail needed to diagnose a historical 503. |
| 24 | <code>        commit: /^[a-f0-9]{40}$/.test(body.commit ?? '') ? body.commit : undefined });</code> | LIMIT: commit is recorded when valid; monitoring does not compare it against a required deployed commit. |
| 25 | <code>    } catch { results.push({ component, path, passed: false, error: 'probe_failed' }); }</code> | FINDING: timeout, network, malformed JSON and other exceptions collapse into probe_failed. |
| 26 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 27 | <code>  if (component === 'marketing') {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 28 | <code>    try {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 29 | <code>      const r = await request(base + '/api/health/quickbooks', { redirect: 'manual', signal: AbortSignal.timeout(20000) });</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 30 | <code>      const body = await r.json();</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 31 | <code>      results.push({ component, path: '/api/health/quickbooks', status: r.status,</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 32 | <code>        passed: r.status === 200 &amp;&amp; body.ready === true &amp;&amp; body.connected === true &amp;&amp;</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 33 | <code>          body.configured === true &amp;&amp; body.webhookVerifierConfigured === true });</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 34 | <code>    } catch { results.push({ component, path: '/api/health/quickbooks', passed: false, error: 'probe_failed' }); }</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 35 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 36 | <code>  return results;</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 37 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 38 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 39 | <code>export async function main() {</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 40 | <code>  const results = (await Promise.all(Object.keys(sites).map(component =&gt; verifySite(component)))).flat();</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 41 | <code>  console.log(JSON.stringify({ results, passed: results.every(x =&gt; x.passed) }));</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 42 | <code>  if (results.some(x =&gt; !x.passed)) process.exitCode = 1;</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 43 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 44 | <code>if (process.argv[1] &amp;&amp; import.meta.url === pathToFileURL(process.argv[1]).href)</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |
| 45 | <code>  main().catch(() =&gt; { console.error('Google public health verification failed.'); process.exitCode = 1; });</code> | EXPECTED: checks configured public-service identity and required health flags; records failure instead of silently accepting it. |

## scripts/gcp/verify-runtime-readiness.mjs

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>import { healthPassed } from './audit-runtime-parity.mjs';</code> | EXPECTED: imports the dependency used by this module. |
| 2 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 3 | <code>export async function verifyRuntimeReadiness(component, base, token, { request = fetch, pause = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)), attempts = 8 } = {}) {</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 4 | <code>  const url = new URL(base);</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 5 | <code>  if (url.protocol !== 'https:' &#124;&#124; !url.hostname.endsWith('.run.app') &#124;&#124; url.username &#124;&#124; url.password &#124;&#124; url.search &#124;&#124; url.hash &#124;&#124; url.pathname !== '/') throw new Error('Invalid Google runtime URL');</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 6 | <code>  if (!['marketing', 'admin', 'lms', 'store'].includes(component)) throw new Error('Unknown Google service');</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 7 | <code>  if (!Number.isInteger(attempts) &#124;&#124; attempts &lt; 1 &#124;&#124; attempts &gt; 8) throw new Error('Invalid readiness attempt budget');</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 8 | <code>  const processService = component;</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 9 | <code>  for (const path of ['/api/health', '/api/ready']) {</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 10 | <code>    let passed = false;</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 11 | <code>    for (let attempt = 1; attempt &lt;= attempts; attempt++) {</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 12 | <code>      let status;</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 13 | <code>      try {</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 14 | <code>        const response = await request(new URL(path, url), { headers: { 'X-Serverless-Authorization': &#96;Bearer ${token}&#96; }, redirect: 'manual', signal: AbortSignal.timeout(15000) });</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 15 | <code>        status = response.status;</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 16 | <code>        const body = await response.json().catch(() =&gt; ({}));</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 17 | <code>        passed = healthPassed(processService, path, status, body);</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 18 | <code>      } catch { /* Network/cold-start errors consume the same bounded attempt budget. */ }</code> | FINDING: exhausted network/cold-start attempts retain no diagnostic cause. |
| 19 | <code>      if (passed) break;</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 20 | <code>      if (status &amp;&amp; status !== 200 &amp;&amp; ![429, 500, 502, 503, 504].includes(status)) throw new Error('Google readiness rejected request');</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 21 | <code>      if (attempt &lt; attempts) await pause(5000);</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 22 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 23 | <code>    if (!passed) throw new Error('Google runtime readiness budget exhausted');</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 24 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 25 | <code>  return { component, passed: true };</code> | EXPECTED: validates Google endpoint/service, applies bounded retry budget, and requires both health and readiness. |
| 26 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

## scripts/gcp/activate-tested-public-revision.mjs

| Line | Exact source | Audit |
|---:|---|---|
| 1 | <code>import { google } from './runtime-config.mjs';</code> | EXPECTED: imports the dependency used by this module. |
| 2 | <code>import { pathToFileURL } from 'node:url';</code> | EXPECTED: imports the dependency used by this module. |
| 3 | <code>const project='elegant-racer-299721',region=process.env.CANDIDATE_REGION&#124;&#124;'us-central1';</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 4 | <code>if(!['us-central1','us-east1'].includes(region))throw Error('Unsupported public runtime region');</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 5 | <code>function gcloud(args){const result=google([...args,'--project='+project,'--format=json']);return result.trim()?JSON.parse(result):{};}</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 6 | <code>function trafficRows(state) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 7 | <code>  return [...(state.spec?.traffic &#124;&#124; []), ...(state.status?.traffic &#124;&#124; [])].map(item =&gt; ({</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 8 | <code>    ...item, revisionName: item.revisionName &#124;&#124; (item.latestRevision ? state.status?.latestCreatedRevisionName : undefined),</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 9 | <code>  }));</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 10 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 11 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 12 | <code>export function unusedCandidateTags(state, exceptTag, protectedRevisions = []) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 13 | <code>  const rows = trafficRows(state);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 14 | <code>  const serving = new Set(rows.filter(item =&gt; item.percent &gt; 0).map(item =&gt; item.revisionName));</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 15 | <code>  const protectedNames = new Set(protectedRevisions);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 16 | <code>  const tags = new Map();</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 17 | <code>  // startup-gen2 is the temporary test tag created by recover-startup-runtime.mjs.</code> | EXPECTED: explanatory comment; does not execute. |
| 18 | <code>  for (const item of rows) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 19 | <code>    if ((!/^c-[a-f0-9]{12}$/.test(item.tag &#124;&#124; '') &amp;&amp; item.tag !== 'startup-gen2') &#124;&#124; !item.revisionName) continue;</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 20 | <code>    const revisions = tags.get(item.tag) &#124;&#124; new Set();</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 21 | <code>    revisions.add(item.revisionName);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 22 | <code>    tags.set(item.tag, revisions);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 23 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 24 | <code>  return [...tags].filter(([tag, revisions]) =&gt; tag !== exceptTag &amp;&amp; revisions.size === 1 &amp;&amp;</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 25 | <code>    ![...revisions].some(name =&gt; serving.has(name) &#124;&#124; protectedNames.has(name)),</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 26 | <code>  ).map(([tag]) =&gt; tag);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 27 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 28 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 29 | <code>function servingTraffic(state) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 30 | <code>  const totals = new Map();</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 31 | <code>  for (const item of state.status?.traffic &#124;&#124; []) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 32 | <code>    if (item.percent &gt; 0) totals.set(item.revisionName, (totals.get(item.revisionName) &#124;&#124; 0) + item.percent);</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 33 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 34 | <code>  return [...totals].sort(([a], [b]) =&gt; a.localeCompare(b));</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 35 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 36 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 37 | <code>function assertTrafficUnchanged(before, after) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 38 | <code>  if (JSON.stringify(servingTraffic(before)) !== JSON.stringify(servingTraffic(after))) {</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 39 | <code>    throw Error('Serving traffic changed concurrently; activation stopped');</code> | EXPECTED: Reads serving traffic and refuses concurrent traffic changes. |
| 40 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 41 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 42 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 43 | <code>/**</code> | EXPECTED: explanatory comment; does not execute. |
| 44 | <code> * Release generated, zero-traffic candidate aliases before Cloud Run creates</code> | EXPECTED: explanatory comment; does not execute. |
| 45 | <code> * another revision. The alias is temporary; the revision remains available.</code> | EXPECTED: explanatory comment; does not execute. |
| 46 | <code> */</code> | EXPECTED: explanatory comment; does not execute. |
| 47 | <code>export async function cleanupUnusedCandidateTags({</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 48 | <code>  service, read = gcloud,</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 49 | <code>}) {</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 50 | <code>  if (!/^elevate-(?:admin&#124;lms&#124;marketing&#124;store)-migration$/.test(service &#124;&#124; '')) {</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 51 | <code>    throw Error('Exact managed Cloud Run service required');</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 52 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 53 | <code>  const describe = () =&gt; read(['run', 'services', 'describe', service, '--region=' + region]);</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 54 | <code>  const update = (...flags) =&gt; read(['run', 'services', 'update-traffic', service, '--region=' + region, ...flags, '--quiet']);</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 55 | <code>  const before = describe();</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 56 | <code>  if (servingTraffic(before).reduce((sum, [, percent]) =&gt; sum + percent, 0) !== 100) {</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 57 | <code>    throw Error('Existing serving traffic must be fully resolved before candidate cleanup');</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 58 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 59 | <code>  // Do not protect latestCreatedRevisionName here: after a failed deploy that</code> | EXPECTED: explanatory comment; does not execute. |
| 60 | <code>  // points at the zero-traffic candidate keeping regional resources allocated.</code> | EXPECTED: explanatory comment; does not execute. |
| 61 | <code>  // Candidate tags are temporary; rollback revisions and custom tags are kept.</code> | EXPECTED: explanatory comment; does not execute. |
| 62 | <code>  const staleTags = unusedCandidateTags(before);</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 63 | <code>  if (!staleTags.length) return { service, removedCandidateTags: [] };</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 64 | <code>  update('--remove-tags=' + staleTags.join(','));</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 65 | <code>  const after = describe();</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 66 | <code>  assertTrafficUnchanged(before, after);</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 67 | <code>  if (trafficRows(after).some(item =&gt; staleTags.includes(item.tag))) {</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 68 | <code>    throw Error('Stale candidate tags remain after cleanup');</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 69 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 70 | <code>  return { service, removedCandidateTags: staleTags };</code> | EXPECTED: Removes only unused generated candidate tags; preserves serving traffic and rollback revisions. |
| 71 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 72 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 73 | <code>export async function activateTestedRevision({</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 74 | <code>  service, revision, commit, read = gcloud, fetcher = fetch, attempts = 12,</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 75 | <code>  pause = () =&gt; new Promise(resolve =&gt; setTimeout(resolve, 2000)),</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 76 | <code>}) {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 77 | <code>  const services = {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 78 | <code>    'elevate-marketing-migration': 'marketing',</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 79 | <code>    'elevate-store-migration': 'store',</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 80 | <code>    'elevate-admin-migration': 'admin',</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 81 | <code>    'elevate-lms-migration': 'lms',</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 82 | <code>  };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 83 | <code>  if (!Object.hasOwn(services, service) &#124;&#124; !new RegExp('^' + service + '-[a-z0-9-]+$').test(revision &#124;&#124; '') &#124;&#124; !/^[a-f0-9]{40}$/.test(commit &#124;&#124; '')) {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 84 | <code>    throw Error('Exact service, revision and immutable commit required');</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 85 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 86 | <code>  const metadata = read(['run', 'revisions', 'describe', revision, '--region=' + region]);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 87 | <code>  if (!/@sha256:[a-f0-9]{64}$/.test(metadata.spec?.containers?.[0]?.image &#124;&#124; '')) throw Error('Candidate image must be immutable');</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 88 | <code>  const describe = () =&gt; read(['run', 'services', 'describe', service, '--region=' + region]);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 89 | <code>  const update = (...flags) =&gt; read(['run', 'services', 'update-traffic', service, '--region=' + region, ...flags, '--quiet']);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 90 | <code>  const before = describe();</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 91 | <code>  if (servingTraffic(before).reduce((sum, [, percent]) =&gt; sum + percent, 0) !== 100) {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 92 | <code>    throw Error('Existing serving traffic must be fully resolved before activation');</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 93 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 94 | <code>  const tag = 'c-' + commit.slice(0, 12);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 95 | <code>  // Revision-level minimum instances also run for zero-percent tagged revisions.</code> | EXPECTED: explanatory comment; does not execute. |
| 96 | <code>  // Keep images for rollback, custom tags, serving/requested traffic, and a newer</code> | EXPECTED: explanatory comment; does not execute. |
| 97 | <code>  // release's latest revision. Ambiguous spec/status mappings are never removed.</code> | EXPECTED: explanatory comment; does not execute. |
| 98 | <code>  const obsoleteTags = unusedCandidateTags(before, tag, [revision, before.status?.latestCreatedRevisionName]);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 99 | <code>  const releaseFailedTag = () =&gt; {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 100 | <code>    const current = describe();</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 101 | <code>    const mappings = trafficRows(current).filter(item =&gt; item.tag === tag);</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 102 | <code>    if (mappings.length &amp;&amp; mappings.every(item =&gt; item.revisionName === revision) &amp;&amp; unusedCandidateTags(current).includes(tag)) {</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 103 | <code>      update('--remove-tags=' + tag);</code> | CONFIRMED CLEANUP FAILURE: same run could not remove its failed candidate tag because Google again reported quota_exceeded. |
| 104 | <code>      assertTrafficUnchanged(current, describe());</code> | EXPECTED: Validates immutable candidate identity and prepares safe tag cleanup. |
| 105 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 106 | <code>  };</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 107 | <code>  try {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 108 | <code>    // A pinned latest-ready revision is not proof that this exact candidate works.</code> | EXPECTED: explanatory comment; does not execute. |
| 109 | <code>    update(...(obsoleteTags.length ? ['--remove-tags=' + obsoleteTags.join(',')] : []), '--update-tags=' + tag + '=' + revision);</code> | CONFIRMED FAILURE LOCATION: latest LMS release failed adding the candidate tag; Google classified quota_exceeded before candidate HTTP health ran. |
| 110 | <code>    const tagged = describe();</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 111 | <code>    assertTrafficUnchanged(before, tagged);</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 112 | <code>    const candidate = tagged.status?.traffic?.find(item =&gt; item.tag === tag &amp;&amp; item.revisionName === revision);</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 113 | <code>    if (!candidate?.url &#124;&#124; new URL(candidate.url).protocol !== 'https:' &#124;&#124; !new URL(candidate.url).hostname.endsWith('.run.app')) {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 114 | <code>      throw Error('Google candidate URL unavailable; public traffic unchanged');</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 115 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 116 | <code>    let passed = false;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 117 | <code>    for (let attempt = 0; attempt &lt; attempts; attempt++) {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 118 | <code>      try {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 119 | <code>        const response = await fetcher(candidate.url + '/api/health', {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 120 | <code>          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 121 | <code>        });</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 122 | <code>        const state = await response.json();</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 123 | <code>        if (response.ok &amp;&amp; state &amp;&amp; typeof state === 'object') {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 124 | <code>          const actual = state.commitSha &#124;&#124; state.commit &#124;&#124; state.sha;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 125 | <code>          if (actual !== commit) throw Error('Candidate served wrong immutable commit');</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 126 | <code>          if (state.revision === revision &amp;&amp; state.service === services[service] &amp;&amp; state.healthy === true &amp;&amp; state.ready === true &amp;&amp;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 127 | <code>              state.configuration?.ok === true &amp;&amp; state.dependencies?.supabase?.ok === true) {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 128 | <code>            passed = true;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 129 | <code>            break;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 130 | <code>          }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 131 | <code>        }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 132 | <code>      } catch (error) {</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 133 | <code>        if (error.message === 'Candidate served wrong immutable commit') throw error;</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 134 | <code>      }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 135 | <code>      if (attempt + 1 &lt; attempts) await pause();</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 136 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 137 | <code>    if (!passed) throw Error('Exact candidate failed runtime health; public traffic unchanged');</code> | EXPECTED: Tests the exact tagged candidate, expected commit, service, revision, configuration and dependency health. |
| 138 | <code>    const current = describe();</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 139 | <code>    assertTrafficUnchanged(before, current);</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 140 | <code>    if (current.status?.latestCreatedRevisionName !== before.status?.latestCreatedRevisionName) {</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 141 | <code>      throw Error('Newer revision created concurrently; activation stopped');</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 142 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 143 | <code>    update('--to-revisions=' + revision + '=100');</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 144 | <code>    const after = describe();</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 145 | <code>    if (JSON.stringify(servingTraffic(after)) !== JSON.stringify([[revision, 100]])) {</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 146 | <code>      throw Error('Exact candidate traffic assignment not confirmed');</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 147 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 148 | <code>    // After verified promotion, the formerly serving generated/startup test tag</code> | EXPECTED: explanatory comment; does not execute. |
| 149 | <code>    // can be released without deleting its rollback revision.</code> | EXPECTED: explanatory comment; does not execute. |
| 150 | <code>    const retiredTags = unusedCandidateTags(after, tag, [after.status?.latestCreatedRevisionName]);</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 151 | <code>    if (retiredTags.length) {</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 152 | <code>      update('--remove-tags=' + retiredTags.join(','));</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 153 | <code>      assertTrafficUnchanged(after, describe());</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 154 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 155 | <code>    return { service, revision, commit, candidateUrl: candidate.url, candidateHealthy: true, traffic: 100,</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 156 | <code>      retiredCandidateTags: [...new Set([...obsoleteTags, ...retiredTags])] };</code> | EXPECTED: Checks concurrency, promotes only verified candidate to 100%, confirms traffic and releases retired generated tags. |
| 157 | <code>  } catch (error) {</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 158 | <code>    // Cloud Run can apply the tag even when the command subsequently reports a</code> | EXPECTED: explanatory comment; does not execute. |
| 159 | <code>    // startup/quota failure. Read it back and release only our non-serving tag.</code> | EXPECTED: explanatory comment; does not execute. |
| 160 | <code>    try { releaseFailedTag(); } catch (cleanupError) {</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 161 | <code>      throw new AggregateError([error, cleanupError], error.message + '; candidate tag cleanup also needs retry');</code> | EXPECTED: preserves both activation and cleanup failures; does not claim successful promotion. |
| 162 | <code>    }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 163 | <code>    throw error;</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 164 | <code>  }</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 165 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |
| 166 | <code>(blank)</code> | EXPECTED: blank separator; no runtime operation. |
| 167 | <code>if (process.argv[1] &amp;&amp; import.meta.url === pathToFileURL(process.argv[1]).href) {</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 168 | <code>  console.log(JSON.stringify(await activateTestedRevision({</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 169 | <code>    service: process.env.CANDIDATE_SERVICE &#124;&#124; 'elevate-marketing-migration',</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 170 | <code>    revision: process.env.CANDIDATE_REVISION,</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 171 | <code>    commit: process.env.IMAGE_SHA &#124;&#124; process.env.GITHUB_SHA,</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 172 | <code>  })));</code> | EXPECTED: Preserves errors, attempts safe cleanup, and exposes the CLI entry point. |
| 173 | <code>}</code> | EXPECTED: closes or separates the surrounding reviewed block. |

