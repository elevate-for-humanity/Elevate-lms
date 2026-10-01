import type { SupabaseClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UltimateLearnerRuntimeEvidence, UltimateLearnerRuntimePort } from '../core/ports';
import { ULTIMATE_LESSON_CONTRACT_VERSION, contractHash } from '../core/lesson-contract';
import { LEARNER_RUNTHROUGH_CHECKS } from '../quality/learner-runthrough';
/** Browser worker must exercise the staged lesson in a test enrollment. Database
 * existence and a syntactically valid URL are never learner test evidence. */
export class UltimatePlatformLearnerRuntime implements UltimateLearnerRuntimePort {
  constructor(private db: SupabaseClient) {}
  async verify(input: {
    courseId: string;
    lessonId: string;
    videoUrl: string;
  }): Promise<UltimateLearnerRuntimeEvidence> {
    const endpoint = process.env.ULTIMATE_LEARNER_RUNTHROUGH_URL;
    const secret = process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET;
    if (!endpoint || !secret)
      throw new Error('ULTIMATE_AUTHENTICATED_BROWSER_WORKER_NOT_CONFIGURED');
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') throw new Error('ULTIMATE_BROWSER_WORKER_HTTPS_REQUIRED');
    const { data: lesson, error } = await this.db
      .from('ultimate_lesson_builds')
      .select('id,artifacts,ultimate_course_builds!inner(course_id)')
      .eq('competency_id', input.lessonId)
      .eq('ultimate_course_builds.course_id', input.courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !lesson) throw new Error('ULTIMATE_STAGED_LESSON_TEST_INPUT_REQUIRED');
    const artifacts: any = lesson.artifacts;
    const mediaSha256 = artifacts?.finished_media_qa?.mediaQA?.inspection?.mediaSha256;
    if (!mediaSha256) throw new Error('ULTIMATE_BROWSER_TEST_MEDIA_HASH_REQUIRED');
    const request = {
      ...input,
      lessonBuildId: lesson.id,
      contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
      mediaSha256,
      artifactHash: contractHash(artifacts),
      requiredChecks: LEARNER_RUNTHROUGH_CHECKS,
    };
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(request),
      // Complete playback may exceed five minutes. The runner has its own bounded deadline.
      signal: AbortSignal.timeout(3600000),
    });
    if (response.status === 202) {
      const { testTicket } = await response.json();
      if (typeof testTicket !== 'string' || !/^[a-f0-9-]{36}$/i.test(testTicket))
        throw new Error('ULTIMATE_BROWSER_TEST_TICKET_INVALID');
      const deadline = Date.now() + 3600000;
      do {
        await new Promise(resolve => setTimeout(resolve, 5000));
        response = await fetch(`${url.toString().replace(/\/$/, '')}/${testTicket}`, {
          headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(30000),
        });
      } while (response.status === 202 && Date.now() < deadline);
      if (response.status === 202) throw new Error('ULTIMATE_BROWSER_TEST_DEADLINE_EXCEEDED');
    }
    if (!response.ok) throw new Error(`Browser runthrough returned HTTP ${response.status}`);
    const { evidence, signature } = await response.json();
    const expected = createHmac('sha256', secret).update(contractHash(evidence)).digest('hex');
    if (
      typeof signature !== 'string' ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new Error('ULTIMATE_BROWSER_EVIDENCE_SIGNATURE_INVALID');
    if (
      evidence.contractVersion !== request.contractVersion ||
      evidence.mediaSha256 !== mediaSha256 ||
      evidence.artifactHash !== request.artifactHash ||
      evidence.lessonBuildId !== lesson.id ||
      !evidence.testRunId ||
      !Array.isArray(evidence.observations)
    )
      throw new Error('ULTIMATE_BROWSER_EVIDENCE_VERSION_MISMATCH');
    const checkedAt = Date.parse(evidence.checkedAt);
    if (!Number.isFinite(checkedAt) || Math.abs(Date.now() - checkedAt) > 600000)
      throw new Error('ULTIMATE_BROWSER_EVIDENCE_EXPIRED');
    const { data: current, error: currentError } = await this.db
      .from('ultimate_lesson_builds').select('artifacts').eq('id', lesson.id).single();
    if (currentError || !current || contractHash(current.artifacts) !== request.artifactHash)
      throw new Error('ULTIMATE_BROWSER_LESSON_CHANGED_DURING_TEST');
    const results = Object.fromEntries(
      LEARNER_RUNTHROUGH_CHECKS.map((check) => [
        check,
        evidence.observations.some(
          (o: any) =>
            o.check === check &&
            o.passed === true &&
            typeof o.action === 'string' &&
            o.action.trim() &&
            typeof o.observed === 'string' &&
            o.observed.trim(),
        ),
      ]),
    );
    return {
      progress_save: results.progress_save,
      resume: results.resume,
      completion: results.completion,
      evidence: { ...evidence, results },
    };
  }
}
