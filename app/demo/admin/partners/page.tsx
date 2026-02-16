import { DemoPageShell } from '@/components/demo/DemoPageShell';

const partners = [
  { name: 'Midwest Manufacturing Co.', type: 'Employer', students: 12, status: 'Active', since: 'Mar 2025' },
  { name: 'Regional Health Systems', type: 'Employer', students: 8, status: 'Active', since: 'Jun 2025' },
  { name: 'City Workforce Board', type: 'Workforce Board', students: 45, status: 'Active', since: 'Jan 2025' },
  { name: 'State DOL Region 5', type: 'Government', students: 89, status: 'Active', since: 'Nov 2024' },
  { name: 'Community College District', type: 'Training Provider', students: 34, status: 'Active', since: 'Aug 2025' },
  { name: 'BuildRight Construction', type: 'Employer', students: 6, status: 'Pending MOU', since: 'Jan 2026' },
];

export default function DemoPartnersPage() {
  return (
    <DemoPageShell title="Partners" description="Employer partners, workforce boards, and training providers in your network." portal="admin">
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Organization</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600">{p.type}</td>
                <td className="px-5 py-3 text-gray-600">{p.students}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>{p.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
