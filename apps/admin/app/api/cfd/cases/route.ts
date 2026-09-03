/**
 * CFD Case Generation API
 *
 * Generates OpenFOAM case files based on user configuration.
 * Used by the CFD Task Studio interface.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

interface CaseDirectory {
  [key: string]: { path: string; content: string };
}

interface CFDCase {
  id: string;
  name: string;
  caseType: string;
  solver: string;
  turbulence: string;
  systemDir?: CaseDirectory;
  constantDir?: CaseDirectory;
  zeroDir?: CaseDirectory;
}

function generateSystemDir(solver: string, turbulence: string): CaseDirectory {
  const entries: CaseDirectory = {};

  entries['system/controlDict'] = {
    path: 'system/controlDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     ${solver};

startFrom       startTime;
startTime       0;
stopAt          endTime;
endTime         1000;
deltaT          0.001;
writeControl    timeStep;
writeInterval   100;
purgeWrite      0;
writeFormat     ascii;
writePrecision  6;
writeCompression off;
timeFormat      general;
timePrecision  6;
runTimeModifiable true;

// ************************************************************************* //`,
  };

  entries['system/fvSchemes'] = {
    path: 'system/fvSchemes',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes     { default         Euler; }
gradSchemes    { default         Gauss linear; }
divSchemes     { default         Gauss linear; }
laplacianSchemes { default         Gauss linear corrected; }
interpolationSchemes { default         linear; }
snGradSchemes  { default         corrected; }

// ************************************************************************* //`,
  };

  entries['system/fvSolution'] = {
    path: 'system/fvSolution',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p { solver PCG; preconditioner DIC; tolerance 1e-6; relTol 0.05; }
    pFinal { $p; relTol 0; }
    "(U|k|epsilon|omega|nuTilda)" { solver smoothSolver; smoother symGaussSeidel; tolerance 1e-5; relTol 0; }
}

${turbulence === 'laminar' ? '' : `
SIMPLE
{
    nNonOrthogonalCorrectors 0;
    pRefCell 0;
    pRefValue 0;
}
`}

relaxationFactors { equations { ".*" 1; } }

// ************************************************************************* //`,
  };

  return entries;
}

function generateConstantDir(caseType: string, turbulence: string): CaseDirectory {
  const entries: CaseDirectory = {};

  entries['constant/transportProperties'] = {
    path: 'constant/transportProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "constant";
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

transportModel  Newtonian;
nu              [0 2 -1 0 0 0 0] 1e-05;
rho             [1 -3 0 0 0 0 0] 1;

// ************************************************************************* //`,
  };

  const turbulenceType = turbulence === 'laminar' ? 'laminar' : 'RAS';
  const rasModel = turbulence === 'kEpsilon' ? 'kEpsilon' : turbulence === 'kOmega' ? 'kOmega' : turbulence === 'kOmegaSST' ? 'kOmegaSST' : 'SpalartAllmaras';

  entries['constant/turbulenceProperties'] = {
    path: 'constant/turbulenceProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "constant";
    object      turbulenceProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  ${turbulenceType};

${turbulenceType === 'RAS' ? `
RAS
{
    RASModel        ${rasModel};
    turbulence      on;
    printCoeffs     on;
}
` : ''}

// ************************************************************************* //`,
  };

  entries['constant/g'] = {
    path: 'constant/g',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "constant";
    object      g;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

value           (0 0 0);

// ************************************************************************* //`,
  };

  return entries;
}

function generateZeroDir(): CaseDirectory {
  const entries: CaseDirectory = {};

  entries['0/U'] = {
    path: '0/U',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       vectorField;
    location    "0";
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];
internalField   uniform (1 0 0);

boundaryField
{
    inlet  { type fixedValue; value uniform (1 0 0); }
    outlet { type zeroGradient; }
    walls  { type noSlip; }
    frontAndBack { type empty; }
}

// ************************************************************************* //`,
  };

  entries['0/p'] = {
    path: '0/p',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       scalarField;
    location    "0";
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];
internalField   uniform 0;

boundaryField
{
    inlet  { type zeroGradient; }
    outlet { type fixedValue; value uniform 0; }
    walls  { type zeroGradient; }
    frontAndBack { type empty; }
}

// ************************************************************************* //`,
  };

  entries['0/k'] = {
    path: '0/k',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       scalarField;
    location    "0";
    object      k;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];
internalField   uniform 0.1;

boundaryField
{
    inlet  { type fixedValue; value uniform 0.1; }
    outlet { type zeroGradient; }
    walls  { type kqRWallFunction; value uniform 0.1; }
    frontAndBack { type empty; }
}

// ************************************************************************* //`,
  };

  entries['0/epsilon'] = {
    path: '0/epsilon',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| ========                 |  |                                                 |
| \\\\      /  F ield         | OpenFOAM                                         |
|  \\\\    /   O peration     | Version:  v2312                                  |
|   \\\\  /    A nd           | Web:     www.OpenFOAM.org                        |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       scalarField;
    location    "0";
    object      epsilon;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -3 0 0 0 0];
internalField   uniform 0.01;

boundaryField
{
    inlet  { type fixedValue; value uniform 0.01; }
    outlet { type zeroGradient; }
    walls  { type epsilonWallFunction; value uniform 0.01; }
    frontAndBack { type empty; }
}

// ************************************************************************* //`,
  };

  return entries;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, caseType, solver, turbulence } = body;

    if (!name || !caseType || !solver || !turbulence) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, caseType, solver, turbulence' },
        { status: 400 }
      );
    }

    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const cfdCase: CFDCase = {
      id: caseId,
      name: String(name),
      caseType: String(caseType),
      solver: String(solver),
      turbulence: String(turbulence),
      systemDir: generateSystemDir(String(solver), String(turbulence)),
      constantDir: generateConstantDir(String(caseType), String(turbulence)),
      zeroDir: generateZeroDir(),
    };

    return NextResponse.json({ success: true, data: cfdCase });
  } catch (err) {
    console.error('CFD case generation error:', err);
    return NextResponse.json(
      { success: false, error: 'Case generation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'CFD Case API. POST a case configuration to generate OpenFOAM files.',
      example: { name: 'channelFlow', caseType: 'incompressible', solver: 'simpleFoam', turbulence: 'kEpsilon' },
      supportedCaseTypes: ['incompressible', 'compressible', 'heat_transfer', 'multiphase'],
      supportedTurbulence: ['kEpsilon', 'kOmega', 'kOmegaSST', 'SpalartAllmaras', 'laminar'],
    },
  });
}
