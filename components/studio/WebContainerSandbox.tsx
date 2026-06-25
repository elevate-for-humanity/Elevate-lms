'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Square, Terminal, Upload, FolderOpen, File, Trash2, RefreshCw } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

interface WebContainerSandboxProps {
  initialFiles?: FileNode[];
  onFileChange?: (files: FileNode[]) => void;
  onOutput?: (output: string) => void;
  className?: string;
}

export function WebContainerSandbox({
  initialFiles = [],
  onFileChange,
  onOutput,
  className = '',
}: WebContainerSandboxProps) {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Initialize the sandbox
  useEffect(() => {
    const init = async () => {
      try {
        // Check if WebContainer API is available
        if (typeof window !== 'undefined' && 'WebContainer' in window) {
          // @ts-ignore
          const { WebContainer } = await import('@webcontainer/api');
          // WebContainer would be initialized here
          // For now, we'll use a simulated environment
        }
        setIsReady(true);
        addOutput('Sandbox ready. You can create and run code here.');
      } catch (error) {
        console.error('Failed to initialize sandbox:', error);
        addOutput('Error: Could not initialize sandbox environment.');
      }
    };
    init();
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const addOutput = useCallback((text: string) => {
    setTerminalOutput(prev => [...prev, text]);
    onOutput?.(text);
  }, [onOutput]);

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file.name);
      setFileContent(file.content || '');
    }
  };

  const handleFileContentChange = (content: string) => {
    setFileContent(content);
    // Update file in tree
    setFiles(prev => updateFileInTree(prev, activeFile!, content));
    onFileChange?.(files);
  };

  const updateFileInTree = (
    nodes: FileNode[],
    fileName: string,
    content: string
  ): FileNode[] => {
    return nodes.map(node => {
      if (node.type === 'directory' && node.children) {
        return {
          ...node,
          children: updateFileInTree(node.children, fileName, content),
        };
      }
      if (node.name === fileName) {
        return { ...node, content };
      }
      return node;
    });
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      const newFile: FileNode = {
        name: fileName,
        type: 'file',
        content: '',
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFile(fileName);
      setFileContent('');
    }
  };

  const handleDeleteFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    if (activeFile === fileName) {
      setActiveFile(null);
      setFileContent('');
    }
  };

  const handleUploadFiles = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const content = await file.text();
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          content,
        };
        setFiles(prev => [...prev, newFile]);
        addOutput(`Uploaded: ${file.name}`);
      }
    };
    input.click();
  };

  const handleRun = async () => {
    if (!activeFile || !fileContent) {
      addOutput('Error: No file selected or file is empty.');
      return;
    }

    setIsRunning(true);
    addOutput(`Running ${activeFile}...`);

    // Simulate running the code
    // In a real implementation, this would use WebContainer or an execution service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Detect language from extension
    const ext = activeFile.split('.').pop()?.toLowerCase();
    
    if (ext === 'js' || ext === 'ts') {
      addOutput(`[Simulated] Running JavaScript/TypeScript...`);
      addOutput(`Output would appear here in a real sandbox environment.`);
    } else if (ext === 'py') {
      addOutput(`[Simulated] Running Python...`);
      addOutput(`Output would appear here in a real sandbox environment.`);
    } else {
      addOutput(`[Simulated] Executing ${activeFile}...`);
      addOutput(`Execution complete.`);
    }

    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    addOutput('Execution stopped.');
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.name} style={{ paddingLeft: depth * 16 }}>
        <button
          onClick={() => handleFileSelect(node)}
          className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 text-sm ${
            activeFile === node.name
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {node.type === 'directory' ? (
            <FolderOpen className="w-4 h-4 text-amber-500" />
          ) : (
            <File className="w-4 h-4 text-slate-400" />
          )}
          {node.name}
        </button>
        {node.type === 'directory' && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-white rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
        <button
          onClick={handleCreateFile}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
          title="New File"
        >
          <File className="w-4 h-4" />
        </button>
        <button
          onClick={handleUploadFiles}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
          title="Upload Files"
        >
          <Upload className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleRun}
          disabled={!activeFile || isRunning}
          className="p-1.5 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50"
          title="Run"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          className="p-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Tree */}
        <div className="w-48 border-r border-slate-700 overflow-y-auto p-2">
          {files.length === 0 ? (
            <p className="text-xs text-slate-500 p-2">No files yet</p>
          ) : (
            renderFileTree(files)
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {activeFile ? (
            <>
              <div className="px-3 py-1 bg-slate-800 text-xs text-slate-400 border-b border-slate-700">
                {activeFile}
                <button
                  onClick={() => handleDeleteFile(activeFile)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => handleFileContentChange(e.target.value)}
                className="flex-1 p-3 bg-slate-900 text-sm font-mono resize-none focus:outline-none"
                placeholder="// Write your code here..."
                spellCheck={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p className="text-sm">Select a file to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="h-40 border-t border-slate-700 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-xs text-slate-400">
          <Terminal className="w-3 h-3" />
          Terminal
          <button
            onClick={() => setTerminalOutput([])}
            className="ml-auto hover:text-white"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div
          ref={terminalRef}
          className="flex-1 p-2 overflow-y-auto font-mono text-xs"
        >
          {terminalOutput.map((line, i) => (
            <div key={i} className="text-green-400">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WebContainerSandbox;
