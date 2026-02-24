'use client';

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Search, Star, X } from "lucide-react";

import { createBrowserClient } from '@supabase/ssr';
type ToolLink = {
  title: string;
  href: string;
  desc?: string;
  badge?: "TEST" | "POWER" | "AI" | "SYSTEM";
};

type ToolCategory = {
  title: string;
  desc: string;
  items: ToolLink[];
};

const CATEGORIES: ToolCategory[] = [
  {
    title: "Automation & Workflows",
    desc: "Rule-driven tools that can trigger operational outcomes. Use with documented oversight.",
    items: [
      { title: "Automation", href: "/admin/automation", badge: "POWER" },
      { title: "Autopilot (Canonical)", href: "/admin/autopilot", badge: "POWER" },
      { title: "Autopilots (Legacy)", href: "/admin/autopilots", badge: "POWER", desc: "Keep temporarily if still referenced." },
      { title: "Workflows", href: "/admin/workflows", badge: "POWER" },
      { title: "Next Steps", href: "/admin/next-steps" },
      { title: "Operations", href: "/admin/operations" },
    ],
  },
  {
    title: "AI Tools",
    desc: "Assisted tooling. Any automated decisions must remain human-reviewed.",
    items: [
      { title: "AI Console", href: "/admin/ai-console", badge: "AI" },
      { title: "Copilot", href: "/admin/copilot", badge: "AI" },
      { title: "Course Generator (AI)", href: "/admin/course-generator", badge: "AI" },
      { title: "Course Generator", href: "/admin/course-generator", badge: "AI" },
      { title: "Program Generator", href: "/admin/program-generator", badge: "AI" },
      { title: "Syllabus Generator", href: "/admin/syllabus-generator", badge: "AI" },
      { title: "Video Generator", href: "/admin/video-generator", badge: "AI" },
    ],
  },
  {
    title: "Authoring & Builders",
    desc: "Internal content-building surfaces. Active in production, but not daily operational workflows.",
    items: [
      { title: "Course Authoring", href: "/admin/course-authoring" },
      { title: "Course Builder", href: "/admin/course-builder" },
      { title: "Course Import", href: "/admin/course-import" },
      { title: "Lessons", href: "/admin/lessons" },
      { title: "Quizzes", href: "/admin/quizzes" },
      { title: "Course Templates", href: "/admin/course-templates" },
      { title: "Editor", href: "/admin/editor" },
      { title: "Quiz Builder", href: "/admin/quiz-builder" },
      { title: "Video Manager", href: "/admin/video-manager" },
      { title: "Media Studio", href: "/admin/media-studio" },
    ],
  },
  {
    title: "Data, Imports, Processing",
    desc: "High-impact tools that can change records at scale. Treat as governed operations.",
    items: [
      { title: "Data Import", href: "/admin/data-import", badge: "POWER" },
      { title: "Import", href: "/admin/import", badge: "POWER" },
      { title: "Data Processor", href: "/admin/data-processor", badge: "POWER" },
      { title: "Documents", href: "/admin/documents" },
      { title: "Files", href: "/admin/files" },
      { title: "Hours Export", href: "/admin/hours-export", badge: "POWER" },
    ],
  },
  {
    title: "System Health & Monitoring",
    desc: "Visibility into uptime and system state. Keep accessible, but not in primary nav.",
    items: [
      { title: "System Health", href: "/admin/system-health", badge: "SYSTEM" },
      { title: "System Monitor", href: "/admin/system-monitor", badge: "SYSTEM" },
      { title: "System Status", href: "/admin/system-status", badge: "SYSTEM" },
      { title: "Monitoring", href: "/admin/monitoring", badge: "SYSTEM" },
      { title: "Site Health", href: "/admin/site-health", badge: "SYSTEM" },
    ],
  },
  {
    title: "Test & Verification Tools",
    desc: "Operational test tools. Active, but should clearly indicate they are test surfaces.",
    items: [
      { title: "Test Webhook", href: "/admin/test-webhook", badge: "TEST" },
      { title: "Test Payments", href: "/admin/test-payments", badge: "TEST" },
      { title: "Test Funding", href: "/admin/test-funding", badge: "TEST" },
      { title: "Test Emails", href: "/admin/test-emails", badge: "TEST" },
      { title: "Dev Studio", href: "/admin/dev-studio", badge: "TEST" },
    ],
  },
];

