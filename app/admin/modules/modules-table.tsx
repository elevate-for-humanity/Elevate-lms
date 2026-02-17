"use client";

import React from 'react';

import Link from 'next/link';
import { useState } from 'react';

interface Module {
  id: string;
  program_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_hours?: number;
  module_type: string;
  is_required: boolean;
  created_at: string;
  program?: {
    name: string;
    slug: string;
  };
  scorm_package?: Array<{
    id: string;
    title: string;
    version: string;
  }>;
}

interface Program {
  id: string;
  name: string;
  slug: string;
}

export function ModulesTable({
  modules,
  programs,
}: {
  modules: Module[];
  programs: Program[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.program?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram =
      filterProgram === 'all' || module.program_id === filterProgram;
    const matchesType =
      filterType === 'all' || module.module_type === filterType;

    return matchesSearch && matchesProgram && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scorm':
        return 'bg-brand-blue-100 text-brand-blue-800';
      case 'lesson':
        return 'bg-brand-green-100 text-brand-green-800';
      case 'assessment':
        return 'bg-brand-blue-100 text-brand-blue-800';
      case 'external':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <select
            value={filterProgram}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setFilterProgram(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="all">All Programs</option>
            {programs.map((program: any) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="all">All Types</option>
            <option value="lesson">Lessons</option>
            <option value="scorm">SCORM</option>
            <option value="assessment">Assessments</option>
            <option value="external">External</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Module
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Required
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredModules.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-black"
                >
                  No modules found
                </td>
              </tr>
            ) : (
              filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-black">
                        {module.title}
                      </div>
                      {module.description && (
                        <div className="text-sm text-black line-clamp-1">
                          {module.description}
                        </div>
                      )}
                      {module.scorm_package &&
                        module.scorm_package.length > 0 && (
                          <div className="text-xs text-brand-blue-600 mt-1">
                            SCORM: {module.scorm_package[0].title}
                          </div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {module.program?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-2 text-xs font-semibold rounded-full ${getTypeColor(module.module_type)}`}
                    >
                      {module.module_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    #{module.order_index}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {module.duration_hours ? `${module.duration_hours}h` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {module.is_required ? (
                      <span className="text-brand-green-600 font-medium">
                        • Required
                      </span>
                    ) : (
                      <span className="text-black">Optional</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/modules/${module.id}`}
                        className="text-brand-blue-600 hover:text-brand-blue-900"
                      >
                        Edit
                      </Link>
                      {module.module_type === 'scorm' && (
                        <Link
                          href={`/lms/programs/${module.program?.slug}/modules/${module.id}`}
                          target="_blank"
                          className="text-black hover:text-black"
                        >
                          Preview
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <p className="text-sm text-black">
          Showing <span className="font-medium">{filteredModules.length}</span>{' '}
          of <span className="font-medium">{modules.length}</span> modules
        </p>
      </div>
    </div>
  );
}
