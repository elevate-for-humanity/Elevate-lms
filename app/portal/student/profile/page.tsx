'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Award, Edit2, Camera, Save, CheckCircle } from 'lucide-react';

export default function StudentProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.johnson@email.com',
    phone: '(317) 555-0198',
    address: '456 Oak Street',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46201',
    bio: 'Aspiring healthcare professional passionate about patient care.',
  });

  const studentInfo = {
    program: 'CNA Certification',
    startDate: 'November 15, 2025',
    expectedCompletion: 'February 15, 2026',
    studentId: 'STU-2025-1234',
    fundingSource: 'WIOA Adult',
    advisor: 'Sarah Williams',
  };

  const achievements = [
    { id: 1, name: 'Quick Learner', icon: '🚀', date: 'Jan 15, 2026' },
    { id: 2, name: 'Perfect Attendance', icon: '⭐', date: 'Jan 10, 2026' },
    { id: 3, name: 'Quiz Master', icon: '🎯', date: 'Dec 20, 2025' },
  ];

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Profile updated successfully!</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
                  <p className="text-gray-600">{studentInfo.program}</p>
                  <p className="text-sm text-gray-500 mt-1">Student ID: {studentInfo.studentId}</p>
                </div>
                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
                </button>
              </div>
              {!editing && profile.bio && (
                <p className="mt-3 text-gray-600">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5 text-gray-400" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5 text-gray-400" />
                    {profile.phone}
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    {profile.address}, {profile.city}, {profile.state} {profile.zip}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Program</p>
                  <p className="font-medium text-gray-900">{studentInfo.program}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{studentInfo.startDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Expected Completion</p>
                  <p className="font-medium text-gray-900">{studentInfo.expectedCompletion}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Funding Source</p>
                  <p className="font-medium text-gray-900">{studentInfo.fundingSource}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Advisor</p>
                  <p className="font-medium text-gray-900">{studentInfo.advisor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{achievement.name}</p>
                    <p className="text-xs text-gray-500">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/lms/badges" className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm">
              View All Badges →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
