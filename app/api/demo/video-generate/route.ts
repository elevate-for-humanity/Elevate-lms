/**
 * API Route: Generate Demo Videos
 * 
 * POST /api/demo/video-generate
 * 
 * Generates demo videos for subscription plans using Pexels B-roll.
 * No screen recording needed - uses professional stock footage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { generateDemoVideos, getDemoVideoConfigs, getPexelsVideosForPlan } from '@/lib/video/demo-video-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, planSlug, sections = ['overview', 'features', 'demo'] } = body;
    
    if (!planSlug) {
      return NextResponse.json(
        { error: 'planSlug is required' },
        { status: 400 }
      );
    }
    
    // If planId provided, get plan details from database
    let title: string | undefined;
    let description: string | undefined;
    
    if (planId) {
      const supabase = createPublicClient();
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('name, description, slug')
        .eq('id', planId)
        .single();
      
      if (plan) {
        title = plan.name;
        description = plan.description || undefined;
      }
    }
    
    // Generate demo videos
    const result = await generateDemoVideos({
      planSlug,
      title,
      description,
      sections,
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Demo video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Demo video generation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available configurations
  const configs = getDemoVideoConfigs();
  
  return NextResponse.json({
    configs,
    total: configs.length,
  });
}
