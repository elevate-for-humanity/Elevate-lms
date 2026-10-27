import { fetchOnetOccupation, isOnetConfigured } from '../../industry/onet';
import { getOnetSnapshot } from '../../onet/client';
import { fetchCareerOneStopData, isCareerOneStopConfigured } from '../../industry/careeronestop';
import { fetchUsaJobs } from '../../industry/usajobs';
import type { UltimateWorkforcePort } from '../core/ports';

export class UltimatePlatformWorkforce implements UltimateWorkforcePort {
  async load(input: { socCodes: string[]; jurisdiction?: string; occupationTitle?: string }) {
    const occupations = [];
    const sources = new Set<string>();
    for (const socCode of input.socCodes) {
      let onet: any = null;
      let career: Awaited<ReturnType<typeof fetchCareerOneStopData>> | null = null;
      let federalJobs: Awaited<ReturnType<typeof fetchUsaJobs>> = [];
      const unavailable: string[] = [];
      if (isOnetConfigured()) {
        try {
          if (process.env.ONET_API_KEY) {
            const snapshot = await getOnetSnapshot(socCode);
            if (!snapshot) throw new Error('v2 API did not return an occupation; verify ONET_API_KEY and code');
            onet = { socCode, title: snapshot.title, description: snapshot.description,
              tasks: snapshot.coreTasks, skills: snapshot.topSkills, knowledge: snapshot.topKnowledge, source: 'O*NET v2' };
          } else onet = await fetchOnetOccupation(socCode);
          sources.add('O*NET');
        } catch (error) {
          unavailable.push(`O*NET: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else unavailable.push('O*NET: credentials unavailable');
      const title = onet?.title || input.occupationTitle?.replace(/\s+Registered Apprenticeship.*$/i, '').trim();
      if (isCareerOneStopConfigured() && title) {
        try {
          career = await fetchCareerOneStopData(socCode, title, input.jurisdiction ?? 'IN');
          sources.add('CareerOneStop');
        } catch (error) {
          unavailable.push(`CareerOneStop: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else unavailable.push('CareerOneStop: credentials or occupation title unavailable');
      if (process.env.USAJOBS_API_KEY && process.env.USAJOBS_USER_AGENT_EMAIL && title) {
        try {
          federalJobs = await fetchUsaJobs(title, input.jurisdiction === 'IN' ? 'Indiana' : '', 10);
          sources.add('USAJOBS');
        } catch (error) {
          unavailable.push(`USAJOBS: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else unavailable.push('USAJOBS: credentials or occupation title unavailable');
      occupations.push({ socCode, onet, career, federalJobs, unavailable });
    }
    return { occupations, sources: [...sources], usage: 'occupation and labor market context; not credential authority' };
  }
}
