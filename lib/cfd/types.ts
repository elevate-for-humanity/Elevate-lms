/**
 * CFD Task Studio - Types for OpenFOAM workflow
 */

export type CaseType = 'incompressible' | 'compressible' | 'multiphase' | 'combustion' | 'heat_transfer' | 'dpm' | 'dem';
export type SolverType = 'simple' | 'piso' | 'pimple' | 'steadyState' | 'transient';
export type TurbulenceModel = 'kEpsilon' | 'kOmega' | 'kOmegaSST' | ' SpalartAllmaras' | 'laminar' | 'LES';
export type BoundaryType = 'patch' | 'wall' | 'symmetry' | 'inlet' | 'outlet' | 'fixedValue' | 'zeroGradient' | 'calculated';

export interface OpenFOAMCase {
  id: string;
  name: string;
  description: string;
  caseType: CaseType;
  solver: string;
  turbulence: TurbulenceModel;
  
  // File paths
  systemDir: CaseFiles;
  constantDir: CaseFiles;
  zeroDir: CaseFiles;
  timeDirs: string[];
  
  // Settings
  settings: CaseSettings;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CaseFiles {
  controlDict?: DictionaryFile;
  fvSchemes?: DictionaryFile;
  fvSolution?: DictionaryFile;
  thermophysicalProperties?: DictionaryFile;
  turbulenceProperties?: DictionaryFile;
  transportProperties?: DictionaryFile;
  mesh?: MeshFile;
}

export interface DictionaryFile {
  path: string;
  content: string;
  validated: boolean;
  validationErrors: string[];
}

export interface MeshFile {
  path: string;
  type: 'blockMesh' | 'snappyHexMesh' | 'cfMesh' | 'external';
  points?: number;
  cells?: number;
  boundaryPatches?: string[];
}

export interface CaseSettings {
  startTime: number;
  endTime: number;
  deltaT: number;
  writeInterval: number;
  purgeWrite: number;
  precision: 'single' | 'double';
  parallel?: {
    enabled: boolean;
    numberOfProcessors: number;
  };
}

export interface BoundaryCondition {
  name: string;
  type: BoundaryType;
  faces?: number;
  patchInfo?: Record<string, unknown>;
}

export interface CFDTaskDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  
  // Problem statement
  problemStatement: string;
  assumptions: string[];
  constraints: string[];
  
  // Case configuration
  caseType: CaseType;
  expectedSolver: string;
  expectedTurbulence: TurbulenceModel;
  
  // Reference solution
  referenceCaseId?: string;
  referenceResults?: ReferenceResults;
  
  // Validation
  requiredFiles: string[];
  requiredDictionaries: string[];
  toleranceChecks: ToleranceCheck[];
  
  // Scoring
  scoringRubric: CFDRubric;
  
  // Versioning
  version: number;
  status: 'draft' | 'active' | 'archived';
  
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceResults {
  residuals?: Record<string, number[]>;
  monitors?: Record<string, number[]>;
  forces?: { lift: number; drag: number; };
  fieldRanges?: Record<string, { min: number; max: number; }>;
}

export interface ToleranceCheck {
  id: string;
  name: string;
  type: 'residual' | 'monitor' | 'field_range' | 'force' | 'custom';
  field: string;
  tolerance: number;
  unit?: string;
  description: string;
}

export interface CFDRubric {
  categories: {
    caseSetup: number;      // 0-100: Files present, syntax correct
    boundaryConditions: number; // 0-100: BC types correct
    meshQuality: number;    // 0-100: Valid mesh
    solverConvergence: number; // 0-100: Residuals converged
    resultsAccuracy: number; // 0-100: Within tolerance
    documentation: number;   // 0-100: Problem/assumptions documented
  };
  passThreshold: number;
}

export interface CFDJob {
  id: string;
  taskId?: string;
  caseId: string;
  
  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  executionTime?: number;
  
  // Resources
  cpuLimit: number;
  memoryLimit: number;
  timeLimit: number;
  
  // Results
  output: string;
  logFile?: string;
  residuals?: Record<string, number[]>;
  fieldData?: Record<string, unknown>;
  
  // Errors
  errorMessage?: string;
  crashedNodes?: string[];
  
  createdAt: string;
  createdBy: string;
}

export interface SolverLog {
  timeStep: number;
  time: number;
  executionTime: number;
  residuals: Record<string, number>;
  continuityErrors?: Record<string, number>;
  CourantNumber?: number;
  deltaT?: number;
}

export interface MeshQualityReport {
  points: number;
  cells: number;
  internalFaces: number;
  boundaryPatches: {
    name: string;
    faces: number;
    type: string;
  }[];
  qualityMetrics?: {
    aspectRatio?: { min: number; max: number; average: number; };
    skewness?: { min: number; max: number; average: number; };
    nonOrthogonality?: { min: number; max: number; average: number; };
  };
  isValid: boolean;
  errors: string[];
}

export interface CFDCheckerResult {
  checkerId: string;
  checkerName: string;
  passed: boolean;
  message: string;
  details?: unknown;
  severity: 'error' | 'warning' | 'info';
}

export interface CFDValidationReport {
  jobId: string;
  taskId?: string;
  
  // File checks
  requiredFilesPresent: CFDCheckerResult[];
  dictionarySyntaxValid: CFDCheckerResult[];
  
  // Mesh checks
  meshQuality?: MeshQualityReport;
  
  // Solver checks
  solverConverged: boolean;
  residualHistory: SolverLog[];
  toleranceResults: CFDCheckerResult[];
  
  // Overall
  overallScore?: number;
  pass: boolean;
  evaluatedAt: string;
}
