/**
 * Standardized CRUD utilities for API routes
 * 
 * Pattern:
 * - POST /api/{resource} → Create
 * - GET /api/{resource} → List
 * - GET /api/{resource}/[id] → Read one
 * - PATCH /api/{resource}/[id] → Update
 * - DELETE /api/{resource}/[id] → Soft delete
 */

import { NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Standard response shape
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

// Standard error responses
export function badRequest(message: string, details?: any): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not found'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status: 201 });
}

// Validate request body with Zod
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse<ApiResponse> }> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return {
        error: badRequest('Invalid input', parsed.error.flatten()),
      };
    }
    
    return { data: parsed.data };
  } catch {
    return { error: badRequest('Invalid JSON body') };
  }
}

// Check if user is authenticated and has required role
export async function requireAuth(
  allowedRoles: string[] = []
): Promise<{ user: any; profile: any } | { error: NextResponse<ApiResponse> }> {
  const supabase = await createClient();
  
  if (!supabase) {
    return { error: serverError('Database unavailable') };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: unauthorized() };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: unauthorized('Profile not found') };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return { error: forbidden(`Requires role: ${allowedRoles.join(' or ')}`) };
  }

  return { user, profile };
}

// Generic CRUD operations
export async function dbCreate<T>(
  table: string,
  data: Record<string, any>,
  select = '*'
): Promise<{ data: T } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  const { data: result, error } = await supabase
    .from(table)
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(select)
    .single();

  if (error) return { error: 'Operation failed' };
  return { data: result as T };
}

export async function dbList<T>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
    softDelete?: boolean;
  } = {}
): Promise<{ data: T[]; count: number } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  let query = supabase
    .from(table)
    .select(options.select || '*', { count: 'exact' });

  // Apply soft delete filter by default
  if (options.softDelete !== false) {
    query = query.is('deleted_at', null);
  }

  // Apply custom filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) return { error: 'Operation failed' };
  return { data: (data || []) as T[], count: count || 0 };
}

export async function dbGet<T>(
  table: string,
  id: string,
  select = '*',
  softDelete = true
): Promise<{ data: T } | { error: string; notFound?: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  let query = supabase.from(table).select(select).eq('id', id);
  
  if (softDelete) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Not found', notFound: true };
    }
    return { error: 'Operation failed' };
  }
  return { data: data as T };
}

export async function dbUpdate<T>(
  table: string,
  id: string,
  data: Record<string, any>,
  select = '*'
): Promise<{ data: T } | { error: string; notFound?: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  const { data: result, error } = await supabase
    .from(table)
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select(select)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Not found', notFound: true };
    }
    return { error: 'Operation failed' };
  }
  return { data: result as T };
}

export async function dbSoftDelete(
  table: string,
  id: string
): Promise<{ success: boolean } | { error: string; notFound?: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  const { error } = await supabase
    .from(table)
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Not found', notFound: true };
    }
    return { error: 'Operation failed' };
  }
  return { success: true };
}

export async function dbHardDelete(
  table: string,
  id: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable' };

  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) return { error: 'Operation failed' };
  return { success: true };
}