const STORAGE_KEY = "elevate-admin-pinned-tools";

function Badge({ kind }: { kind: NonNullable<ToolLink["badge"]> }) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  const byKind: Record<typeof kind, string> = {
    TEST: "border-brand-red-200 text-brand-red-700 bg-brand-red-50",
    POWER: "border-amber-200 text-amber-800 bg-amber-50",
    AI: "border-indigo-200 text-indigo-800 bg-indigo-50",
    SYSTEM: "border-slate-200 text-slate-800 bg-slate-50",
  };
  return <span className={`${base} ${byKind[kind]}`}>{kind}</span>;
}

function ToolCard({ 
  item, 
  isPinned, 
  onTogglePin 
}: { 
  item: ToolLink; 
  isPinned: boolean; 
  onTogglePin: (href: string) => void;
}) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <button
        onClick={(e) => {
          e.preventDefault();
          onTogglePin(item.href);
        }}
        className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${
          isPinned 
            ? "text-yellow-500 hover:text-yellow-600" 
            : "text-gray-300 hover:text-gray-400"
        }`}
        title={isPinned ? "Unpin from favorites" : "Pin to favorites"}
      >
        <Star className={`w-4 h-4 ${isPinned ? "fill-current" : ""}`} />
      </button>
      <Link href={item.href} className="block">
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="space-y-1">
            <div className="text-base font-semibold text-gray-900">{item.title}</div>
            {item.desc && <div className="text-sm text-gray-600">{item.desc}</div>}
            <div className="text-xs text-gray-500">{item.href}</div>
          </div>
          {item.badge && <Badge kind={item.badge} />}
        </div>
      </Link>
    </div>
  );
}

export default function AdvancedToolsPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('settings').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [search, setSearch] = useState("");
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);

  // Load pinned tools from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPinnedTools(JSON.parse(stored));
      } catch {
        setPinnedTools([]);
      }
    }
  }, []);

  // Save pinned tools to localStorage
  const togglePin = (href: string) => {
    setPinnedTools((prev) => {
      const next = prev.includes(href) 
        ? prev.filter((h) => h !== href) 
        : [...prev, href];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Get all tools flattened for search
  const allTools = useMemo(() => {
    return CATEGORIES.flatMap((cat) => 
      cat.items.map((item) => ({ ...item, category: cat.title }))
    );
  }, []);

  // Filter tools based on search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    
    const q = search.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          item.desc?.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  // Get pinned tools as items
  const pinnedItems = useMemo(() => {
    return allTools.filter((tool) => pinnedTools.includes(tool.href));
  }, [allTools, pinnedTools]);

  const totalTools = allTools.length;
  const visibleTools = filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Advanced Tools</h1>
        <p className="text-base text-gray-600">
          Non-routine admin surfaces. Everything here is active. Use intentionally.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        {search ? `${visibleTools} of ${totalTools} tools` : `${totalTools} tools`}
        {pinnedItems.length > 0 && ` · ${pinnedItems.length} pinned`}
      </div>

      {/* Pinned Tools */}
      {pinnedItems.length > 0 && !search && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <h2 className="text-lg font-semibold text-gray-900">Pinned</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pinnedItems.map((item) => (
              <ToolCard
                key={item.href}
                item={item}
                isPinned={true}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <div className="space-y-8">
        {filteredCategories.map((cat) => (
          <section key={cat.title} className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">{cat.title}</h2>
              <p className="text-sm text-gray-600">{cat.desc}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {cat.items.map((item) => (
                <ToolCard
                  key={item.href + item.title}
                  item={item}
                  isPinned={pinnedTools.includes(item.href)}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tools match "{search}"
        </div>
      )}
    </div>
  );
}
