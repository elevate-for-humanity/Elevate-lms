"use client";

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type?: 'checkbox' | 'radio';
  defaultOpen?: boolean;
}

export interface FilterSidebarProps {
  groups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, optionId: string, checked: boolean) => void;
  onClearAll: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  groups,
  selectedFilters,
  onFilterChange,
  onClearAll,
  isMobile = false,
  isOpen = true,
  onClose,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter((g) => g.defaultOpen !== false).map((g) => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-black">Filters</h2>
          {totalSelectedCount > 0 && (
            <p className="text-sm text-black mt-0.5">
              {totalSelectedCount} selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalSelectedCount > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-brand-orange-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupSelections = selectedFilters[group.id] || [];

          return (
            <div key={group.id} className="border-b border-slate-200">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`filter-group-${group.id}`}
              >
                <span className="font-medium text-black">
                  {group.label}
                  {groupSelections.length > 0 && (
                    <span className="ml-2 text-sm text-brand-orange-600">
                      ({groupSelections.length})
                    </span>
                  )}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div 
                  id={`filter-group-${group.id}`}
                  role="group"
                  aria-label={`${group.label} filters`}
                  className="px-4 pb-4 space-y-2"
                >
                  {group.options.map((option) => {
                    const isChecked = groupSelections.includes(option.id);
                    const inputType = group.type || 'checkbox';

                    return (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type={inputType}
                          name={group.id}
                          checked={isChecked}
                          onChange={(e) =>
                            onFilterChange(group.id, option.id, e.target.checked)
                          }
                          className="h-4 w-4 text-brand-orange-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          aria-describedby={option.count !== undefined ? `${option.id}-count` : undefined}
                        />
                        <span className="flex-1 text-sm text-black group-hover:text-black">
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span id={`${option.id}-count`} className="text-sm text-slate-500">
                            {option.count}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {content}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="w-64 bg-white border border-slate-200 rounded-lg h-fit sticky top-4">
      {content}
    </div>
  );
};
