'use client';


import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';


interface EvaluationRun {
  id: string;
  evaluation_type: string;
  resource_type: string;
  resource_id: string;
  status: string;
  score?: number | null;
  findings: Array<{
    criterionId?: string;
    passed?: boolean;
    score?: number;
    evidence?: string;
  }>;
  created_at: string;
  total_cases?: number | null;
  passed_cases?: number | null;
  failed_cases?: number | null;
}


export default function EvaluationStudioPanel() {
  const [runs, setRuns] =
    useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError('');


    try {
      const response = await fetch(
        '/api/admin/dev-studio/evaluations',
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );


      const contentType = response.headers.get('content-type') ?? '';
      const rawBody = await response.text();
      if (!contentType.includes('application/json')) {
        throw new Error(`Evaluation service returned HTTP ${response.status} instead of JSON.`);
      }
      const payload = rawBody ? JSON.parse(rawBody) : {};


      if (!response.ok || !payload.ok) {
        throw new Error(
          payload?.error?.message ??
            'Unable to load evaluations.',
        );
      }


      setRuns(
        Array.isArray(payload.runs)
          ? payload.runs
          : [],
      );
    } catch (loadError) {
      setRuns([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load evaluations.',
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);


  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FlaskConical className="h-5 w-5" />
              Evaluations
            </h2>


            <p className="text-sm text-slate-600">
              Evidence-based AI, course, route,
              accessibility and workflow evaluations.
            </p>
          </div>


          <button
            type="button"
            onClick={() => void loadRuns()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>


      <div className="min-h-0 flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        )}


        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}


        {!loading &&
          !error &&
          runs.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <FlaskConical className="mx-auto h-10 w-10 text-slate-400" />


              <h3 className="mt-3 font-semibold">
                No evaluation runs
              </h3>


              <p className="mt-1 text-sm text-slate-600">
                Evaluations appear here only after a real
                resource is submitted and evidence is stored.
              </p>
            </div>
          )}


        {!loading &&
          !error &&
          runs.length > 0 && (
            <div className="space-y-3">
              {runs.map((run) => (
                <article
                  key={run.id}
                  className="rounded-xl border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {run.evaluation_type}
                      </h3>


                      <p className="mt-1 text-sm text-slate-600">
                        {run.resource_type}:{' '}
                        {run.resource_id}
                      </p>
                    </div>


                    <div className="flex items-center gap-2">
                      {run.status === 'passed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : run.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : null}


                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase">
                        {run.status}
                      </span>
                    </div>
                  </div>


                  {run.score !== null &&
                    run.score !== undefined && (
                      <p className="mt-3 font-medium">
                        Score: {run.score}
                      </p>
                  )}

                  {run.total_cases !== null && run.total_cases !== undefined && (
                    <p className="mt-2 text-sm text-slate-600">
                      Cases: {run.passed_cases ?? 0} passed · {run.failed_cases ?? 0} failed · {run.total_cases} total
                    </p>
                  )}


                  {Array.isArray(run.findings) &&
                    run.findings.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {run.findings.map(
                          (finding, index) => (
                            <li
                              key={`${run.id}-${index}`}
                              className="rounded-lg bg-slate-50 p-3 text-sm"
                            >
                              {finding.evidence ||
                                'Finding has no evidence.'}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                </article>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
