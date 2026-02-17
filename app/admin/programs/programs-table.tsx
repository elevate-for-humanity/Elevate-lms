"use client";

import React from 'react';

import Link from 'next/link';
import { useState } from 'react';

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  featured: boolean;
  duration_hours?: number;
  price?: number;
  created_at: string;
  modules?: { count: number }[];
}

export function ProgramsTable({ programs }: { programs: Program[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && program.is_active) ||
      (filterStatus === 'inactive' && !program.is_active);
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
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
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
            <option value="all">All Programs</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
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
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPrograms.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-black"
                >
                  No programs found
                </td>
              </tr>
            ) : (
              filteredPrograms.map((program: any) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-black">
                        {program.name}
                      </div>
                      <div className="text-sm text-black">
                        {program.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {program.is_active ? (
                        <span className="px-2 py-2 text-xs font-semibold rounded-full bg-brand-green-100 text-brand-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-2 text-xs font-semibold rounded-full bg-gray-100 text-black">
                          Inactive
                        </span>
                      )}
                      {program.featured && (
                        <span className="px-2 py-2 text-xs font-semibold rounded-full bg-brand-blue-100 text-brand-blue-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.modules?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.duration_hours
                      ? `${program.duration_hours}h`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {program.price
                      ? `$${program.price.toLocaleString()}`
                      : 'Free'}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {new Date(program.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/programs/${program.slug}`}
                        className="text-brand-blue-600 hover:text-brand-blue-900"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/programs/${program.slug}`}
                        target="_blank"
                        className="text-black hover:text-black"
                      >
                        View
                      </Link>
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
          Showing <span className="font-medium">{filteredPrograms.length}</span>{' '}
          of <span className="font-medium">{programs.length}</span> programs
        </p>
      </div>
    </div>
  );
}
