"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  version: string;
  lastModified: string;
  author: string;
  versions: { version: string; date: string; author: string }[];
}

export function DocumentManagementSystem() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const documents: Document[] = [
    {
      id: '1',
      name: 'Course Syllabus.pdf',
      type: 'PDF',
      size: '2.4 MB',
      version: 'v3.0',
      lastModified: '2024-01-15',
      author: 'Dr. Sarah Chen',
      versions: [
        { version: 'v3.0', date: '2024-01-15', author: 'Dr. Sarah Chen' },
        { version: 'v2.0', date: '2024-01-10', author: 'Dr. Sarah Chen' },
        { version: 'v1.0', date: '2024-01-01', author: 'Dr. Sarah Chen' },
      ],
    },
    {
      id: '2',
      name: 'Assignment Guidelines.docx',
      type: 'DOCX',
      size: '1.2 MB',
      version: 'v2.0',
      lastModified: '2024-01-14',
      author: 'Alex Kim',
      versions: [
        { version: 'v2.0', date: '2024-01-14', author: 'Alex Kim' },
        { version: 'v1.0', date: '2024-01-05', author: 'Alex Kim' },
      ],
    },
    {
      id: '3',
      name: 'Project Requirements.xlsx',
      type: 'XLSX',
      size: '856 KB',
      version: 'v1.0',
      lastModified: '2024-01-12',
      author: 'Graduate',
      versions: [
        { version: 'v1.0', date: '2024-01-12', author: 'Graduate' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Document Management</h1>
          <p className="text-brand-red-100">Organize and version control your files</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Documents</h2>
          <Button>Upload Document</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedDoc?.id === doc.id ? 'bg-brand-red-50 border-2 border-brand-red-600' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">📄</div>
                        <div>
                          <h3 className="font-bold">{doc.name}</h3>
                          <p className="text-sm text-black">
                            {doc.type} • {doc.size} • {doc.version}
                          </p>
                          <p className="text-xs text-gray-500">
                            Modified {doc.lastModified} by {doc.author}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            {selectedDoc ? (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Version History</h3>
                <div className="space-y-3">
                  {selectedDoc.versions.map((version) => (
                    <div key={version.version} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold">{version.version}</span>
                        <Button size="sm" variant="secondary">Restore</Button>
                      </div>
                      <p className="text-xs text-black">{version.date}</p>
                      <p className="text-xs text-gray-500">by {version.author}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-gray-500">
                Select a document to view version history
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
