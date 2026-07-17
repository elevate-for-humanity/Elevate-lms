'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, DollarSign, TrendingUp, ArrowLeft, Download, FileText, BarChart } from 'lucide-react';

export default function AdminDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/store/demo" className="hover:bg-slate-800 p-2 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="text-xs text-slate-400">DEMO MODE</div>
              <div className="font-bold">Admin Dashboard</div>
            </div>
          </div>
          <Link
            href="/store/beauty-programs"
            className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm"
          >
            Beauty schools
          </Link>
          <Link
            href="/store/licenses"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Purchase License
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b">
            <div className="flex gap-4 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'compliance', label: 'Compliance', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-semibold border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Platform Overview</h2>
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <div className="text-3xl font-bold text-blue-600 mb-1">247</div>
                    <div className="text-sm text-slate-700">Active Students</div>
                  </div>
                  <div className="bg-brand-green-50 rounded-lg p-6">
                    <BookOpen className="w-8 h-8 text-brand-green-600 mb-3" />
                    <div className="text-3xl font-bold text-brand-green-600 mb-1">18</div>
                    <div className="text-sm text-slate-700">Active Courses</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="text-3xl font-bold text-purple-600 mb-1">89%</div>
                    <div className="text-sm text-slate-700">Completion Rate</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <DollarSign className="w-8 h-8 text-orange-600 mb-3" />
                    <div className="text-3xl font-bold text-orange-600 mb-1">$1.2M</div>
                    <div className="text-sm text-slate-700">Grant Funding</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-bold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'New enrollment', student: 'Sarah Johnson', course: 'HVAC Technician', time: '5 min ago' },
                      { action: 'Course completed', student: 'Mike Davis', course: 'Barber Apprenticeship', time: '1 hour ago' },
                      { action: 'Certificate issued', student: 'Lisa Chen', course: 'CNA Certification', time: '2 hours ago' },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-semibold">{activity.action}</div>
                          <div className="text-sm text-slate-600">
                            {activity.student} · {activity.course}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Student Management</h2>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    Add Student
                  </button>
                </div>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Program</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { name: 'John Smith', program: 'Barber Apprenticeship', progress: 75, status: 'Active' },
                        { name: 'Maria Garcia', program: 'HVAC Technician', progress: 45, status: 'Active' },
                        { name: 'David Lee', program: 'CNA Certification', progress: 90, status: 'Active' },
                      ].map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold">{student.name}</td>
                          <td className="px-6 py-4 text-slate-600">{student.program}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-semibold">
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Course Management</h2>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    Create Course
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: 'Barber Apprenticeship', students: 45, lessons: 12, published: true },
                    { title: 'HVAC Technician Training', students: 38, lessons: 20, published: true },
                    { title: 'CNA Certification', students: 52, lessons: 15, published: true },
                  ].map((course, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-6 hover:shadow-lg transition">
                      <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                      <div className="flex gap-4 text-sm text-slate-600 mb-4">
                        <span>{course.students} students</span>
                        <span>·</span>
                        <span>{course.lessons} lessons</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                          Edit
                        </button>
                        <button className="px-4 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-200 transition">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Compliance & Reporting</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">WIOA Compliance</h3>
                      <span className="px-3 py-2 bg-brand-green-600 text-white rounded-full text-sm font-bold">
                        Compliant
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-4">
                      All required data elements captured. Ready for quarterly reporting.
                    </p>
                    <button className="flex items-center gap-2 text-brand-green-600 font-semibold hover:text-brand-green-700">
                      <Download className="w-4 h-4" />
                      Export Report
                    </button>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">FERPA Protection</h3>
                      <span className="px-3 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-4">
                      Student data encrypted and access-controlled per FERPA requirements.
                    </p>
                    <button className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                      <FileText className="w-4 h-4" />
                      View Audit Log
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold mb-4">Available Reports</h3>
                  <div className="space-y-3">
                    {[
                      'WIOA Quarterly Performance Report',
                      'Grant Outcome Metrics',
                      'Student Enrollment Summary',
                      'Completion and Placement Rates',
                      'Financial Aid Disbursement',
                    ].map((report, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-semibold">{report}</span>
                        <button className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">This is a Demo</h3>
          <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
            You're viewing the admin dashboard with sample data. The full platform includes user management, advanced analytics, API access, and white-label customization.
          </p>
          <Link
            href="/store/licenses"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Get Full Access
          </Link>
        </div>
      </div>
    </div>
  );
}
