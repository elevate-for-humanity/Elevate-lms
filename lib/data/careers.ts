import { logger } from '@/lib/logger';

/**
 * Careers Data - Real data from Supabase
 * Fetches job positions from the database
 */

import { createClient } from '@/lib/supabase/server';

export interface JobPosition {
  id: string;
  title: string;
  code: string;
  department_id: string;
  department?: {
    name: string;
  };
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  min_salary: number | null;
  max_salary: number | null;
  employment_type: string | null;
  level: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Get all active job positions
 */
export async function getActivePositions(): Promise<JobPosition[]> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('positions')
    .select(
      `
      *,
      department:departments(name)
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching positions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get position by ID
 */
export async function getPositionById(id: string): Promise<JobPosition | null> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('positions')
    .select(
      `
      *,
      department:departments(name)
    `
    )
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    logger.error('Error fetching position:', error);
    return null;
  }

  return data;
}

/**
 * Get positions by department
 */
export async function getPositionsByDepartment(
  departmentId: string
): Promise<JobPosition[]> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('positions')
    .select(
      `
      *,
      department:departments(name)
    `
    )
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('title');

  if (error) {
    logger.error('Error fetching positions by department:', error);
    return [];
  }

  return data || [];
}

/**
 * Get positions by employment type
 */
export async function getPositionsByType(
  employmentType: string
): Promise<JobPosition[]> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('positions')
    .select(
      `
      *,
      department:departments(name)
    `
    )
    .eq('employment_type', employmentType)
    .eq('is_active', true)
    .order('title');

  if (error) {
    logger.error('Error fetching positions by type:', error);
    return [];
  }

  return data || [];
}

/**
 * Format salary range
 */
export function formatSalaryRange(
  minSalary: number | null,
  maxSalary: number | null
): string {
  if (!minSalary && !maxSalary) return 'Competitive';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (minSalary && maxSalary) {
    return `${formatter.format(minSalary)} - ${formatter.format(maxSalary)}`;
  }

  if (minSalary) {
    return `From ${formatter.format(minSalary)}`;
  }

  if (maxSalary) {
    return `Up to ${formatter.format(maxSalary)}`;
  }

  return 'Competitive';
}

/**
 * Get employment type display name
 */
export function getEmploymentTypeDisplay(type: string | null): string {
  if (!type) return 'Full-time';

  const types: Record<string, string> = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    contract: 'Contract',
    temporary: 'Temporary',
    internship: 'Internship',
  };

  return types[type.toLowerCase()] || type;
}

/**
 * Get level display name
 */
export function getLevelDisplay(level: string | null): string {
  if (!level) return 'Mid-level';

  const levels: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid-level',
    senior: 'Senior',
    lead: 'Lead',
    executive: 'Executive',
  };

  return levels[level.toLowerCase()] || level;
}
