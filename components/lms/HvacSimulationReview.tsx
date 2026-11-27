import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { HVAC_COURSE_ID } from '@/lib/lms/hvac-workbook-contract';
import { getHvacSimulationDefinition } from '@/lib/lms/hvac-course-simulations';

/** Authenticated RLS restricts rows to licensed course/cohort assignments. */
export default async function HvacSimulationReview() {
  const db = await createClient();
  const { data, error } = await db
    .from('interaction_progress')
    .select('learner_id,lesson_id,score,attempts,completed,updated_at,weak_objectives')
    .eq('course_id', HVAC_COURSE_ID)
    .eq('interaction_type', 'simulation')
    .like('interaction_id', 'hvac-sim:%')
    .order('updated_at', { ascending: false })
    .limit(201);
  if (error) throw new Error('Simulation review evidence could not be loaded');
  return (
    <section aria-label="HVAC simulation practice review" className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold">Simulation practice review</h2>
      <p>
        Server-scored practice only. These results do not verify physical hands-on hours or
        certification.
      </p>
      {(data?.length ?? 0) > 200 && (
        <p role="status">Showing the latest 200 saved labs. Older evidence remains saved.</p>
      )}
      {!data?.length ? (
        <p>No saved simulation evidence is visible in your assigned scope.</p>
      ) : (
        <ul className="space-y-3">
          {data.slice(0, 200).map((row) => (
            <li
              key={`${row.learner_id}-${row.lesson_id}`}
              className="break-words rounded-xl border p-4"
            >
              <h3 className="font-bold">
                {getHvacSimulationDefinition(row.lesson_id)?.title || 'HVAC lab'}
              </h3>
              <p>Learner reference: {row.learner_id}</p>
              <p>
                Best score: {row.score ?? 'Not scored'} · Attempts: {row.attempts} ·{' '}
                {row.completed ? 'Mastered' : 'In progress'}
              </p>
              <p>Saved: {row.updated_at}</p>
              {row.weak_objectives?.length ? (
                <p>Review objectives: {row.weak_objectives.join('; ')}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
