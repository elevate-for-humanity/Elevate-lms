'use client';

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { FileText, Download, Eye, Plus, Trash2 } from 'lucide-react';

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

type WorkExperience = ResumeData['work_experience'][number];

export function ResumeBuilder({ initialData, onSave }: ResumeBuilderProps) {
  const [resumeData, setResumeData] = useState<ResumeData>({
    personal_info: initialData?.personal_info || {
      full_name: '',
      email: '',
      phone: '',
      location: '',
    },
    summary: initialData?.summary || '',
    work_experience: initialData?.work_experience || [],
    education: initialData?.education || [],
    skills: initialData?.skills || [],
    certifications: initialData?.certifications || [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const left = 44;
    const pageWidth = doc.internal.pageSize.getWidth() - 88;
    let y = 54;
    const write = (text: string, heading = false) => {
      if (!text.trim()) return;
      doc.setFont('helvetica', heading ? 'bold' : 'normal');
      doc.setFontSize(heading ? 12 : 10);
      for (const line of doc.splitTextToSize(text, pageWidth) as string[]) {
        if (y > 738) { doc.addPage(); y = 54; }
        doc.text(line, left, y);
        y += heading ? 18 : 15;
      }
      y += 5;
    };
    write(resumeData.personal_info.full_name || 'Resume', true);
    write([resumeData.personal_info.email, resumeData.personal_info.phone, resumeData.personal_info.location].filter(Boolean).join(' | '));
    write('PROFESSIONAL SUMMARY', true); write(resumeData.summary);
    write('WORK EXPERIENCE', true);
    resumeData.work_experience.forEach(exp => { write([exp.title, exp.company, exp.location].filter(Boolean).join(' | '), true); write(`${exp.start_date} - ${exp.current ? 'Present' : exp.end_date}`); write(exp.description); });
    write('EDUCATION', true); resumeData.education.forEach(e => write([e.degree, e.school, e.graduation_date].filter(Boolean).join(' | ')));
    write('SKILLS', true); write(resumeData.skills.join(', '));
    write('CERTIFICATIONS', true); resumeData.certifications.forEach(cert => write([cert.name, cert.issuer, cert.date].filter(Boolean).join(' | ')));
    const filename = (resumeData.personal_info.full_name || 'resume').replace(/[^a-z0-9_-]+/gi, '-');
    doc.save(`${filename}-resume.pdf`);
  };

  // Load existing resume from database
  React.useEffect(() => {
    const loadResume = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).single();

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('resumes')
      .upsert({
        user_id: user.id,
        resume_data: data,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
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
          title: '',
          company: '',
          location: '',
          start_date: '',
          end_date: '',
          current: false,
          description: '',
        },
      ],
    });
  };

  const removeWorkExperience = (index: number) => {
    setResumeData((current) => ({
      ...current,
      work_experience: current.work_experience.filter((_, i) => i !== index),
    }));
  };

  const updateWorkExperience = (index: number, changes: Partial<WorkExperience>) => {
    setResumeData((current) => ({
      ...current,
      work_experience: current.work_experience.map((experience, currentIndex) =>
        currentIndex === index ? { ...experience, ...changes } : experience,
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-orange-400" />
          Resume Builder
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsPreviewOpen(value => !value)} className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button type="button" onClick={() => void downloadPdf()} className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {isPreviewOpen && (
        <section aria-label="Resume preview" className="rounded-lg border bg-white p-6 text-slate-900 space-y-3">
          <h3 className="text-2xl font-bold">{resumeData.personal_info.full_name || 'Your Name'}</h3>
          <p>{[resumeData.personal_info.email, resumeData.personal_info.phone, resumeData.personal_info.location].filter(Boolean).join(' | ')}</p>
          <h4 className="font-bold">Professional Summary</h4><p className="whitespace-pre-wrap">{resumeData.summary}</p>
          <h4 className="font-bold">Experience</h4>{resumeData.work_experience.map((exp, i) => <div key={i}><strong>{exp.title} — {exp.company}</strong><p>{exp.start_date}–{exp.current ? 'Present' : exp.end_date}</p><p className="whitespace-pre-wrap">{exp.description}</p></div>)}
          <h4 className="font-bold">Education</h4>{resumeData.education.map((ed, i) => <p key={i}>{ed.degree} — {ed.school} ({ed.graduation_date})</p>)}
          <h4 className="font-bold">Skills</h4><p>{resumeData.skills.join(', ')}</p>
          <h4 className="font-bold">Certifications</h4>{resumeData.certifications.map((cert, i) => <p key={i}>{cert.name} — {cert.issuer} ({cert.date})</p>)}
        </section>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
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
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Professional Summary</h3>
        <textarea
          placeholder="Write a brief summary of your professional background and career goals..."
          value={resumeData.summary}
          onChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
          ) => setResumeData({ ...resumeData, summary: e.target.value })}
          className="w-full bg-slate-900 text-white rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
        />
      </div>

      {/* Work Experience */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Work Experience</h3>
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
            <div key={index} className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-slate-900 font-semibold">Experience {index + 1}</h4>
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
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => updateWorkExperience(index, { title: e.target.value })}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => updateWorkExperience(index, { company: e.target.value })}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={exp.location}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => updateWorkExperience(index, { location: e.target.value })}
                  className="bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
                <div className="flex gap-2">
                  <input
                    type="month"
                    placeholder="Start Date"
                    value={exp.start_date}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => updateWorkExperience(index, { start_date: e.target.value })}
                    className="flex-1 bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  />
                  <input
                    type="month"
                    placeholder="End Date"
                    value={exp.end_date}
                    disabled={exp.current}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateWorkExperience(index, { end_date: e.target.value })
                    }
                    className="flex-1 bg-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center gap-2 text-white col-span-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateWorkExperience(index, {
                        current: e.target.checked,
                        ...(e.target.checked ? { end_date: '' } : {}),
                      })
                    }
                    className="rounded"
                  />
                  I currently work here
                </label>
                <textarea
                  placeholder="Describe your responsibilities and achievements..."
                  value={exp.description}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => updateWorkExperience(index, { description: e.target.value })}
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
          {isSaving ? 'Saving...' : 'Save Resume'}
        </button>
      </div>
    </div>
  );
}
