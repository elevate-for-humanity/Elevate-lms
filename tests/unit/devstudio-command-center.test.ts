import { describe, expect, it } from 'vitest';
import { buildCommandCenterSnapshot } from '@/lib/devstudio/os/command-center';

function mockDb(responses: Record<string, unknown>) {
  const from = (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      then: undefined as unknown,
    };
    const result = responses[table] ?? { data: [], error: null, count: 0 };
    return {
      select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            eq: () =>
              Promise.resolve({ count: (result as { count?: number }).count ?? 0, error: null }),
          };
        }
        return {
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve(result),
            }),
          }),
          in: () => ({
            order: () => ({
              limit: () => Promise.resolve(result),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve(result),
          }),
        };
      },
    };
  };
  return { from } as never;
}

describe('buildCommandCenterSnapshot', () => {
  it('returns snapshot shape with health flags', async () => {
    const db = mockDb({
      ai_tasks: { data: [], error: null, count: 2 },
      ai_agents: { data: [], error: null, count: 1 },
      ai_deployments: { data: [], error: null },
      dev_audit_logs: { data: [], error: null },
    });

    const snapshot = await buildCommandCenterSnapshot(db, {
      health: { hasGitHub: true, supabaseUrlPresent: true, supabaseServiceKeyPresent: true },
    });

    expect(snapshot.health.website).toBe(true);
    expect(snapshot.health.database).toBe(true);
    expect(snapshot.activeTasks).toBe(2);
    expect(snapshot.activeAgents).toBe(1);
    expect(Array.isArray(snapshot.integrationPending)).toBe(true);
  });
});
