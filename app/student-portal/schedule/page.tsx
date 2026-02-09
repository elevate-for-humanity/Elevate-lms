import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Schedule | Student Portal',
  description: 'View your class schedule and calendar.',
  robots: { index: false, follow: false },
};

export default function StudentPortalSchedulePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Student Portal", href: "/student-portal" }, { label: "Schedule" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Class Schedule</h1>
      
      <div className="flex gap-4 mb-6">
        <select className="border rounded-lg px-4 py-2">
          <option>Fall 2024</option>
          <option>Spring 2025</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Export Calendar
        </button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left w-24">Time</th>
                {days.map(day => (
                  <th key={day} className="py-3 px-4 text-left">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, idx) => (
                <tr key={time} className="border-t">
                  <td className="py-3 px-4 text-sm text-gray-600">{time}</td>
                  {days.map(day => (
                    <td key={`${day}-${time}`} className="py-1 px-2">
                      {/* Sample classes */}
                      {day === 'Monday' && time === '9:00 AM' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-sm">
                          <div className="font-medium">ENG 101</div>
                          <div className="text-gray-600">Room 204</div>
                        </div>
                      )}
                      {day === 'Monday' && time === '2:00 PM' && (
                        <div className="bg-green-100 border-l-4 border-green-500 p-2 rounded text-sm">
                          <div className="font-medium">MATH 202</div>
                          <div className="text-gray-600">Room 115</div>
                        </div>
                      )}
                      {day === 'Tuesday' && time === '10:00 AM' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-sm">
                          <div className="font-medium">CHEM 201</div>
                          <div className="text-gray-600">Lab 302</div>
                        </div>
                      )}
                      {day === 'Wednesday' && time === '9:00 AM' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-sm">
                          <div className="font-medium">ENG 101</div>
                          <div className="text-gray-600">Room 204</div>
                        </div>
                      )}
                      {day === 'Wednesday' && time === '2:00 PM' && (
                        <div className="bg-green-100 border-l-4 border-green-500 p-2 rounded text-sm">
                          <div className="font-medium">MATH 202</div>
                          <div className="text-gray-600">Room 115</div>
                        </div>
                      )}
                      {day === 'Thursday' && time === '10:00 AM' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-sm">
                          <div className="font-medium">CHEM 201</div>
                          <div className="text-gray-600">Lab 302</div>
                        </div>
                      )}
                      {day === 'Thursday' && time === '1:00 PM' && (
                        <div className="bg-orange-100 border-l-4 border-orange-500 p-2 rounded text-sm">
                          <div className="font-medium">HIST 150</div>
                          <div className="text-gray-600">Room 410</div>
                        </div>
                      )}
                      {day === 'Friday' && time === '9:00 AM' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-sm">
                          <div className="font-medium">ENG 101</div>
                          <div className="text-gray-600">Room 204</div>
                        </div>
                      )}
                      {day === 'Friday' && time === '2:00 PM' && (
                        <div className="bg-green-100 border-l-4 border-green-500 p-2 rounded text-sm">
                          <div className="font-medium">MATH 202</div>
                          <div className="text-gray-600">Room 115</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course List */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Enrolled Courses</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <h3 className="font-medium">English Composition 101</h3>
            </div>
            <p className="text-sm text-gray-600">MWF 9:00 AM - 9:50 AM | Room 204</p>
            <p className="text-sm text-gray-600">Instructor</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <h3 className="font-medium">Calculus II</h3>
            </div>
            <p className="text-sm text-gray-600">MWF 2:00 PM - 2:50 PM | Room 115</p>
            <p className="text-sm text-gray-600">Instructor</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <h3 className="font-medium">Chemistry 201</h3>
            </div>
            <p className="text-sm text-gray-600">TTh 10:00 AM - 11:30 AM | Lab 302</p>
            <p className="text-sm text-gray-600">Instructor</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <h3 className="font-medium">History 150</h3>
            </div>
            <p className="text-sm text-gray-600">Th 1:00 PM - 2:30 PM | Room 410</p>
            <p className="text-sm text-gray-600">Instructor</p>
          </div>
        </div>
      </section>
    </div>
  );
}
