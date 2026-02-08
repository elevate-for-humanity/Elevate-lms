import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Grades | Student Portal',
  description: 'View your academic grades and GPA.',
  robots: { index: false, follow: false },
};

export default function StudentPortalGradesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Student Portal", href: "/student-portal" }, { label: "Grades" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Academic Grades</h1>
      
      {/* GPA Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Current Semester GPA</p>
          <p className="text-4xl font-bold text-blue-600">3.75</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Cumulative GPA</p>
          <p className="text-4xl font-bold text-green-600">3.68</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Credits Earned</p>
          <p className="text-4xl font-bold text-brand-red-600">72</p>
        </div>
      </div>

      {/* Current Semester */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Fall 2024 - Current Semester</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Course</th>
                <th className="text-left py-2">Credits</th>
                <th className="text-left py-2">Current Grade</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">English Composition 101</div>
                  <div className="text-sm text-gray-600">ENG 101</div>
                </td>
                <td className="py-3">3</td>
                <td className="py-3 text-green-600 font-medium">A (94%)</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">In Progress</span></td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">Calculus II</div>
                  <div className="text-sm text-gray-600">MATH 202</div>
                </td>
                <td className="py-3">4</td>
                <td className="py-3 text-green-600 font-medium">B+ (88%)</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">In Progress</span></td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">Chemistry 201</div>
                  <div className="text-sm text-gray-600">CHEM 201</div>
                </td>
                <td className="py-3">4</td>
                <td className="py-3 text-green-600 font-medium">A- (91%)</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">In Progress</span></td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">History 150</div>
                  <div className="text-sm text-gray-600">HIST 150</div>
                </td>
                <td className="py-3">3</td>
                <td className="py-3 text-green-600 font-medium">A (96%)</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">In Progress</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Previous Semester */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Spring 2024</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Course</th>
                <th className="text-left py-2">Credits</th>
                <th className="text-left py-2">Final Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">Introduction to Psychology</div>
                  <div className="text-sm text-gray-600">PSY 101</div>
                </td>
                <td className="py-3">3</td>
                <td className="py-3 font-medium">A</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">Calculus I</div>
                  <div className="text-sm text-gray-600">MATH 201</div>
                </td>
                <td className="py-3">4</td>
                <td className="py-3 font-medium">A-</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div className="font-medium">Biology 101</div>
                  <div className="text-sm text-gray-600">BIO 101</div>
                </td>
                <td className="py-3">4</td>
                <td className="py-3 font-medium">B+</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600 mt-4">Semester GPA: 3.62</p>
      </section>
    </div>
  );
}
