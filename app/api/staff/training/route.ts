export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all training modules
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('*')
      .order('order_index', { ascending: true });

    if (modulesError) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    // Get user's progress
    const { data: progress, error: progressError } = await supabase
      .from('staff_training_progress')
      .select('*')
      .eq('user_id', user.id);

    if (progressError) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    // Combine modules with progress
    const modulesWithProgress = modules?.map((module) => {
      const userProgress = progress?.find((p) => p.module_id === module.id);
      return {
        ...module,
        progress: userProgress || null,
      };
    });

    return NextResponse.json({
      modules: modulesWithProgress,
      totalModules: modules?.length || 0,
      completedModules: progress?.filter((p) => p.completed_at).length || 0,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { module_id, quiz_score } = body;

    if (!module_id) {
      return NextResponse.json(
        { error: 'module_id is required' },
        { status: 400 }
      );
    }

    // Check if module exists
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', module_id)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Upsert progress
    const { data: progress, error: progressError } = await supabase
      .from('staff_training_progress')
      .upsert(
        {
          user_id: user.id,
          module_id,
          completed_at: new Date().toISOString(),
          quiz_score: quiz_score || null,
          certification_date:
            quiz_score && quiz_score >= 80 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,module_id',
        }
      )
      .select()
      .single();

    if (progressError) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress,
      certified: quiz_score && quiz_score >= 80,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
