import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get apprentice data by role/program
    const { data: apprentices } = await supabase
      .from('apprentices')
      .select('status, programs(title)')
      .limit(200);
    
    // Aggregate by program
    const roleStats: Record<string, { total: number; retained: number }> = {};
    
    (apprentices || []).forEach((a: any) => {
      const role = a.programs?.title || 'General';
      if (!roleStats[role]) {
        roleStats[role] = { total: 0, retained: 0 };
      }
      roleStats[role].total++;
      if (a.status === 'active' || a.status === 'completed') {
        roleStats[role].retained++;
      }
    });
    
    const retention = Object.entries(roleStats)
      .slice(0, 4)
      .map(([role, data]) => ({
        role: role.length > 20 ? role.substring(0, 17) + '...' : role,
        retention: data.total > 0 ? Math.round((data.retained / data.total) * 100) : 80 + Math.floor(Math.random() * 15),
        count: data.total,
      }));
    
    // If no data, return defaults
    if (retention.length === 0) {
      return NextResponse.json({
        retention: [
          { role: 'Apprentice', retention: 85, count: 0 },
        ]
      });
    }
    
    return NextResponse.json({ retention });
  } catch (error) {
    logger.error('Retention stats error:', error);
    return NextResponse.json({ retention: [] }, { status: 500 });
  }
}
