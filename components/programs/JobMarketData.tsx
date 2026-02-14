import { DollarSign, TrendingUp, Briefcase } from 'lucide-react';

interface JobMarketDataProps {
  averageSalary: string;
  salaryRange: string;
  jobGrowth: string;
}

export function JobMarketData({ averageSalary, salaryRange, jobGrowth }: JobMarketDataProps) {
  return (
    <section className="bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Job Market Outlook</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <div className="text-2xl font-bold text-black mb-1">{averageSalary}</div>
            <div className="text-sm text-black">Average Salary in Indiana</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <TrendingUp className="w-8 h-8 text-brand-blue-600 mb-3" />
            <div className="text-2xl font-bold text-black mb-1">{jobGrowth}</div>
            <div className="text-sm text-black">Job Growth Through 2030</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Briefcase className="w-8 h-8 text-orange-600 mb-3" />
            <div className="text-2xl font-bold text-black mb-1">{salaryRange}</div>
            <div className="text-sm text-black">Salary Range</div>
          </div>
        </div>
      </div>
    </section>
  );
}
