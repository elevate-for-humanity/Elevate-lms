'use client';

import { useState, useEffect } from 'react';

interface CFDCase {
  id: string;
  name: string;
  caseType: string;
  solver: string;
  turbulence: string;
  systemDir?: Record<string, { path: string; content: string }>;
  constantDir?: Record<string, { path: string; content: string }>;
  zeroDir?: Record<string, { path: string; content: string }>;
}

interface Tab {
  id: string;
  label: string;
  content: string;
}

export default function CFDStudioPage() {
  const [activeView, setActiveView] = useState<'generator' | 'validator' | 'jobs'>('generator');
  const [generatedCase, setGeneratedCase] = useState<CFDCase | null>(null);
  const [activeFile, setActiveFile] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<{ passed: boolean; errors: string[] } | null>(null);

  const caseTypes = [
    { value: 'incompressible', label: 'Incompressible', solvers: ['simpleFoam', 'pisoFoam', 'pimpleFoam', 'icoFoam'] },
    { value: 'compressible', label: 'Compressible', solvers: ['rhoSimpleFoam', 'rhoPisoFoam', 'sonicFoam'] },
    { value: 'heat_transfer', label: 'Heat Transfer', solvers: ['buoyantSimpleFoam', 'buoyantPimpleFoam', 'chtMultiRegionFoam'] },
    { value: 'multiphase', label: 'Multiphase', solvers: ['interFoam', 'multiphaseEulerFoam'] },
  ];

  const turbulenceModels = [
    { value: 'kEpsilon', label: 'k-epsilon' },
    { value: 'kOmega', label: 'k-omega' },
    { value: 'kOmegaSST', label: 'k-omega SST' },
    { value: 'SpalartAllmaras', label: 'Spalart-Allmaras' },
    { value: 'laminar', label: 'Laminar' },
  ];

  const generateCase = async (name: string, caseType: string, solver: string, turbulence: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/cfd/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, caseType, solver, turbulence }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCase(data.data);
        const firstDict = Object.values(data.data.systemDir || {})[0];
        if (firstDict) {
          setActiveFile({ id: firstDict.path, label: firstDict.path.split('/')[1], content: firstDict.content });
        }
      }
    } catch (error) {
      console.error('Failed to generate case:', error);
    }
    setLoading(false);
  };

  const downloadCase = () => {
    if (!generatedCase) return;
    const files: Record<string, string> = {};
    
    if (generatedCase.systemDir) {
      Object.values(generatedCase.systemDir).forEach(dict => {
        files[dict.path] = dict.content;
      });
    }
    if (generatedCase.constantDir) {
      Object.values(generatedCase.constantDir).forEach(dict => {
        files[dict.path] = dict.content;
      });
    }
    if (generatedCase.zeroDir) {
      Object.values(generatedCase.zeroDir).forEach(dict => {
        files[dict.path] = dict.content;
      });
    }

    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedCase.name}-openfoam-case.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allFiles: Tab[] = [
    ...Object.values(generatedCase?.systemDir || {}).map(d => ({ id: d.path, label: d.path.split('/')[1], content: d.content })),
    ...Object.values(generatedCase?.constantDir || {}).map(d => ({ id: d.path, label: d.path.split('/')[1], content: d.content })),
    ...Object.values(generatedCase?.zeroDir || {}).map(d => ({ id: d.path, label: d.path.split('/')[1], content: d.content })),
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                CFD Task Studio
              </h1>
              <p className="text-sm text-gray-400 mt-1">OpenFOAM case generation and validation</p>
            </div>
            <nav className="flex space-x-1">
              {[
                { id: 'generator', label: 'Case Generator' },
                { id: 'validator', label: 'Dictionary Validator' },
                { id: 'jobs', label: 'Job Queue' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as typeof activeView)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeView === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {activeView === 'generator' && (
          <div className="grid grid-cols-3 gap-6">
            <CaseGeneratorPanel
              caseTypes={caseTypes}
              turbulenceModels={turbulenceModels}
              onGenerate={generateCase}
              loading={loading}
            />
            <div className="col-span-2">
              {generatedCase ? (
                <CaseViewer
                  caseData={generatedCase}
                  files={allFiles}
                  activeFile={activeFile}
                  onSelectFile={setActiveFile}
                  onDownload={downloadCase}
                />
              ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-400">No case generated</h3>
                  <p className="mt-2 text-sm text-gray-500">Configure your case parameters and click Generate</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'validator' && (
          <DictionaryValidatorPanel onValidate={(results) => setValidationResults(results)} />
        )}

        {activeView === 'jobs' && (
          <JobQueuePanel />
        )}
      </div>
    </div>
  );
}

function CaseGeneratorPanel({
  caseTypes,
  turbulenceModels,
  onGenerate,
  loading,
}: {
  caseTypes: { value: string; label: string; solvers: string[] }[];
  turbulenceModels: { value: string; label: string }[];
  onGenerate: (name: string, type: string, solver: string, turbulence: string) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('channelFlow');
  const [caseType, setCaseType] = useState('incompressible');
  const [solver, setSolver] = useState('simpleFoam');
  const [turbulence, setTurbulence] = useState('kEpsilon');

  const selectedCaseType = caseTypes.find(t => t.value === caseType);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4">Case Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Case Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Case Type</label>
          <select
            value={caseType}
            onChange={(e) => {
              setCaseType(e.target.value);
              setSolver(caseTypes.find(t => t.value === e.target.value)?.solvers[0] || '');
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {caseTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Solver</label>
          <select
            value={solver}
            onChange={(e) => setSolver(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {selectedCaseType?.solvers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Turbulence Model</label>
          <select
            value={turbulence}
            onChange={(e) => setTurbulence(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {turbulenceModels.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onGenerate(name, caseType, solver, turbulence)}
          disabled={loading}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Case
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CaseViewer({
  caseData,
  files,
  activeFile,
  onSelectFile,
  onDownload,
}: {
  caseData: CFDCase;
  files: Tab[];
  activeFile: Tab | null;
  onSelectFile: (file: Tab) => void;
  onDownload: () => void;
}) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-white">{caseData.name}</span>
          <span className="px-2 py-0.5 text-xs bg-cyan-900 text-cyan-300 rounded">{caseData.caseType}</span>
          <span className="text-sm text-gray-400">{caseData.solver}</span>
        </div>
        <button
          onClick={onDownload}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded transition"
        >
          Download Case
        </button>
      </div>
      <div className="flex h-96">
        <div className="w-48 bg-gray-750 border-r border-gray-700 overflow-y-auto">
          <div className="p-2">
            {['system', 'constant', '0'].map((dir) => (
              <div key={dir} className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">{dir}</div>
                {files
                  .filter(f => f.id.startsWith(dir))
                  .map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onSelectFile(file)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded ${
                        activeFile?.id === file.id ? 'bg-cyan-900 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {file.label}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {activeFile ? (
            <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">{activeFile.content}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Select a file to view</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DictionaryValidatorPanel({
  onValidate,
}: {
  onValidate: (results: { passed: boolean; errors: string[] }) => void;
}) {
  const [content, setContent] = useState('');
  const [results, setResults] = useState<{ passed: boolean; errors: string[] } | null>(null);

  const validate = () => {
    const errors: string[] = [];
    
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Brace mismatch: ${openBraces} open, ${closeBraces} close`);
    }

    if (!content.includes('FoamFile')) {
      errors.push('Missing FoamFile header');
    }

    if (content.includes('FoamFile') && !content.includes('class')) {
      errors.push('FoamFile missing class definition');
    }

    setResults({ passed: errors.length === 0, errors });
    onValidate({ passed: errors.length === 0, errors });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Dictionary Content</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste OpenFOAM dictionary content here..."
          className="w-full h-96 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-gray-300 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={validate}
          className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
        >
          Validate Syntax
        </button>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Validation Results</h2>
        <div className={`p-6 rounded-lg border ${results?.passed ? 'bg-green-900 border-green-700' : 'bg-red-900 border-red-700'}`}>
          {results ? (
            results.passed ? (
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-green-300">Valid Dictionary</div>
                  <div className="text-sm text-green-400">No syntax errors found</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="font-medium text-red-300">{results.errors.length} Error(s) Found</div>
                </div>
                <ul className="space-y-2">
                  {results.errors.map((error, i) => (
                    <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )
          ) : (
            <div className="text-gray-400">Paste content and click Validate</div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobQueuePanel() {
  const [jobs] = useState<{ id: string; status: string; createdAt: string }[]>([]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4">CFD Job Queue</h2>
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4">No jobs in queue</p>
          <p className="text-sm text-gray-600 mt-1">Submit a case to start a CFD job</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
              <div>
                <span className="font-mono text-sm text-gray-400">{job.id}</span>
                <span className="ml-3 px-2 py-0.5 text-xs rounded bg-yellow-900 text-yellow-300">{job.status}</span>
              </div>
              <span className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
