"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from "react";
import { FileText, Download, Eye, Plus, Trash2 } from "lucide-react";

interface ResumeData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  work_experience: Array<{
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    graduation_date: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

interface ResumeBuilderProps {
  initialData?: Partial<ResumeData>;
  onSave: (data: ResumeData) => Promise<void>;
}

export function ResumeBuilder({ initialData, onSave }: ResumeBuilderProps) {
  const [resumeData, setResumeData] = useState<ResumeData>({
    personal_info: initialData?.personal_info || {
      full_name: "",
      email: "",
      phone: "",
      location: "",
    },
    summary: initialData?.summary || "",
    work_experience: initialData?.work_experience || [],
    education: initialData?.education || [],
    skills: initialData?.skills || [],
    certifications: initialData?.certifications || [],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing resume from database
  React.useEffect(() => {
    const loadResume = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data?.resume_data) {
        setResumeData(data.resume_data);
      }
    };
    if (!initialData) {
      loadResume();
    }
  }, [initialData]);

  // Save resume to database
  const saveToDatabase = async (data: ResumeData) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('resumes').upsert({
      user_id: user.id,
      resume_data: data,
      updated_at: new Date().toISOString(),
    }).catch(() => {});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(resumeData);
    } finally {
      setIsSaving(false);
    }
  };

  const addWorkExperience = () => {
    setResumeData({
      ...resumeData,
      work_experience: [
        ...resumeData.work_experience,
        {
          title: "",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          current: false,
          description: "",
        },
      ],
    });
  };

  const removeWorkExperience = (index: number) => {
    setResumeData({
      ...resumeData,
      work_experience: resumeData.work_experience.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-orange-400" />
          Resume Builder
        </h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={resumeData.personal_info.full_name}
            onChange={(e) =>
              setResumeData({
                ...resumeData,
                personal_info: { ...resumeData.personal_info, full_name: e.target.value },
              })
            }
            className="bg-slate-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={resumeData.personal_info.email}
            onChange={(e) =>
              setResumeData({
                ...resumeData,
                personal_info: { ...resumeData.personal_info, email: e.target.value },
              })
            }
            className="bg-slate-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={resumeData.personal_info.phone}
            onChange={(e) =>
              setResumeData({
                ...resumeData,
                personal_info: { ...resumeData.personal_info, phone: e.target.value },
              })
            }
            className="bg-slate-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
          />
          <input
            type="text"
            placeholder="Location"
            value={resumeData.personal_info.location}
            onChange={(e) =>
              setResumeData({
                ...resumeData,
                personal_info: { ...resumeData.personal_info, location: e.target.value },
              })
            }
            className="bg-slate-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
          />
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Professional Summary</h3>
        <textarea
          placeholder="Write a brief summary of your professional background and career goals..."
          value={resumeData.summary}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setResumeData({ ...resumeData, summary: e.target.value })}
          className="w-full bg-slate-900 text-white rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
        />
      </div>

      {/* Work Experience */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Work Experience</h3>
          <button
            onClick={addWorkExperience}
            className="px-4 py-2 bg-brand-orange-500 text-white rounded-lg font-medium hover:bg-brand-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>

        <div className="space-y-4">
          {resumeData.work_experience.map((exp, index) => (
            <div key={index} className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-white font-semibold">Experience {index + 1}</h4>
                <button
                  onClick={() => removeWorkExperience(index)}
                  className="text-brand-red-400 hover:text-brand-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const updated = [...resumeData.work_experience];
                    updated[index].title = e.target.value;
                    setResumeData({ ...resumeData, work_experience: updated });
                  }}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const updated = [...resumeData.work_experience];
                    updated[index].company = e.target.value;
                    setResumeData({ ...resumeData, work_experience: updated });
                  }}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const updated = [...resumeData.work_experience];
                    updated[index].location = e.target.value;
                    setResumeData({ ...resumeData, work_experience: updated });
                  }}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <div className="flex gap-2">
                  <input
                    type="month"
                    placeholder="Start Date"
                    value={exp.start_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                      const updated = [...resumeData.work_experience];
                      updated[index].start_date = e.target.value;
                      setResumeData({ ...resumeData, work_experience: updated });
                    }}
                    className="flex-1 bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  />
                  <input
                    type="month"
                    placeholder="End Date"
                    value={exp.end_date}
                    disabled={exp.current}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                      const updated = [...resumeData.work_experience];
                      updated[index].end_date = e.target.value;
                      setResumeData({ ...resumeData, work_experience: updated });
                    }}
                    className="flex-1 bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center gap-2 text-white col-span-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                      const updated = [...resumeData.work_experience];
                      updated[index].current = e.target.checked;
                      setResumeData({ ...resumeData, work_experience: updated });
                    }}
                    className="rounded"
                  />
                  I currently work here
                </label>
                <textarea
                  placeholder="Describe your responsibilities and achievements..."
                  value={exp.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const updated = [...resumeData.work_experience];
                    updated[index].description = e.target.value;
                    setResumeData({ ...resumeData, work_experience: updated });
                  }}
                  className="col-span-2 bg-slate-800 text-white rounded-lg p-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-brand-orange-500 text-white rounded-lg font-semibold hover:bg-brand-orange-600 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Resume"}
        </button>
      </div>
    </div>
  );
}
