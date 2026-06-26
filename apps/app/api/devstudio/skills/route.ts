import { NextRequest, NextResponse } from 'next/server';
import { getSkillsLoader } from '@/lib/dev-studio/skills-loader';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const skillsLoader = getSkillsLoader();
    await skillsLoader.load();
    
    const skills = skillsLoader.getAllSkills();
    
    return NextResponse.json({
      skills,
      count: skills.length,
    });
  } catch (error) {
    console.error('Error loading skills:', error);
    return NextResponse.json(
      { error: 'Failed to load skills' },
      { status: 500 }
    );
  }
}