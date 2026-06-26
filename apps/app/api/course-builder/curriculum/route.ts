/**
 * Curriculum Frameworks API
 * Provides curriculum standards and competencies for course building
 */

import { NextRequest, NextResponse } from 'next/server';

const FRAMEWORKS = {
  healthcare: {
    name: 'Healthcare Curriculum Standards',
    body: 'Department of Education & Accreditation Bodies',
    standards: [
      {
        code: 'ccore',
        name: 'Healthcare Core Competencies',
        description: ' foundational skills for all healthcare workers',
        competencies: [
          'Patient communication and safety',
          'Medical terminology',
          'Infection control',
          'HIPAA compliance',
          'Emergency procedures',
        ],
      },
      {
        code: 'cna-standards',
        name: 'CNA Training Requirements',
        description: 'State-approved CNA curriculum requirements',
        hours: { theory: 50, clinical: 100 },
      },
      {
        code: 'ma-standards',
        name: 'Medical Assistant Standards',
        description: 'RMA/ CMA aligned curriculum',
        hours: { theory: 120, clinical: 160 },
      },
    ],
  },
  trades: {
    name: 'Skilled Trades Curriculum',
    body: 'Industry Standards & Apprenticeship Standards',
    standards: [
      {
        code: 'hvac-r',
        name: 'HVAC/R Competencies',
        description: 'NATE-aligned HVAC curriculum',
        competencies: [
          'Refrigeration principles',
          'Electrical systems',
          'EPA 608 certification prep',
          'System troubleshooting',
          'Customer service',
        ],
      },
      {
        code: 'electrical-apprentice',
        name: 'Electrical Apprenticeship',
        description: 'Journeyman electrician curriculum',
        hours: { classroom: 2000, onjob: 8000 },
        competencies: [
          'National Electrical Code',
          'Residential wiring',
          'Commercial installations',
          'Motor controls',
          'PLC basics',
        ],
      },
      {
        code: 'plumbing-apprentice',
        name: 'Plumbing Apprenticeship',
        description: 'Journeyman plumber curriculum',
        hours: { classroom: 1500, onjob: 6000 },
      },
    ],
  },
  technology: {
    name: 'Technology Curriculum',
    body: 'CompTIA & Industry Standards',
    standards: [
      {
        code: 'it-fundamentals',
        name: 'IT Fundamentals',
        description: 'A+ certification aligned',
        competencies: [
          'Hardware fundamentals',
          'Operating systems',
          'Networking basics',
          'Security fundamentals',
          'Troubleshooting',
        ],
      },
      {
        code: 'cybersecurity',
        name: 'Cybersecurity Essentials',
        description: 'Security+ aligned',
        competencies: [
          'Network security',
          'Threats and vulnerabilities',
          'Access control',
          'Cryptography basics',
          'Risk management',
        ],
      },
    ],
  },
  transportation: {
    name: 'Transportation Curriculum',
    body: 'DOT/FMCSA Standards',
    standards: [
      {
        code: 'cdl-prep',
        name: 'CDL Preparation',
        description: 'Class A/B CDL curriculum',
        competencies: [
          'Pre-trip inspection',
          'Basic controls',
          'Coupling/uncoupling',
          'City driving',
          'Highway driving',
          'Hazard perception',
        ],
      },
    ],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get('field');
  const standardCode = searchParams.get('code');

  if (standardCode) {
    // Find specific standard
    for (const [key, framework] of Object.entries(FRAMEWORKS)) {
      const standard = framework.standards.find((s) => s.code === standardCode);
      if (standard) {
        return NextResponse.json({
          code: standard.code,
          name: standard.name,
          description: standard.description,
          framework: framework.name,
          body: framework.body,
          competencies: standard.competencies || [],
          hours: standard.hours || null,
        });
      }
    }
    return NextResponse.json({ error: 'Standard not found' }, { status: 404 });
  }

  if (field && FRAMEWORKS[field]) {
    return NextResponse.json(FRAMEWORKS[field]);
  }

  return NextResponse.json({
    available: true,
    fields: Object.keys(FRAMEWORKS),
    frameworks: FRAMEWORKS,
  });
}

export async function POST(request: NextRequest) {
  const { industry, occupation, certifications } = await request.json();

  // Build curriculum based on industry and certifications
  const recommendations: any[] = [];

  const industryMap: Record<string, string> = {
    healthcare: 'healthcare',
    medical: 'healthcare',
    nursing: 'healthcare',
    hvac: 'trades',
    electrician: 'trades',
    plumbing: 'trades',
    it: 'technology',
    tech: 'technology',
    cdl: 'transportation',
    driving: 'transportation',
  };

  const field = industryMap[industry?.toLowerCase()] || industry?.toLowerCase();

  if (field && FRAMEWORKS[field]) {
    const framework = FRAMEWORKS[field];
    recommendations.push({
      field,
      name: framework.name,
      body: framework.body,
      standards: framework.standards.map((s) => ({
        code: s.code,
        name: s.name,
        description: s.description,
        competencies: s.competencies || [],
        recommended: s.competencies?.length > 0,
      })),
    });
  }

  return NextResponse.json({
    query: { industry, occupation, certifications },
    recommendations,
    note: 'Use certifications endpoint for exam-specific requirements',
  });
}