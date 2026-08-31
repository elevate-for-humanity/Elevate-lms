/**
 * lib/industry/onet.ts
 *
 * O*NET Web Services v1 client (legacy — prefer lib/onet/client.ts v2).
 *
 * O*NET is the US Department of Labor's occupational information database.
 * It publishes authoritative job tasks, skills, knowledge, abilities, and
 * work activities for every SOC-coded occupation.
 *
 * Free account required: https://services.onetcenter.org/
 * Set ONET_API_KEY or ONET_USERNAME/ONET_PASSWORD in environment.
 *
 * Rate limit: 1 req/sec on free tier. This client adds a 1.1s delay between
 * calls when fetching multiple endpoints for the same SOC code.
 *
 * API docs: https://services.onetcenter.org/reference/
 */
import 'server-only';

// Canonical SOC map lives in lib/onet/soc-map.ts — import from there for program→SOC lookups.
export { PROGRAM_SOC_CODES } from '@/lib/onet/soc-map';

const BASE = 'https://services.onetcenter.org/ws';

export interface OnetTask {
  task: string;
  importance: number; // 0–100
  frequency: number; // 0–100
  task_type: 'core' | 'supplemental';
}

export interface OnetSkill {
  name: string;
  importance: number;
  level: number;
}

export interface OnetKnowledge {
  name: string;
  importance: number;
}

export interface OnetAbility {
  name: string;
  importance: number;
}

export interface OnetWorkActivity {
  name: string;
  importance: number;
}

export interface OnetTechnologySkill {
  name: string;
  hot_technology: boolean;
}

export interface OnetEducation {
  typical_level: string;
  distribution: { level: string; pct: number }[];
}

export interface OnetOccupation {
  soc_code: string;
  title: string;
  description: string;
  tasks: OnetTask[];
  skills: OnetSkill[];
  knowledge: OnetKnowledge[];
  abilities: OnetAbility[];
  work_activities: OnetWorkActivity[];
  technology_skills: OnetTechnologySkill[];
  education: OnetEducation;
}

function authHeaders(): Record<string, string> {
  const apiKey = process.env.ONET_API_KEY;
  if (apiKey) return { 'X-API-Key': apiKey };
  const user = process.env.ONET_USERNAME;
  const pass = process.env.ONET_PASSWORD;
  if (!user || !pass) throw new Error('ONET_API_KEY or ONET_USERNAME/ONET_PASSWORD must be set');
  return { Authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') };
}

async function onetGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...authHeaders(),
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 0 }, // always fresh — we cache in Supabase
  });
  if (!res.ok) throw new Error(`O*NET ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch all occupation data for a SOC code (e.g. '21-1093.00'). */
export async function fetchOnetOccupation(socCode: string): Promise<OnetOccupation> {
  const code = socCode.replace('/', '.'); // normalise

  // Fetch summary first to get title + description
  const summary = await onetGet<any>(`/online/occupations/${code}/summary`);
  await sleep(1100);

  const tasks = await onetGet<any>(`/online/occupations/${code}/details/tasks`);
  await sleep(1100);

  const skills = await onetGet<any>(`/online/occupations/${code}/details/skills`);
  await sleep(1100);

  const knowledge = await onetGet<any>(`/online/occupations/${code}/details/knowledge`);
  await sleep(1100);

  const abilities = await onetGet<any>(`/online/occupations/${code}/details/abilities`);
  await sleep(1100);

  const workActivities = await onetGet<any>(`/online/occupations/${code}/details/work_activities`);
  await sleep(1100);

  const techSkills = await onetGet<any>(
    `/online/occupations/${code}/details/technology_skills`,
  ).catch(() => ({ category: [] }));
  await sleep(1100);

  const education = await onetGet<any>(
    `/online/occupations/${code}/details/education_training_experience`,
  ).catch(() => null);

  return {
    soc_code: code,
    title: summary.occupation?.title ?? '',
    description: summary.occupation?.description ?? '',

    tasks: (tasks.task ?? []).map((t: any) => ({
      task: t.statement ?? t.task ?? '',
      importance: Math.round(((t.importance?.value ?? 0) * 100) / 5),
      frequency: Math.round(((t.frequency?.value ?? 0) * 100) / 5),
      task_type: t.task_type === 'Core' ? 'core' : 'supplemental',
    })),

    skills: (skills.element ?? []).map((s: any) => ({
      name: s.name ?? '',
      importance: Math.round(((s.importance?.value ?? 0) * 100) / 5),
      level: Math.round(((s.level?.value ?? 0) * 100) / 7),
    })),

    knowledge: (knowledge.element ?? []).map((k: any) => ({
      name: k.name ?? '',
      importance: Math.round(((k.importance?.value ?? 0) * 100) / 5),
    })),

    abilities: (abilities.element ?? []).map((a: any) => ({
      name: a.name ?? '',
      importance: Math.round(((a.importance?.value ?? 0) * 100) / 5),
    })),

    work_activities: (workActivities.element ?? []).map((w: any) => ({
      name: w.name ?? '',
      importance: Math.round(((w.importance?.value ?? 0) * 100) / 5),
    })),

    technology_skills: (techSkills.category ?? []).flatMap((cat: any) =>
      (cat.example ?? []).map((ex: any) => ({
        name: ex.name ?? '',
        hot_technology: ex.hot_technology === true,
      })),
    ),

    education: {
      typical_level:
        education?.education?.typical_level?.name ?? 'High school diploma or equivalent',
      distribution: (education?.education?.level_of_education ?? []).map((l: any) => ({
        level: l.name ?? '',
        pct: Math.round(l.data?.value ?? 0),
      })),
    },
  };
}

/** Check if O*NET credentials are configured. */
export function isOnetConfigured(): boolean {
  return !!(
    process.env.ONET_API_KEY ||
    (process.env.ONET_USERNAME && process.env.ONET_PASSWORD)
  );
}

// PROGRAM_SOC_CODES is now re-exported from @/lib/onet/soc-map (canonical source)
