'use client';

import React from 'react';

import Link from 'next/link';
import { useState } from 'react';

interface Program {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  description?: string;
  is_active: boolean;
  published: boolean;
  featured: boolean;
  /** DB column is 'hours' — duration_hours does not exist */
  hours?: number;
  duration_weeks?: number;
  price?: number;
  created_at: string;
  modules?: { count: number }[];
}

export function ProgramsTable({
  programs,
  programCourseMap = {},
}: {
  programs: Program[];
  programCourseMap?: Record<string, string>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'unpublished'>('published');

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      ((program.title || program.name) ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.slug ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'published' && program.published) ||
      (filterStatus === 'unpublished' && !program.published);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
            ) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Modules
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredPrograms.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-black">
                  No programs found
                </td>
              </tr>
            ) : (
              filteredPrograms.map((program: any) => (
                <tr key={program.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-black">{program.title || program.name}</div>
                      <div className="text-sm text-black">{program.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {program.published ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-brand-green-100 text-brand-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Unpublished
                        </span>
                      )}
                      {program.featured && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-brand-blue-100 text-brand-blue-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.modules?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.hours ? `${program.hours}h` : program.duration_weeks ? `${program.duration_weeks}wk` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.price ? `$${program.price.toLocaleString()}` : 'Free'}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {new Date(program.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/studio?program=${program.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red-700 transition-colors"
                      >
                        ✦ Build Course
                      </Link>
                      <Link
                        href={`/admin/programs/${program.slug}/manage`}
                        className="text-brand-blue-600 hover:text-brand-blue-900"
                      >
                        Edit
                      </Link>
                      {programCourseMap[program.id] ? (
                        <Link
                          href={`${process.env.NEXT_PUBLIC_SITE_URL}/lms/courses/${programCourseMap[program.id]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-800 font-medium"
                          title="View LMS course"
                        >
                          Course
                        </Link>
                      ) : (
                        <Link
                          href={`${process.env.NEXT_PUBLIC_SITE_URL}/programs/${program.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-700"
                          title="View public program page"
                        >
                          View
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
      <div className="px-6 py-4 border-t bg-slate-50">
        <p className="text-sm text-black">
          Showing <span className="font-medium">{filteredPrograms.length}</span> of{' '}
          <span className="font-medium">{programs.length}</span> programs
        </p>
      </div>
    </div>
  );
}
