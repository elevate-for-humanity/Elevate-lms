import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

const AUTOPILOT_SECRET = Deno.env.get('AUTOPILOT_SECRET')!;
const AUTOPILOT_URL = Deno.env.get('AUTOPILOT_URL')!;

// =============================================
// Command Parser
// =============================================

interface ParsedCommand {
  cmd: string;
  args: string[];
  kv: Record<string, string | string[]>;
}

function parse(text: string): ParsedCommand | null {
  // Parse: /cmd arg1 arg2 key=val key2="quoted val" key3=a,b,c
  const parts = text.trim().match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  if (parts.length === 0) return null;

  const cmd = parts[0].replace(/^\//, '');
  const args: string[] = [];
  const kv: Record<string, string | string[]> = {};

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i].replace(/^"|"$/g, '');
    const eq = p.indexOf('=');

    if (eq > 0) {
      const key = p.slice(0, eq);
      const val = p.slice(eq + 1);
      // Convert CSV to array
      kv[key] = val.includes(',') ? val.split(',') : val;
    } else {
      args.push(p);
    }
  }

  return { cmd, args, kv };
}

// =============================================
// Autopilot API Client
// =============================================

async function callAutopilot(body: unknown) {
  return fetch(AUTOPILOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-autopilot-sign': AUTOPILOT_SECRET,
    },
    body: JSON.stringify(body),
  });
}

// =============================================
// HTTP Handler
// =============================================

serve(async (req) => {
  try {
    // Verify shared secret
    const sig = req.headers.get('x-bridge-sign');
    if (sig !== AUTOPILOT_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }

    const { text = '' } = await req.json();
    const parsed = parse(text);

    if (!parsed) {
      return new Response(JSON.stringify({ error: 'no command' }), {
        status: 400,
      });
    }

    const { cmd, args, kv } = parsed;

    // ==================== ENQUEUE ====================
    if (cmd === 'enqueue') {
      const kind = args[0];
      if (!kind) {
        return new Response(JSON.stringify({ error: 'missing kind' }), {
          status: 400,
        });
      }

      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(kv)) {
        payload[k] = v;
      }

      const priority = kv.priority ? Number(kv.priority) : 5;
      const requires_approval = kv.requires_approval === 'true';

      const r = await callAutopilot({
        task: 'enqueue',
        kind,
        payload,
        priority,
        requires_approval,
      });

      return new Response(await r.text(), { status: r.status });
    }

    // ==================== APPROVE ====================
    if (cmd === 'approve') {
      const id = Number(args[0]);
      if (!id) {
        return new Response(JSON.stringify({ error: 'missing id' }), {
          status: 400,
        });
      }

      const approver = kv.approver as string;
      const r = await callAutopilot({ task: 'approve', id, approver });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== RETRY ====================
    if (cmd === 'retry') {
      const id = Number(args[0]);
      if (!id) {
        return new Response(JSON.stringify({ error: 'missing id' }), {
          status: 400,
        });
      }

      const r = await callAutopilot({ task: 'retry', id });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== CANCEL ====================
    if (cmd === 'cancel') {
      const id = Number(args[0]);
      if (!id) {
        return new Response(JSON.stringify({ error: 'missing id' }), {
          status: 400,
        });
      }

      const r = await callAutopilot({ task: 'cancel', id });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== STATUS ====================
    if (cmd === 'status') {
      const limit = kv.limit ? Number(kv.limit) : 20;
      const r = await callAutopilot({ task: 'status', limit });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== HEAL (Self-Heal Sequence) ====================
    if (cmd === 'heal') {
      // Enqueue healing tasks
      await callAutopilot({ task: 'enqueue', kind: 'db_rls_fix' });
      await callAutopilot({ task: 'enqueue', kind: 'redeploy' });

      // Process immediately
      const r = await callAutopilot({ task: 'loop' });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== DEPLOY ====================
    if (cmd === 'deploy') {
      const r = await callAutopilot({ task: 'enqueue', kind: 'redeploy' });
      return new Response(await r.text(), { status: r.status });
    }

    // ==================== EDGE (Create Task Dependency) ====================
    if (cmd === 'edge') {
      const parent = Number(kv.parent);
      const child = Number(kv.child);

      if (!parent || !child) {
        return new Response(JSON.stringify({ error: 'missing parent or child' }), { status: 400 });
      }

      // Note: This would need a separate endpoint or direct DB access
      return new Response(
        JSON.stringify({
          ok: true,
          message: `Edge ${parent}→${child} (implement via SQL or admin endpoint)`,
        }),
        { status: 200 },
      );
    }

    // ==================== UNKNOWN ====================
    return new Response(JSON.stringify({ error: 'unknown command' }), {
      status: 400,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
