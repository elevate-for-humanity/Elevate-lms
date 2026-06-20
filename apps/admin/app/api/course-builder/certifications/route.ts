/**
 * Industry Certifications API
 * Provides certification requirements and exam info for courses
 */

import { NextRequest, NextResponse } from 'next/server';

const CERTIFICATION_BODIES = {
  hvac: {
    name: 'NATE (North American Technician Excellence)',
    url: 'https://www.nate.org/',
    certifications: [
      { code: 'nate-core', name: 'NATE Core Certification', type: 'entry' },
      { code: 'nate-split', name: 'NATE Split System', type: 'specialty' },
      { code: 'nate-heat', name: 'NATE Heat Pump', type: 'specialty' },
    ],
  },
  nursing: {
    name: 'NCLEX (National Council Licensure Examination)',
    url: 'https://www.ncsbn.org/index.htm',
    certifications: [
      { code: 'nclex-rn', name: 'NCLEX-RN (Registered Nurse)', type: ' licensure' },
      { code: 'nclex-pn', name: 'NCLEX-PN (Practical Nurse)', type: 'licensure' },
    ],
  },
  cdl: {
    name: 'CDL (Commercial Driver License)',
    url: 'https://www.fmcsa.dot.gov/registration/commercial-drivers-license',
    certifications: [
      { code: 'cdl-a', name: 'Class A CDL', type: 'license' },
      { code: 'cdl-b', name: 'Class B CDL', type: 'license' },
      { code: 'cdl-hazmat', name: 'HAZMAT Endorsement', type: 'endorsement' },
    ],
  },
  it: {
    name: 'CompTIA',
    url: 'https://www.comptia.org/',
    certifications: [
      { code: 'comptia-a', name: 'CompTIA A+', type: 'entry' },
      { code: 'comptia-security', name: 'CompTIA Security+', type: 'intermediate' },
      { code: 'comptia-network', name: 'CompTIA Network+', type: 'intermediate' },
    ],
  },
  electrician: {
    name: 'Electrical Certifications',
    url: 'https://www.electricianschooledu.org/',
    certifications: [
      { code: 'journeyman', name: 'Journeyman Electrician', type: 'license' },
      { code: 'master-electrician', name: 'Master Electrician', type: 'license' },
    ],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');
  const certCode = searchParams.get('code');

  if (certCode) {
    // Get details for specific certification
    for (const [key, body] of Object.entries(CERTIFICATION_BODIES)) {
      const cert = body.certifications.find((c) => c.code === certCode);
      if (cert) {
        return NextResponse.json({
          code: cert.code,
          name: cert.name,
          type: cert.type,
          body: body.name,
          url: body.url,
          requirements: getRequirements(cert.code),
        });
      }
    }
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  if (industry && CERTIFICATION_BODIES[industry]) {
    return NextResponse.json(CERTIFICATION_BODIES[industry]);
  }

  return NextResponse.json({
    available: true,
    industries: Object.keys(CERTIFICATION_BODIES),
    bodies: CERTIFICATION_BODIES,
  });
}

function getRequirements(code: string) {
  const requirements: Record<string, any> = {
    'nate-core': {
      experience: '0-2 years HVAC experience recommended',
      exam: 'NATE Core Exam (100 questions)',
      cost: '$300-500',
      renewal: '2 years (20 hours CE)',
    },
    'nclex-rn': {
      education: 'Associate or Bachelor degree in Nursing',
      exam: 'NCLEX-RN (CAT format)',
      cost: '$200 + state fees',
      renewal: 'Varies by state',
    },
    'cdl-a': {
      age: '21 years old (18 for intrastate)',
      exam: 'CDL Written + Road Test',
      cost: '$500-2000 (varies by state)',
      renewal: '4 years',
    },
    'comptia-a': {
      experience: '9-12 months IT experience recommended',
      exam: '220-1101 and 220-1102',
      cost: '$246 per exam',
      renewal: '3 years (CE program)',
    },
  };

  return requirements[code] || {
    experience: 'Varies',
    exam: 'Contact certification body',
    cost: 'Contact certification body',
    renewal: 'Varies',
  };
}

export async function POST(request: NextRequest) {
  const { industry, occupationTitle } = await request.json();

  // Find relevant certifications based on industry or occupation
  const results: any[] = [];

  if (industry && CERTIFICATION_BODIES[industry]) {
    const body = CERTIFICATION_BODIES[industry];
    results.push({
      industry,
      body: body.name,
      url: body.url,
      certifications: body.certifications.map((c) => ({
        ...c,
        requirements: getRequirements(c.code),
      })),
    });
  }

  // Search by occupation title
  const searchTerms = occupationTitle?.toLowerCase() || '';
  for (const [key, body] of Object.entries(CERTIFICATION_BODIES)) {
    if (
      searchTerms.includes(key) ||
      body.name.toLowerCase().includes(searchTerms)
    ) {
      results.push({
        industry: key,
        body: body.name,
        url: body.url,
        certifications: body.certifications,
      });
    }
  }

  return NextResponse.json({
    query: { industry, occupationTitle },
    results,
    attribution: 'Certification data compiled from official bodies',
  });
}