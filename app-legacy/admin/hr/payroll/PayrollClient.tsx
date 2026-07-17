'use client';

import { useState } from 'react';
import { DollarSign, Users, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface PayrollRecord {
  id: string;
  employee_name: string;
  employee_id: string;
  pay_period: string;
  hours_worked: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  payment_date?: string;
}

export default function PayrollClient() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalGross, setTotalGross] = useState(0);
  const [totalNet, setTotalNet] = useState(0);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payroll');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalGross(data.totalGross || 0);
        setTotalNet(data.totalNet || 0);
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'processed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Processed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
        <button
          onClick={fetchPayroll}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Gross</p>
              <p className="text-xl font-bold text-slate-900">${totalGross.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Employees</p>
              <p className="text-xl font-bold text-slate-900">{records.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Net</p>
              <p className="text-xl font-bold text-slate-900">${totalNet.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gross</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No payroll records</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{record.employee_name}</p>
                      <p className="text-xs text-slate-500">{record.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.pay_period}</td>
                    <td className="px-4 py-3 text-slate-600">{record.hours_worked}h</td>
                    <td className="px-4 py-3 text-slate-600">${record.gross_pay.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-600">-${record.deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">${record.net_pay.toLocaleString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
