/**
 * CFD Cases API
 * Generate and manage OpenFOAM cases
 */

import { NextRequest, NextResponse } from 'next/server';
import { caseGenerator, dictionaryValidator } from '@/lib/cfd/service';
import type { CaseType, SolverType, TurbulenceModel, CaseSettings } from '@/lib/cfd/types';

// ============================================================================
// POST /api/cfd/cases - Generate new case
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, caseType, solver, turbulence, settings } = body;

    if (!name || !caseType || !solver || !turbulence) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const caseData = caseGenerator.generateCaseStructure(name, caseType, solver, turbulence, settings);

    return NextResponse.json({ success: true, data: caseData }, { status: 201 });
  } catch (error) {
    console.error('Error generating case:', error);
    return NextResponse.json(
      { success: false, error: { code: 'GENERATE_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/cfd/cases - Get case templates
// ============================================================================

export async function GET() {
  const templates = {
    incompressible: {
      solvers: ['icoFoam', 'simpleFoam', 'pisoFoam', 'pimpleFoam'],
      turbulence: ['kEpsilon', 'kOmega', 'kOmegaSST', 'SpalartAllmaras', 'laminar'],
    },
    compressible: {
      solvers: ['rhoSimpleFoam', 'rhoPisoFoam', 'sonicFoam'],
      turbulence: ['kEpsilon', 'kOmega', 'kOmegaSST'],
    },
    heat_transfer: {
      solvers: ['buoyantSimpleFoam', 'buoyantPimpleFoam', 'chtMultiRegionFoam'],
      turbulence: ['kEpsilon', 'kOmega', 'kOmegaSST'],
    },
    multiphase: {
      solvers: ['interFoam', 'multiphaseEulerFoam', 'settlingFoam'],
      turbulence: ['kEpsilon', 'laminar'],
    },
  };

  return NextResponse.json({ success: true, data: templates });
}
