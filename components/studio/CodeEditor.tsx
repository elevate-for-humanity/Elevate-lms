'use client';

import dynamic from 'next/dynamic';
import { detectDevStudioLanguage } from '@/lib/devstudio/language-registry';

// Monaco is large, so load it only when the editor is actually rendered.
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="h-full bg-[#1e1e1e] animate-pulse" />,
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  filePath?: string;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  filePath,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const resolvedLanguage = language ?? detectDevStudioLanguage(filePath);

  return (
    <Editor
      height="100%"
      language={resolvedLanguage}
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
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        bracketPairColorization: { enabled: true },
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        folding: true,
      }}
    />
  );
}
