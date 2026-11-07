'use client';
import { useEffect, useState } from 'react';
type GeneratedFile = { name: string; size: number };
export default function StudioGeneratedFiles() {
  const [files, setFiles] = useState<GeneratedFile[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [format, setFormat] = useState('docx'),
    [title, setTitle] = useState(''),
    [content, setContent] = useState('');
  async function refresh() {
    try {
      const response = await fetch('/api/admin/dev-studio/runtime?operation=artifacts', {
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Could not load your files.');
      setFiles(body.files || []);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load your files.');
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function create() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/runtime', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'artifact-create', format, title, content }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'File creation failed.');
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'File creation failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="h-full overflow-y-auto bg-white p-4 text-slate-950"
      aria-label="Generated Studio files"
    >
      <h2 className="text-xl font-bold">Create and download files</h2>
      <p className="my-2 text-sm text-slate-600">
        Create a Word document, PDF, spreadsheet or presentation from your content. Files stay in
        your Studio workspace.
      </p>
      <div className="my-4 grid gap-3">
        <label>
          File type
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="mt-1 block min-h-11 w-full rounded border p-2"
          >
            <option value="docx">Word document</option>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel spreadsheet</option>
            <option value="pptx">PowerPoint presentation</option>
          </select>
        </label>
        <label>
          Title
          <input
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 block min-h-11 w-full rounded border p-2"
          />
        </label>
        <label>
          {format === 'xlsx'
            ? 'Data (CSV with a header row)'
            : format === 'pptx'
              ? 'Slide content (separate slides with a blank line; first line is the slide title)'
              : 'Document content'}
          <textarea
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-1 block w-full rounded border p-2"
          />
        </label>
        <button
          type="button"
          disabled={busy || !title.trim() || !content.trim()}
          onClick={() => void create()}
          className="min-h-11 rounded bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Creating file…' : 'Create file'}
        </button>
      </div>
      {error && (
        <p role="alert" className="my-3 text-red-700">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Your generated files</h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="min-h-11 rounded border px-3"
        >
          Refresh files
        </button>
      </div>
      {!files.length && !error && (
        <p className="mt-3 text-slate-600">Your finished files will appear here.</p>
      )}
      <ul className="mt-3 space-y-2">
        {files.map((file) => (
          <li key={file.name} className="rounded border p-3">
            <a
              className="break-all font-semibold text-blue-700 underline"
              download
              href={
                '/api/admin/dev-studio/runtime?operation=artifact&name=' +
                encodeURIComponent(file.name)
              }
            >
              {file.name}
            </a>
            <p className="text-sm text-slate-600">{Math.ceil(file.size / 1024)} KB</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
