// lib/withAuth.ts - Centralized authentication wrapper
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Role = 'student' | 'staff' | 'admin' | 'super_admin' | 'partner';

interface AuthedContext {
  params?: any;
  user: {
    id: string;
    email: string | null;
    role: Role;
  };
}

type Handler = (
  req: NextRequest,
  ctx: AuthedContext
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: Handler, options?: { roles?: Role[] }) {
  return async (req: NextRequest, context: { params?: any }) => {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up role from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Error: $1
    }

    const role = (profile?.role as Role) ?? 'student';

    if (options?.roles && !options.roles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, {
      ...context,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    });
  };
}
