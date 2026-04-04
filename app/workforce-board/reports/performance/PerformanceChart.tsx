'use client';

import { useEffect, useState } from 'react';

interface PerformanceData {
  month: string;
  employmentRate: number;
  credentialRate: number;
  skillGains: number;
}

export default function PerformanceChart() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/workforce-board/performance-trends');
        const json = await res.json();
        setData(json.trends || []);
      } catch (err) {
        console.error('Failed to fetch performance trends:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  const maxValue = 100;
  const chartHeight = 200;
  const barWidth = 60;
  const gap = 20;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Legend */}
        <div className="flex gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded"></div>
            <span>Employment Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded"></div>
            <span>Credential Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded"></div>
            <span>Skill Gains</span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height: chartHeight + 40 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-black pr-2">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Bars */}
          <div className="ml-10 flex items-end gap-4" style={{ height: chartHeight }}>
            {data.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="flex items-end gap-1" style={{ height: chartHeight }}>
                  <div
                    className="w-4 bg-white rounded-t transition-all duration-500"
                    style={{ height: `${(item.employmentRate / maxValue) * chartHeight}px` }}
                    title={`Employment: ${item.employmentRate}%`}
                  ></div>
                  <div
                    className="w-4 bg-white rounded-t transition-all duration-500"
                    style={{ height: `${(item.credentialRate / maxValue) * chartHeight}px` }}
                    title={`Credential: ${item.credentialRate}%`}
                  ></div>
                  <div
                    className="w-4 bg-brand-orange-500 rounded-t transition-all duration-500"
                    style={{ height: `${(item.skillGains / maxValue) * chartHeight}px` }}
                    title={`Skills: ${item.skillGains}%`}
                  ></div>
                </div>
                <span className="text-xs text-black mt-2">{item.month}</span>
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute left-10 right-0 top-0 h-full pointer-events-none">
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${100 - pct}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


