export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const execAsync = promisify(exec);

// Execute a command and return output
export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { command, cwd } = await req.json();

    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 });
    }

    // Security: Block dangerous commands
    const blocked = ['rm -rf /', 'mkfs', 'dd if=', ':(){', 'fork bomb', '> /dev/sd'];
    if (blocked.some(b => command.toLowerCase().includes(b))) {
      return NextResponse.json({ error: 'Command blocked for security' }, { status: 403 });
    }

    const workDir = cwd || process.cwd();
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    return NextResponse.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      stdout: error.stdout || '',
      stderr: 'Internal server error',
      exitCode: error.code || 1,
    });
  }
}
