import { NextRequest, NextResponse } from 'next/server';

const ONET_WS_URL = 'https://services.onetcenter.org/ws';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'O*NET API key not configured' }, { status: 500 });
  }

  try {
    switch (action) {
      case 'interests':
        const interestsRes = await fetch(`${ONET_WS_URL}/online/interest-profiler`, {
          headers: { 'X-Api-Key': apiKey },
        });
        return NextResponse.json({ 
          type: 'interests',
          data: await interestsRes.json(),
          attribution: 'O*NET® is a trademark of USDOL/ETA.',
        });

      case 'careers':
        const keyword = searchParams.get('keyword') || 'nurse';
        const careersRes = await fetch(
          `${ONET_WS_URL}/online/occupations?keyword=${encodeURIComponent(keyword)}`,
          { headers: { 'X-Api-Key': apiKey } }
        );
        return NextResponse.json({
          type: 'careers',
          keyword,
          data: await careersRes.json(),
          attribution: 'O*NET® is a trademark of USDOL/ETA.',
        });

      case 'skills':
      case 'tasks':
        const code = searchParams.get('code');
        if (!code) return NextResponse.json({ error: 'Missing code param' }, { status: 400 });
        const res = await fetch(
          `${ONET_WS_URL}/online/occupations/${code}/${action}`,
          { headers: { 'X-Api-Key': apiKey } }
        );
        return NextResponse.json({
          type: action,
          code,
          data: await res.json(),
          attribution: 'O*NET® is a trademark of USDOL/ETA.',
        });

      default:
        return NextResponse.json({
          available: true,
          configured: !!apiKey,
          endpoints: [
            'GET ?action=interests - Career Interest Profiler',
            'GET ?action=careers&keyword=X - Search careers',
            'GET ?action=skills&code=X - Get skills',
            'GET ?action=tasks&code=X - Get tasks',
            'POST {keyword, careerCode} - Full career data for courses',
          ],
        });
    }
  } catch (error) {
    return NextResponse.json({ error: 'O*NET API error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { keyword, careerCode } = await request.json();
  const apiKey = process.env.ONET_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'O*NET API key not configured' }, { status: 500 });
  }

  try {
    const [careerRes, skillsRes, tasksRes] = await Promise.all([
      fetch(`${ONET_WS_URL}/online/occupations/${careerCode}`, { headers: { 'X-Api-Key': apiKey } }),
      fetch(`${ONET_WS_URL}/online/occupations/${careerCode}/skills`, { headers: { 'X-Api-Key': apiKey } }),
      fetch(`${ONET_WS_URL}/online/occupations/${careerCode}/tasks`, { headers: { 'X-Api-Key': apiKey } }),
    ]);

    const [career, skills, tasks] = await Promise.all([
      careerRes.json(),
      skillsRes.json(),
      tasksRes.json(),
    ]);

    return NextResponse.json({
      career: { code: careerCode, title: career.title, description: career.description },
      skills: skills.occupation?.skills || [],
      tasks: tasks.occupation?.tasks || [],
      attribution: 'O*NET® is a trademark of USDOL/ETA.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch O*NET data' }, { status: 500 });
  }
}