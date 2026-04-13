"use client";

import dynamic from 'next/dynamic';

// Monaco is 75 MB — load only when the editor is actually rendered.
const Editor = dynamic(
  () => import('@monaco-editor/react').then(m => m.Editor),
  { ssr: false, loading: () => <div className="h-full bg-[#1e1e1e] animate-pulse" /> }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, language = 'typescript', readOnly = false }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
      }}
    />
  );
}
