"use client";

import React from 'react';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: string[];
  onFileSelect: (path: string) => void;
  selectedFile?: string;
  filterCourses?: boolean;
}

export default function FileTree({ files, onFileSelect, selectedFile, filterCourses }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'components', 'content']));

  // Build tree structure from flat file list
  const fileTree = useMemo(() => {
    let filteredFiles = files;

    // Filter to course files if requested
    if (filterCourses) {
      filteredFiles = files.filter(f =>
        f.startsWith('content/courses/') ||
        f.startsWith('lms-content/') ||
        f.includes('/courses/')
      );
    }

    const root: FileNode = { name: 'root', path: '', type: 'folder', children: [] };

    filteredFiles.forEach(filePath => {
      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');

        if (!current.children) {
          current.children = [];
        }

        let node = current.children.find(n => n.name === part);

        if (!node) {
          node = {
            name: part,
            path,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : []
          };
          current.children.push(node);
        }

        if (!isLast) {
          current = node;
        }
      });
    });

    // Sort: folders first, then files, alphabetically
    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.children) {
          sortNodes(node.children);
        }
      });
    };

    if (root.children) {
      sortNodes(root.children);
    }

    return root.children || [];
  }, [files, filterCourses]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-2 py-2 cursor-pointer hover:bg-slate-700 ${
            isSelected ? 'bg-brand-blue-600' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              <Folder className="w-4 h-4 flex-shrink-0 text-brand-blue-400" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 flex-shrink-0 text-gray-400" />
            </>
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto bg-white text-white">
      {fileTree.length === 0 ? (
        <div className="p-4 text-sm text-gray-400">
          {filterCourses ? 'No course files found' : 'No files found'}
        </div>
      ) : (
        fileTree.map(node => renderNode(node))
      )}
    </div>
  );
}
