"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Split from 'react-split';
import FileTree from '@/components/editor/FileTree';
import CodeEditor from '@/components/editor/CodeEditor';
import Terminal from '@/components/editor/Terminal';
export const dynamic = 'force-dynamic';

// Default file tree scaffold — replaced when user generates/loads a site project
const defaultFiles = [
  {
    name: 'app',
    path: '/app',
    type: 'directory' as const,
    children: [
      { name: 'page.tsx', path: '/app/page.tsx', type: 'file' as const },
      { name: 'layout.tsx', path: '/app/layout.tsx', type: 'file' as const },
    ],
  },
  {
    name: 'components',
    path: '/components',
    type: 'directory' as const,
    children: [
      {
        name: 'Header.tsx',
        path: '/components/Header.tsx',
        type: 'file' as const,
      },
      {
        name: 'Footer.tsx',
        path: '/components/Footer.tsx',
        type: 'file' as const,
      },
    ],
  },
  {
    name: 'lib',
    path: '/lib',
    type: 'directory' as const,
    children: [
      { name: 'utils.ts', path: '/lib/utils.ts', type: 'file' as const },
    ],
  },
  { name: 'package.json', path: '/package.json', type: 'file' as const },
  { name: 'README.md', path: '/README.md', type: 'file' as const },
];
// Template file contents for AI site builder scaffold
// Default template files for the AI site builder editor scaffold
const templateFileContents: Record<string, string> = {
  '/app/page.tsx': `export default async function HomePage() {
  const supabase: any = await createClient();

  const router = useRouter();
  useEffect(() => {
    // Check admin auth
    fetch('/api/auth/check-admin')
      .then(res => res.json())
      .then(data => {
        if (!data.isAdmin) {
          router.push('/login?redirect=/admin');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);
  return (
    <div>
      <div className="bg-white px-4 py-2">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Editor' }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-editor-detail.jpg"
          alt="Hero"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>
      <h1>Welcome to EFH</h1>
      <p>Edit this file to see changes</p>
    </div>
  );
}`,
  '/app/layout.tsx': `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
  '/components/Header.tsx': `export default function Header() {
  return <header>Header Component</header>;
}`,
  '/components/Footer.tsx': `export default function Footer() {
  return <footer>Footer Component</footer>;
}`,
  '/lib/utils.ts': `export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}`,
  '/package.json': `{
  "name": "efh-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`,
  '/README.md': `# EFH Project
This is your cloned codebase from Elevate For Humanity.
## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`,
};

export default function EditorPage() {
  const [selectedFile, setSelectedFile] = useState<string>('/app/page.tsx');
  const [fileContent, setFileContent] = useState<string>(
    templateFileContents['/app/page.tsx'] || ''
  );
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const handleFileSelect = (path: string) => {
    if (unsavedChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedFile(path);
    setFileContent(templateFileContents[path] || '// File content not available');
    setUnsavedChanges(false);
  };
  const handleContentChange = (value: string | undefined) => {
    setFileContent(value || '');
    setUnsavedChanges(true);
  };
  const handleSave = () => {
    // Save file locally (GitHub integration can be added later)
    templateFileContents[selectedFile] = fileContent;
    setUnsavedChanges(false);
    alert('File saved successfully!');
  };
  const handleCommand = async (command: string): Promise<string> => {
    // Command execution simulation
    if (command.startsWith('npm ')) {
      return `Running: ${command}\n• Command completed successfully`;
    }
    if (command.startsWith('git ')) {
      return `Running: ${command}\n• Git command executed`;
    }
    if (command === 'ls' || command === 'dir') {
      return 'app/\ncomponents/\nlib/\npackage.json\npublic/';
    }
    if (command === 'pwd') {
      return '/workspace/project';
    }
    return `$ ${command}\n• Command executed`;
  };
  const getLanguage = (path: string): string => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.css')) return 'css';
    return 'plaintext';
  };
  return (
    <div className="h-screen flex flex-col">

      {/* Hero Image */}
      {/* Header */}
      <div className="h-12 bg-slate-800 text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">EFH Code Editor</h1>
          <span className="text-sm text-black">{selectedFile}</span>
          {unsavedChanges && (
            <span className="text-xs bg-yellow-600 px-2 py-2 rounded">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!unsavedChanges}
            className="bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
          >
            Save
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm" aria-label="Action button">
            Run
          </button>
        </div>
      </div>
      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        <Split
          className="flex h-full"
          sizes={[20, 80]}
          minSize={150}
          gutterSize={4}
        >
          {/* File Tree */}
          <div className="h-full overflow-hidden">
            <FileTree
              files={defaultFiles}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          {/* Editor and Terminal */}
          <div className="h-full">
            <Split
              className="flex flex-col h-full"
              direction="vertical"
              sizes={[70, 30]}
              minSize={100}
              gutterSize={4}
            >
              {/* Code Editor */}
              <div className="h-full overflow-hidden">
                <CodeEditor
                  value={fileContent}
                  onChange={handleContentChange}
                  language={getLanguage(selectedFile)}
                />
              </div>
              {/* Terminal */}
              <div className="h-full overflow-hidden">
                <Terminal onCommand={handleCommand} />
              </div>
            </Split>
          </div>
        </Split>
        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Content Editor
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Edit course content, pages, and learning materials.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/editor"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                Open Editor
                </Link>
                <Link
                  href="/admin/courses"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Courses
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
