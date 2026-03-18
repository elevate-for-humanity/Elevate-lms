"use client";

import React from 'react';

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { getLanguageFromPath } from '@/lib/github';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  filePath?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, filePath, readOnly }: CodeEditorProps) {
  const [code, setCode] = useState(value);
  const [language, setLanguage] = useState('typescript');

  useEffect(() => {
    setCode(value);
  }, [value]);

  useEffect(() => {
    if (filePath) {
      setLanguage(getLanguageFromPath(filePath));
    }
  }, [filePath]);

  const handleChange = (newValue: string | undefined) => {
    const val = newValue ?? '';
    setCode(val);
    onChange(val);
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-brand-blue-700 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-500 mx-auto mb-4" />
              <div>Loading editor...</div>
            </div>
          </div>
        }
      />
    </div>
  );
}
