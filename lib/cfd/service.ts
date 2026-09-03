/**
 * CFD Task Studio - Service Layer
 * Handles OpenFOAM case generation, validation, and execution
 */

import { createPublicClient } from '@/lib/supabase/server';
import type {
  OpenFOAMCase,
  CFDTaskDefinition,
  CFDJob,
  CaseType,
  SolverType,
  TurbulenceModel,
  BoundaryCondition,
  MeshQualityReport,
  CFDValidationReport,
  CFDCheckerResult,
  SolverLog,
  ToleranceCheck,
  CaseSettings,
} from './types';

const supabase = createPublicClient();

// ============================================================================
// CASE GENERATOR
// ============================================================================

export class CaseGenerator {
  /**
   * Generate OpenFOAM case folder structure
   */
  generateCaseStructure(
    name: string,
    caseType: CaseType,
    solver: string,
    turbulence: TurbulenceModel,
    settings: Partial<CaseSettings> = {}
  ): OpenFOAMCase {
    const id = `case_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    const defaultSettings: CaseSettings = {
      startTime: 0,
      endTime: 1,
      deltaT: 0.001,
      writeInterval: 0.1,
      purgeWrite: 10,
      precision: 'double',
      ...settings,
    };

    return {
      id,
      name,
      description: `OpenFOAM ${caseType} case using ${solver} solver with ${turbulence} turbulence model`,
      caseType,
      solver,
      turbulence,
      systemDir: this.generateSystemDir(solver, defaultSettings),
      constantDir: this.generateConstantDir(caseType, turbulence),
      zeroDir: this.generateZeroDir(caseType),
      timeDirs: [],
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
      createdBy: '',
    };
  }

  private generateSystemDir(solver: string, settings: CaseSettings) {
    return {
      controlDict: {
        path: 'system/controlDict',
        content: this.generateControlDict(solver, settings),
        validated: true,
        validationErrors: [],
      },
      fvSchemes: {
        path: 'system/fvSchemes',
        content: this.generateFvSchemes(),
        validated: true,
        validationErrors: [],
      },
      fvSolution: {
        path: 'system/fvSolution',
        content: this.generateFvSolution(),
        validated: true,
        validationErrors: [],
      },
    };
  }

  private generateConstantDir(caseType: CaseType, turbulence: TurbulenceModel) {
    const files: Record<string, unknown> = {
      transportProperties: {
        path: 'constant/transportProperties',
        content: this.generateTransportProperties(caseType),
        validated: true,
        validationErrors: [],
      },
      turbulenceProperties: {
        path: 'constant/turbulenceProperties',
        content: this.generateTurbulenceProperties(turbulence),
        validated: true,
        validationErrors: [],
      },
    };

    if (caseType === 'heat_transfer') {
      files.thermophysicalProperties = {
        path: 'constant/thermophysicalProperties',
        content: this.generateThermophysicalProperties(),
        validated: true,
        validationErrors: [],
      };
    }

    return files;
  }

  private generateZeroDir(caseType: CaseType) {
    const files: Record<string, unknown> = {
      U: {
        path: '0/U',
        content: this.generateVelocityField(),
        validated: true,
        validationErrors: [],
      },
      p: {
        path: '0/p',
        content: this.generatePressureField(),
        validated: true,
        validationErrors: [],
      },
    };

    if (caseType !== 'incompressible') {
      files.T = {
        path: '0/T',
        content: this.generateTemperatureField(),
        validated: true,
        validationErrors: [],
      };
    }

    return files;
  }

  private generateControlDict(solver: string, settings: CaseSettings): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
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

startTime       ${settings.startTime};

stopAt          endTime;

endTime         ${settings.endTime};

deltaT          ${settings.deltaT};

writeControl    timeStep;

writeInterval   ${Math.round(settings.writeInterval / settings.deltaT)};

purgeWrite      ${settings.purgeWrite};

writeFormat     ascii;

writePrecision  ${settings.precision === 'double' ? 12 : 6};

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable true;

// ************************************************************************* //
`;
  }

