'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { OpenFile, Settings } from '../types';

// Debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const DiffEditor = dynamic(() => import('@monaco-editor/react').then(m => ({ default: m.DiffEditor })), { ssr: false });

interface Comment {
  id: string;
  line_start: number;
  line_end?: number;
  content: string;
}

interface EditorProps {
  file: OpenFile | undefined;
  settings: Settings;
  onChange: (content: string) => void;
  onSave: () => void;
  splitFile?: OpenFile;
  showDiff?: boolean;
  comments?: Comment[];
  onAddComment?: (line: number, content: string) => void;
  enableAICompletion?: boolean;
}

export function Editor({ file, settings, onChange, onSave, splitFile, showDiff, comments, onAddComment, enableAICompletion }: EditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inlineCompletion, setInlineCompletion] = useState<string>('');

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Ctrl+S - Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
    
    // Ctrl+G - Go to line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      editor.trigger('keyboard', 'editor.action.gotoLine', {});
    });

    // Add comment on Ctrl+/
    if (onAddComment) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        const position = editor.getPosition();
        if (position) {
          const comment = prompt('Add comment:');
          if (comment) {
            onAddComment(position.lineNumber, comment);
          }
        }
      });
    }

    // AI completion on Tab when there's a suggestion
    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (inlineCompletion) {
        const position = editor.getPosition();
        if (position) {
          editor.executeEdits('ai-completion', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: inlineCompletion,
          }]);
          setInlineCompletion('');
        }
      } else {
        editor.trigger('keyboard', 'tab', {});
      }
    });

    // Request AI completion after typing pause
    if (enableAICompletion) {
      editor.onDidChangeModelContent(debounce(async () => {
        const model = editor.getModel();
        const position = editor.getPosition();
        if (!model || !position) return;

        const prefix = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const suffix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: model.getLineCount(),
          endColumn: model.getLineMaxColumn(model.getLineCount()),
        });

        // Only request if we have meaningful context
        if (prefix.length < 10) return;

        try {
          const res = await fetch('/api/studio/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prefix,
              suffix,
              language: file?.language,
              filename: file?.path,
            }),
          });
          const data = await res.json();
          if (data.completion && data.completion.length < 200) {
            setInlineCompletion(data.completion);
          }
        } catch {
          // AI completion request failed — silently ignore
        }
      }, 1000));
    }
  }, [onSave, onAddComment, enableAICompletion, file, inlineCompletion]);

  // Update decorations when comments change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !comments) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = comments.map(c => ({
      range: new monaco.Range(c.line_start, 1, c.line_end || c.line_start, 1),
      options: {
        isWholeLine: true,
        className: 'comment-line',
        glyphMarginClassName: 'comment-glyph',
        glyphMarginHoverMessage: { value: c.content },
        hoverMessage: { value: `💬 ${c.content}` },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [comments]);

  if (!file) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#888',
        flexDirection: 'column',
        gap: 8
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>📝</div>
        <div>Select a file to edit</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Ctrl+S to save • Ctrl+F to find</div>
      </div>
    );
  }

  // Show diff view
  if (showDiff && file.modified) {
    return (
      <DiffEditor
        height="100%"
        original={file.originalContent}
        modified={file.content}
        language={file.language}
        theme={settings.theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly: false,
          renderSideBySide: true,
          fontSize: settings.fontSize,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          minimap: { enabled: false },
        }}
        onMount={(editor) => {
          const modifiedEditor = editor.getModifiedEditor();
          modifiedEditor.onDidChangeModelContent(() => {
            onChange(modifiedEditor.getValue());
          });
        }}
      />
    );
  }

  // Split view with two files
  if (splitFile) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, borderRight: '1px solid #3c3c3c' }}>
          <MonacoEditor
            height="100%"
            language={file.language}
            value={file.content}
            onChange={v => onChange(v || '')}
            onMount={handleEditorMount}
            theme={settings.theme === 'dark' ? 'vs-dark' : 'vs'}
            options={{
              minimap: { enabled: false },
              fontSize: settings.fontSize,
              wordWrap: settings.wordWrap ? 'on' : 'off',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <MonacoEditor
            height="100%"
            language={splitFile.language}
            value={splitFile.content}
            theme={settings.theme === 'dark' ? 'vs-dark' : 'vs'}
            options={{
              minimap: { enabled: false },
              fontSize: settings.fontSize,
              wordWrap: settings.wordWrap ? 'on' : 'off',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: true,
            }}
          />
        </div>
      </div>
    );
  }

  // Normal single editor
  return (
    <MonacoEditor
      height="100%"
      language={file.language}
      value={file.content}
      onChange={v => onChange(v || '')}
      onMount={handleEditorMount}
      theme={settings.theme === 'dark' ? 'vs-dark' : 'vs'}
      options={{
        minimap: { enabled: settings.minimap },
        fontSize: settings.fontSize,
        wordWrap: settings.wordWrap ? 'on' : 'off',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
