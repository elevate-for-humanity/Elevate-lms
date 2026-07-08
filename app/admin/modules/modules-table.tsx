'use client';

import { useState } from 'react';
import { Edit, Trash2, Plus, Search, BookOpen } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  program_id: string;
  order: number;
  duration_minutes: number;
  status: 'draft' | 'published' | 'archived';
}

interface Program {
  id: string;
  name: string;
}

interface ModulesTableProps {
  modules: Module[];
  programs: Program[];
}

export function ModulesTable({ modules, programs }: ModulesTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const getProgramName = (programId: string) => {
    return programs.find(p => p.id === programId)?.name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Published</span>;
      case 'draft': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Draft</span>;
      case 'archived': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Archived</span>;
      default: return status;
    }
  };

  const filteredModules = modules.filter(m => 
    (filter === 'all' || m.program_id === filter) &&
    (m.title.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Programs</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Module
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredModules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No modules found
                </td>
              </tr>
            ) : (
              filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{module.order}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{module.title}</p>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getProgramName(module.program_id)}</td>
                  <td className="px-4 py-3 text-gray-600">{module.duration_minutes} min</td>
                  <td className="px-4 py-3">{getStatusBadge(module.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
