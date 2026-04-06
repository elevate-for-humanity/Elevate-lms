
import { createServerClient } from '@/lib/supabase/server';
import integrations from '../config/integrations.json';

export type ApiProviderType = 'supabase' | 'external-rest';

export type ProgramRecord = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description?: string;
  hero_image?: string | null;
  hero_image_alt?: string | null;
};

export type EnrollmentRecord = {
  id: string;
  user_id: string;
  program_id: string;
  status: string;
  enrolled_at: string;
  completed_at?: string | null;
};

export type LearnerRecord = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  metadata?: Record<string, any>;
};

export interface ApiAdapter {
  listPrograms(): Promise<ProgramRecord[]>;
  getProgramBySlug(slug: string): Promise<ProgramRecord | null>;
  listEnrollmentsByUser?(userId: string): Promise<EnrollmentRecord[]>;
  getLearnerById?(learnerId: string): Promise<LearnerRecord | null>;
}

function getApiProviderType(): ApiProviderType {
  const t = (integrations.apiProvider || 'supabase') as ApiProviderType;
  return t;
}

/**
 * Supabase-based implementation (current default)
 */
const supabaseApiAdapter: ApiAdapter = {
  async listPrograms() {
    const supabase = createServerClient();
    const { data, error }: any = await supabase
      .from('programs')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // Error: $1
      return [];
    }
    return (data || []) as ProgramRecord[];
  },

  async getProgramBySlug(slug: string) {
    const supabase = createServerClient();
    const { data, error }: any = await supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      // Error: $1
      return null;
    }
    return (data as ProgramRecord) || null;
  },
};

/**
 * External REST API implementation (for client systems)
 */
const externalRestApiAdapter: ApiAdapter = {
  async listPrograms() {
    if (!integrations.externalApiBaseUrl) {
      return [];
    }
    try {
      const res = await fetch(`${integrations.externalApiBaseUrl}/programs`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data as ProgramRecord[];
    } catch (err) {
      // Error: $1
      return [];
    }
  },

  async getProgramBySlug(slug: string) {
    if (!integrations.externalApiBaseUrl) {
      return null;
    }
    try {
      const res = await fetch(
        `${integrations.externalApiBaseUrl}/programs/${encodeURIComponent(slug)}`,
        {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        }
      );
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data as ProgramRecord;
    } catch (err) {
      // Error: $1
      return null;
    }
  },
};

export function getApiAdapter(): ApiAdapter {
  const type = getApiProviderType();
  switch (type) {
    case 'supabase':
      return supabaseApiAdapter;
    case 'external-rest':
      return externalRestApiAdapter;
    default:
      return supabaseApiAdapter;
  }
}
