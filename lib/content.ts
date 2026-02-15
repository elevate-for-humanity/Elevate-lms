import { logger } from '@/lib/logger';
/**
 * Content fetching functions - all site content from database
 * No hardcoded fake data
 */

import { createClient } from '@/lib/supabase/server';

// Types
export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  quote: string;
  rating: number;
  image_url: string | null;
  video_url: string | null;
  program_slug: string | null;
  service_type: string | null;
  featured: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  department: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
}

export interface SuccessStory {
  id: string;
  name: string;
  program_completed: string;
  graduation_date: string | null;
  current_job_title: string | null;
  current_employer: string | null;
  story: string;
  quote: string | null;
  image_url: string | null;
  video_url: string | null;
  featured: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  program_slug: string | null;
}

export interface Location {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  email: string | null;
  hours: Record<string, string> | null;
  is_main_office: boolean;
}

export interface Partner {
  id: string;
  name: string;
  partner_type: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  featured: boolean;
}

// Fetch testimonials
export async function getTestimonials(options?: {
  serviceType?: string;
  programSlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Testimonial[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('display_order', { ascending: true });
  
  if (options?.serviceType) {
    query = query.eq('service_type', options.serviceType);
  }
  if (options?.programSlug) {
    query = query.eq('program_slug', options.programSlug);
  }
  if (options?.featured) {
    query = query.eq('featured', true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Error fetching testimonials:', error);
    return [];
  }
  
  return data || [];
}

// Fetch team members
export async function getTeamMembers(options?: {
  department?: string;
  limit?: number;
}): Promise<TeamMember[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (options?.department) {
    query = query.eq('department', options.department);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Error fetching team members:', error);
    return [];
  }
  
  return data || [];
}

// Fetch success stories
export async function getSuccessStories(options?: {
  featured?: boolean;
  limit?: number;
}): Promise<SuccessStory[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('success_stories')
    .select('*')
    .eq('approved', true)
    .order('display_order', { ascending: true });
  
  if (options?.featured) {
    query = query.eq('featured', true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Error fetching success stories:', error);
    return [];
  }
  
  return data || [];
}

// Fetch FAQs
export async function getFAQs(options?: {
  category?: string;
  programSlug?: string;
  limit?: number;
}): Promise<FAQ[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.programSlug) {
    query = query.eq('program_slug', options.programSlug);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Error fetching FAQs:', error);
    return [];
  }
  
  return data || [];
}

// Fetch locations
export async function getLocations(): Promise<Location[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('is_main_office', { ascending: false });
  
  if (error) {
    logger.error('Error fetching locations:', error);
    return [];
  }
  
  return data || [];
}

// Fetch partners
export async function getPartners(options?: {
  partnerType?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Partner[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (options?.partnerType) {
    query = query.eq('partner_type', options.partnerType);
  }
  if (options?.featured) {
    query = query.eq('featured', true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error('Error fetching partners:', error);
    return [];
  }
  
  return data || [];
}

// Get main office location
export async function getMainOffice(): Promise<Location | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_main_office', true)
    .eq('is_active', true)
    .single();
  
  if (error) {
    logger.error('Error fetching main office:', error);
    return null;
  }
  
  return data;
}
