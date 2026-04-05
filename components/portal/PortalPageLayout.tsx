'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface StatCard {
  image: string;
  value: number | string;
  label: string;
  color?: string;
}

interface ActionCard {
  image: string;
  title: string;
  description: string;
  href: string;
}

interface PortalPageLayoutProps {
  title: string;
  subtitle: string;
  videoSrc: string;
  posterSrc: string;
  gradientFrom?: string;
  gradientTo?: string;
  stats?: StatCard[];
  actions?: ActionCard[];
  children?: React.ReactNode;
}

export function PortalPageLayout({
  title,
  subtitle,
  videoSrc,
  posterSrc,
  gradientFrom = 'from-indigo-900/85',
  gradientTo = 'to-purple-800/75',
  stats,
  actions,
  children,
}: PortalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — video frame only */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <CanonicalVideo
          src={videoSrc}
          poster={posterSrc}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </section>

      {/* Below-hero identity */}
      <section className="border-b border-slate-100 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">{title}</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">{subtitle}</p>
        </div>
      </section>

      {/* Stats Cards with Images */}
      {stats && stats.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`grid md:grid-cols-${Math.min(stats.length, 4)} gap-6 mb-12`}>
              {stats.map((stat, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-lg bg-white">
                  <Image
                    src={stat.image}
                    alt={stat.label}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      {actions && actions.length > 0 && (
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className={`grid md:grid-cols-${Math.min(actions.length, 4)} gap-4`}>
              {actions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={action.image}
                      alt={action.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                     sizes="100vw" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{action.title}</h3>
                    <p className="text-slate-600 text-sm">{action.description}</p>
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm mt-2 group-hover:gap-2 transition-all">
                      Open <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom Content */}
      {children}
    </div>
  );
}

export function PortalDataTable({
  columns,
  data,
  emptyImage,
  emptyMessage,
  emptyAction,
}: {
  columns: { key: string; label: string; render?: (item: any) => React.ReactNode }[];
  data: any[];
  emptyImage?: string;
  emptyMessage?: string;
  emptyAction?: { label: string; href: string };
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
        {emptyImage && (
          <Image
            src={emptyImage}
            alt="No data"
            width={200}
            height={150}
            className="mx-auto rounded-lg mb-4 opacity-50"
          />
        )}
        <p className="text-slate-500">{emptyMessage || 'No data found'}</p>
        {emptyAction && (
          <Link
            href={emptyAction.href}
            className="inline-flex items-center gap-2 mt-4 text-indigo-600 font-medium"
          >
            {emptyAction.label} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