  private generateFvSchemes(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
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

ddtSchemes
{
    default         Euler;
}

gradSchemes
{
    default         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      Gauss linear;
    div(phi,k)      Gauss upwind;
    div(phi,epsilon) Gauss upwind;
    div(phi,omega)  Gauss upwind;
    div((nuEff*dev2(T(grad(U))))) Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear orthogonal;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         corrected;
}

// ************************************************************************* //
`;
  }

  private generateFvSolution(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
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
    p
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-6;
        relTol          0.05;
    }

    pFinal
    {
        $p;
        relTol          0;
    }

    "(U|k|epsilon|omega|nuTilda)"
    {
        solver          PBiCGStab;
        preconditioner  DILU;
        tolerance       1e-5;
        relTol          0;
    }
}

SIMPLE
{
    nNonOrthogonalCorrectors 2;
    pRefCell                 0;
    pRefValue                0;
}

relaxationFactors
{
    fields
    {
        p               0.3;
    }
    equations
    {
        U               0.7;
        k               0.7;
        epsilon         0.7;
        omega           0.7;
    }
}

// ************************************************************************* //
`;
  }

  private generateTransportProperties(caseType: CaseType): string {
    const viscosity = caseType === 'multiphase' ? '1e-06' : '1e-05';
    return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
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

nu              [0 2 -1 0 0 0 0] ${viscosity};

rho             [1 -3 0 0 0 0 0] 1.225;

// ************************************************************************* //
`;
  }

  private generateTurbulenceProperties(turbulence: TurbulenceModel): string {
    const simulationType = turbulence === 'laminar' ? 'laminar' : 'RAS';
    const RASModel = turbulence === 'kEpsilon' ? 'kEpsilon' 
      : turbulence === 'kOmega' ? 'kOmega'
      : turbulence === 'kOmegaSST' ? 'kOmegaSST'
      : turbulence === 'SpalartAllmaras' ? 'SpalartAllmaras'
      : 'kEpsilon';

    return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
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

simulationType  ${simulationType};

${simulationType === 'RAS' ? `
RAS
{
    RASModel        ${RASModel};
    turbulence      on;
    printCoeffs     on;
}
` : ''}

// ************************************************************************* //
`;
  }

  private generateThermophysicalProperties(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "constant";
    object      thermophysicalProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

thermoType
{
    type            heRhoThermo;
    mixture         pureMixture;
    transport       const;
    thermo          hConst;
    equationOfState perfectGas;
    specie          specie;
    energy          sensibleEnthalpy;
}

mixture
{
    specie
    {
        molWeight       28.96;
    }
    thermodynamics
    {
        Cp              1004.5;
        Hf              0;
    }
    transport
    {
        mu              1.8e-05;
        Pr              0.71;
    }
}

// ************************************************************************* //
`;
  }

  private generateVelocityField(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    location    "0";
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform (0 0 0);

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform (1 0 0);
    }
    outlet
    {
        type            zeroGradient;
    }
    wall
    {
        type            noSlip;
    }
}

// ************************************************************************* //
`;
  }

  private generatePressureField(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    location    "0";
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [1 -1 -2 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    inlet
    {
        type            zeroGradient;
    }
    outlet
    {
        type            fixedValue;
        value           uniform 0;
    }
    wall
    {
        type            zeroGradient;
    }
}

// ************************************************************************* //
`;
  }

  private generateTemperatureField(): string {
    return `/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    location    "0";
    object      T;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 0 0 1 0 0 0];

internalField   uniform 300;

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform 350;
    }
    outlet
    {
        type            zeroGradient;
    }
    hotWall
    {
        type            fixedValue;
        value           uniform 500;
    }
    coldWall
    {
        type            fixedValue;
        value           uniform 300;
    }
}

