'use client';


import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Wind,
} from 'lucide-react';
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';


interface CfdProject {
  id: string;
  name: string;
  description?: string | null;
  solver: 'openfoam';
  status:
    | 'draft'
    | 'validating'
    | 'ready'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';
  created_at: string;
}


interface HealthPayload {
  capability: string;
  status:
    | 'healthy'
    | 'degraded'
    | 'unavailable';
  configured: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    required: boolean;
  }>;
}


export default function CfdStudioPanel() {
  const [projects, setProjects] = useState<CfdProject[]>([]);
  const [health, setHealth] =
    useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);


  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');


  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');


    try {
      const [
        projectsResponse,
        healthResponse,
      ] = await Promise.all([
        fetch('/api/admin/cfd-projects', {
          credentials: 'include',
          cache: 'no-store',
        }),


        fetch(
          '/api/admin/dev-studio/cfd/health',
          {
            credentials: 'include',
            cache: 'no-store',
          },
        ),
      ]);


      const projectsPayload =
        await projectsResponse.json();


      const healthPayload =
        await healthResponse.json();


      if (!projectsResponse.ok) {
        throw new Error(
          projectsPayload?.error?.message ??
            'Unable to load CFD projects.',
        );
      }


      setProjects(
        Array.isArray(projectsPayload.projects)
          ? projectsPayload.projects
          : [],
      );


      setHealth(healthPayload);
    } catch (loadError) {
      setProjects([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load CFD Studio.',
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadData();
  }, [loadData]);


  async function createProject(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    setSaving(true);
    setError('');


    try {
      const response = await fetch(
        '/api/admin/cfd-projects',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description:
              description.trim() || undefined,
            solver: 'openfoam',
            configuration: {
              analysisType:
                'steady-incompressible',
              fluid: {
                name: 'Air',
                densityKgM3: 1.225,
                dynamicViscosityPaS:
                  0.0000181,
              },
              boundaryConditions: [
                {
                  name: 'inlet',
                  type: 'inlet',
                  values: {
                    velocityMs: 1,
                  },
                },
                {
                  name: 'outlet',
                  type: 'outlet',
                  values: {
                    pressurePa: 0,
                  },
                },
                {
                  name: 'walls',
                  type: 'wall',
                  values: {
                    condition: 'no-slip',
                  },
                },
              ],
              mesh: {
                baseCellSize: 0.01,
                refinementLevel: 1,
              },
            },
            input_media_asset_ids: [],
          }),
        },
      );


      const payload = await response.json();


      if (!response.ok || !payload.ok) {
        throw new Error(
          payload?.error?.message ??
            'Unable to create CFD project.',
        );
      }


      setName('');
      setDescription('');
      setShowCreate(false);


      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to create CFD project.',
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Wind className="h-5 w-5" />
              CFD Studio
            </h2>


            <p className="text-sm text-slate-600">
              Configure validated OpenFOAM projects.
              Execution remains disabled until the
              isolated solver container is verified.
            </p>
          </div>


          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>


            <button
              type="button"
              onClick={() =>
                setShowCreate((current) => !current)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </div>
      </header>


      {health && (
        <div
          className={[
            'border-b px-4 py-3 text-sm',
            health.status === 'healthy'
              ? 'bg-green-50 text-green-900'
              : health.status === 'degraded'
                ? 'bg-amber-50 text-amber-900'
                : 'bg-red-50 text-red-900',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 font-medium">
            {health.status === 'healthy' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}


            CFD status: {health.status}
          </div>


          {!health.configured && (
            <ul className="mt-2 space-y-1">
              {health.checks
                .filter((check) => !check.passed)
                .map((check) => (
                  <li key={check.name}>
                    {check.message}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}


      {showCreate && (
        <form
          onSubmit={createProject}
          className="border-b bg-slate-50 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium">
                Project name
              </span>


              <input
                required
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>


            <label>
              <span className="mb-1 block text-sm font-medium">
                Description
              </span>


              <input
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>


          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}


            Create validated draft
          </button>
        </form>
      )}


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
          projects.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Activity className="mx-auto h-10 w-10 text-slate-400" />


              <h3 className="mt-3 font-semibold">
                No CFD projects
              </h3>


              <p className="mt-1 text-sm text-slate-600">
                Create a validated configuration.
                Simulation execution must remain disabled
                until the isolated OpenFOAM runner passes.
              </p>
            </div>
          )}


        {!loading &&
          !error &&
          projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {project.name}
                      </h3>


                      <p className="mt-1 text-sm text-slate-600">
                        {project.description ||
                          'No description'}
                      </p>
                    </div>


                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase">
                      {project.status}
                    </span>
                  </div>


                  <p className="mt-3 text-xs text-slate-500">
                    Solver: {project.solver}
                    {' · '}
                    Created{' '}
                    {new Date(
                      project.created_at,
                    ).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
