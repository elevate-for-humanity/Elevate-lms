import { publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
import { simulationFixture } from './manufacturing-simulation';

export const fixtureGradingKey = '11111111-2222-4333-8444-555555555555';
export function manufacturingPracticeStore(courseId: string, lessonId: string, slug = 'fixture-inspection') {
  const full = JSON.parse(JSON.stringify(simulationFixture));
  const tables: Record<string, Array<Record<string, any>>> = {
    course_lessons: [{ id: lessonId, course_id: courseId, slug, title: 'Inspection',
      content_json: { experience: { manufacturingSimulation: publicManufacturingSimulation({ ...full, gradingKeyId: fixtureGradingKey }) } } }],
    interaction_progress: [],
    manufacturing_simulation_specs: [{ id: fixtureGradingKey, lesson_id: lessonId, course_id: courseId, spec: full }],
    manufacturing_simulation_progress: [],
  };
  const accesses: Array<{ role: string; table: string }> = [];
  const errors: Record<string, unknown> = {};
  const filters: Array<[string, unknown]> = [];
  function client(role: 'learner' | 'service') {
    return {
      from(table: string) {
        accesses.push({ role, table });
        if (role === 'learner' && table.startsWith('manufacturing_')) throw new Error('Learner accessed private grading storage');
        const conditions: Array<[string, unknown]> = [];
        let payload: Record<string, any> | null = null;
        let conflictColumns: string[] = [];
        function execute(single = false) {
          if (errors[table]) return { data: null, error: errors[table] };
          if (!(table in tables)) throw new Error(`Unexpected table access ${table}`);
          if (payload) {
            const expectedIdentity = table === 'manufacturing_simulation_progress'
              ? ['learner_id', 'lesson_id', 'interaction_id', 'spec_id']
              : ['learner_id', 'lesson_id', 'interaction_id'];
            if (conflictColumns.join(',') !== expectedIdentity.join(',')) {
              return { data: null, error: new Error('Upsert target does not match the table identity') };
            }
            const existing = tables[table].find((row) => conflictColumns.every((column) => row[column] === payload?.[column]));
            if (existing) Object.assign(existing, payload);
            else tables[table].push({ ...payload });
            return { data: payload, error: null };
          }
          const selected = tables[table].filter((row) => conditions.every(([key, value]) => row[key] === value));
          return { data: single ? (selected[0] ?? null) : selected, error: null };
        }
        const query: any = {
          select: () => query,
          eq: (key: string, value: unknown) => { conditions.push([key, value]); filters.push([key, value]); return query; },
          upsert: (row: Record<string, any>, options: { onConflict: string }) => {
            payload = row; conflictColumns = options.onConflict.split(','); return query;
          },
          single: async () => execute(true),
          maybeSingle: async () => execute(true),
          then: (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject),
        };
        return query;
      },
    };
  }
  return { tables, accesses, errors, filters, learnerDb: client('learner'), privateDb: client('service') };
}