// ************************************************************************* //
`;
  }
}

// ============================================================================
// DICTIONARY VALIDATOR
// ============================================================================

export class DictionaryValidator {
  /**
   * Validate OpenFOAM dictionary syntax
   */
  validateDictionary(content: string, path: string): CFDCheckerResult[] {
    const errors: CFDCheckerResult[] = [];
    
    // Check for balanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        checkerId: 'brace-balance',
        checkerName: 'Brace Balance',
        passed: false,
        message: `Unbalanced braces in ${path}: ${openBraces} open, ${closeBraces} close`,
        severity: 'error',
      });
    }

    // Check for FoamFile header
    if (!content.includes('FoamFile')) {
      errors.push({
        checkerId: 'header-present',
        checkerName: 'FoamFile Header',
        passed: false,
        message: `Missing FoamFile header in ${path}`,
        severity: 'error',
      });
    }

    // Check for required fields based on file
    if (path.includes('controlDict')) {
      if (!content.includes('application')) {
        errors.push({
          checkerId: 'controlDict-application',
          checkerName: 'Application Specified',
          passed: false,
          message: 'Missing application in controlDict',
          severity: 'error',
        });
      }
    }

    // Check for common syntax errors
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Check for trailing semicolons on non-brace lines
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && 
          !trimmed.startsWith('*') && !trimmed.includes('{') && !trimmed.includes('}')) {
        if (trimmed.endsWith(';') === false && trimmed !== '') {
          // This might be intentional for some dictionary entries
        }
      }
    });

    return errors;
  }

  /**
   * Validate boundary conditions
   */
  validateBoundaryConditions(content: string, path: string): CFDCheckerResult[] {
    const errors: CFDCheckerResult[] = [];
    
    // Extract boundaryField section
    const boundaryMatch = content.match(/boundaryField\s*\{([^}]+)\}/s);
    if (!boundaryMatch) {
      errors.push({
        checkerId: 'boundaryField-present',
        checkerName: 'Boundary Field Present',
        passed: false,
        message: `No boundaryField section found in ${path}`,
        severity: 'error',
      });
      return errors;
    }

    const boundaryContent: string = boundaryMatch[1];
    
    // Check for common issues
    const validTypes = ['fixedValue', 'zeroGradient', 'noSlip', 'slip', 'symmetry', 'calculated', 'fixedFluxPressure'];
    
    // Extract each boundary
    const boundaries = boundaryContent.match(/\S+\s*\{[^}]+\}/g) || [];
    boundaries.forEach(boundary => {
      const name = boundary.match(/^(\S+)/)?.[1];
      if (name) {
        const typeMatch = boundary.match(/type\s+(\S+)/);
        if (!typeMatch) {
          errors.push({
            checkerId: 'boundary-type',
            checkerName: `Boundary Type: ${name}`,
            passed: false,
            message: `No type specified for boundary ${name}`,
            severity: 'error',
          });
        } else if (!validTypes.includes(typeMatch[1])) {
          errors.push({
            checkerId: 'boundary-type-valid',
            checkerName: `Boundary Type: ${name}`,
            passed: false,
            message: `Unknown boundary type: ${typeMatch[1]}`,
            severity: 'warning',
          });
        }
      }
    });

    return errors;
  }
}

// ============================================================================
// SOLVER LOG PARSER
// ============================================================================

export class SolverLogParser {
  /**
   * Parse OpenFOAM solver log
   */
  parseLog(logContent: string): SolverLog[] {
    const logs: SolverLog[] = [];
    const timeRegex = /^Time\s*=\s*([\d.eE+]+)/gm;
    const residualRegex = /^([A-Za-z]+)\s*=?\s*([\d.eE+-]+)/gm;

    let match;
    let currentLog: Partial<SolverLog> = {};

    while ((match = timeRegex.exec(logContent)) !== null) {
      if (Object.keys(currentLog).length > 0) {
        logs.push(currentLog as SolverLog);
      }
      currentLog = {
        timeStep: logs.length + 1,
        time: parseFloat(match[1]),
        residuals: {},
      };
    }

    // Reset and find residuals after time steps
    const timeSteps = logContent.split(/^Time\s*=\s*/m).slice(1);
    timeSteps.forEach((step, index) => {
      const lines = step.split('\n');
      let time = 0;
      const residuals: Record<string, number> = {};

      lines.forEach(line => {
        const timeMatch = line.match(/^([\d.eE+]+)/);
        if (timeMatch && !line.includes('=')) {
          time = parseFloat(timeMatch[1]);
        }

        const resMatch = line.match(/^([A-Za-z]+)\s+([\d.eE+-]+)/);
        if (resMatch) {
          residuals[resMatch[1]] = parseFloat(resMatch[2]);
        }
      });

      if (Object.keys(residuals).length > 0) {
        logs.push({
          timeStep: index + 1,
          time,
          executionTime: 0,
          residuals,
        });
      }
    });

    return logs;
  }

  /**
   * Check convergence based on residuals
   */
  checkConvergence(logs: SolverLog[], tolerance: number = 1e-3): boolean {
    if (logs.length === 0) return false;
    
    const lastLog = logs[logs.length - 1];
    if (!lastLog.residuals) return false;

    // Check if all residuals are below tolerance
    return Object.values(lastLog.residuals).every(res => res < tolerance);
  }
}

// ============================================================================
// CFD JOB SERVICE
// ============================================================================

export class CFDJobService {
  private caseGenerator = new CaseGenerator();
  private validator = new DictionaryValidator();
  private logParser = new SolverLogParser();

  /**
   * Submit CFD job to isolated worker
   */
  async submitJob(
    caseId: string,
    options: {
      cpuLimit?: number;
      memoryLimit?: number;
      timeLimit?: number;
    } = {}
  ): Promise<CFDJob> {
    const job: CFDJob = {
      id: `cfd_job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      caseId,
      status: 'pending',
      cpuLimit: options.cpuLimit || 4,
      memoryLimit: options.memoryLimit || 8192,
      timeLimit: options.timeLimit || 3600,
      output: '',
      createdAt: new Date().toISOString(),
      createdBy: '',
    };

    const { data, error } = await supabase
      .from('cfd_jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw new Error(`Failed to submit job: ${error.message}`);
    return data;
  }

  /**
   * Validate case against task requirements
   */
  async validateCase(
    caseData: OpenFOAMCase,
    task: CFDTaskDefinition
  ): Promise<CFDValidationReport> {
    const report: CFDValidationReport = {
      jobId: caseData.id,
      taskId: task.id,
      requiredFilesPresent: [],
      dictionarySyntaxValid: [],
      solverConverged: false,
      residualHistory: [],
      pass: false,
      evaluatedAt: new Date().toISOString(),
    };

    // Check required files
    for (const file of task.requiredFiles) {
      const present = this.checkFilePresent(caseData, file);
      report.requiredFilesPresent.push({
        checkerId: `file-${file}`,
        checkerName: `File: ${file}`,
        passed: present,
        message: present ? `File ${file} present` : `File ${file} missing`,
        severity: present ? 'info' : 'error',
      });
    }

    // Validate dictionaries
    const allDictionaries = {
      ...caseData.systemDir,
      ...caseData.constantDir,
      ...caseData.zeroDir,
    };

    for (const [name, dict] of Object.entries(allDictionaries)) {
      if (dict && 'content' in dict) {
        const errors = this.validator.validateDictionary(dict.content, dict.path);
        report.dictionarySyntaxValid.push(...errors.map(e => ({
          ...e,
          checkerId: `syntax-${name}`,
          checkerName: `Syntax: ${name}`,
        })));
      }
    }

    report.pass = 
      report.requiredFilesPresent.every(r => r.passed) &&
      report.dictionarySyntaxValid.every(r => r.passed);

    return report;
  }

  private checkFilePresent(caseData: OpenFOAMCase, file: string): boolean {
    const pathParts = file.split('/');
    const dir = pathParts[0];
    const fileName = pathParts[1] || pathParts[0];

    const directories: Record<string, Record<string, unknown>> = {
      system: caseData.systemDir as Record<string, unknown>,
      constant: caseData.constantDir as Record<string, unknown>,
      '0': caseData.zeroDir as Record<string, unknown>,
    };

    const targetDir = directories[dir];
    if (!targetDir) return false;

    return fileName in targetDir || dir in targetDir;
  }

  /**
   * Score CFD task result
   */
  scoreTaskResult(
    report: CFDValidationReport,
    rubric: CFDTaskDefinition['scoringRubric']
  ): number {
    let score = 0;

    // File setup (25% of score)
    const fileScore = report.requiredFilesPresent.filter(r => r.passed).length / 
                      Math.max(report.requiredFilesPresent.length, 1);
    score += fileScore * rubric.categories.caseSetup;

    // Syntax validation (25% of score)
    const syntaxScore = report.dictionarySyntaxValid.filter(r => r.passed).length /
                        Math.max(report.dictionarySyntaxValid.length, 1);
    score += syntaxScore * rubric.categories.boundaryConditions;

    // Solver convergence (50% of score)
    if (report.solverConverged) {
      score += rubric.categories.solverConvergence;
    } else if (report.residualHistory.length > 0) {
      // Partial credit for making progress
      score += (rubric.categories.solverConvergence * 0.5);
    }

    return Math.round(score);
  }
}

// Export singleton instances
export const caseGenerator = new CaseGenerator();
export const dictionaryValidator = new DictionaryValidator();
export const solverLogParser = new SolverLogParser();
export const cfdJobService = new CFDJobService();
