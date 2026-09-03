import { NextRequest, NextResponse } from 'next/server';
import { loadRepositorySkills } from '@/lib/studio/repository-skills';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const skills = await loadRepositorySkills();
    return NextResponse.json({ skills, count: skills.length });
  } catch (error) {
    console.error('Error loading skills:', error);
    return NextResponse.json({ error: 'Failed to load skills' }, { status: 500 });
  }
}
