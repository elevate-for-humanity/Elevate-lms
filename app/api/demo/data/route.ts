import { NextResponse } from 'next/server';

// Demo data that mirrors real database structure
export const demoData = {
  learner: {
    profile: {
      id: 'demo-learner-001',
      email: 'd.williams@email.com',
      full_name: 'Darius Williams',
      phone: '(317) 555-0147',
      avatar_url: '/images/testimonials/student-marcus.jpg',
      role: 'student',
      created_at: '2024-09-15T00:00:00Z',
    },
    enrollment: {
      id: 'demo-enrollment-001',
      program_id: 'barber-apprenticeship',
      status: 'active',
      enrolled_at: '2024-09-15T00:00:00Z',
      progress_percentage: 42,
      hours_completed: 847,
      hours_required: 2000,
      rti_hours_completed: 58,
      rti_hours_required: 144,
    },
    program: {
      id: 'barber-apprenticeship',
      name: 'USDOL Registered Barber Apprenticeship',
      slug: 'barber-apprenticeship',
      category: 'Skilled Trades',
      duration_weeks: 72,
      description: 'Comprehensive barber training with USDOL registered apprenticeship certification.',
      certification: 'Indiana Barber License',
      partner_name: 'Milady',
    },
    courses: [
      { id: 'c1', title: 'Introduction to Barbering', order_index: 1, completed: true, score: 95 },
      { id: 'c2', title: 'Sanitation & Safety', order_index: 2, completed: true, score: 100 },
      { id: 'c3', title: 'Tools & Equipment', order_index: 3, completed: true, score: 88 },
      { id: 'c4', title: 'Hair Science', order_index: 4, completed: true, score: 92 },
      { id: 'c5', title: 'Shampooing & Conditioning', order_index: 5, completed: true, score: 90 },
      { id: 'c6', title: 'Basic Cutting Techniques', order_index: 6, completed: true, score: 87 },
      { id: 'c7', title: 'Clipper Fundamentals', order_index: 7, completed: true, score: 94 },
      { id: 'c8', title: "Men's Haircutting Techniques", order_index: 8, completed: false, progress: 43 },
      { id: 'c9', title: 'Beard & Facial Hair', order_index: 9, completed: false, locked: false },
      { id: 'c10', title: 'Chemical Services', order_index: 10, completed: false, locked: true },
      { id: 'c11', title: 'Business & Client Relations', order_index: 11, completed: false, locked: true },
      { id: 'c12', title: 'State Board Preparation', order_index: 12, completed: false, locked: true },
    ],
    currentCourse: {
      id: 'c8',
      title: "Module 8: Men's Haircutting Techniques",
      progress: 43,
      lessons: [
        { id: 'l1', title: "Introduction to Men's Cutting", duration_minutes: 15, type: 'video', completed: true },
        { id: 'l2', title: 'Tools & Equipment Setup', duration_minutes: 12, type: 'video', completed: true },
        { id: 'l3', title: 'Classic Taper Technique', duration_minutes: 25, type: 'video', completed: true },
        { id: 'l4', title: 'Low Fade Fundamentals', duration_minutes: 30, type: 'video', completed: false, current: true },
        { id: 'l5', title: 'Mid & High Fades', duration_minutes: 28, type: 'video', completed: false },
        { id: 'l6', title: 'Skin Fade Mastery', duration_minutes: 35, type: 'video', completed: false },
        { id: 'l7', title: 'Module Quiz', duration_minutes: 20, type: 'quiz', completed: false },
      ],
    },
    trainingHours: [
      { id: 'h1', date: '2025-01-14', location: 'Elite Cuts Barbershop', type: 'OJT', hours: 8, supervisor: 'James Carter', verified: true },
      { id: 'h2', date: '2025-01-13', location: 'Elite Cuts Barbershop', type: 'OJT', hours: 8, supervisor: 'James Carter', verified: true },
      { id: 'h3', date: '2025-01-12', location: 'Elite Cuts Barbershop', type: 'OJT', hours: 6, supervisor: 'James Carter', verified: true },
      { id: 'h4', date: '2025-01-11', location: 'Online - Milady', type: 'RTI', hours: 2, supervisor: 'System', verified: true },
      { id: 'h5', date: '2025-01-10', location: 'Elite Cuts Barbershop', type: 'OJT', hours: 8, supervisor: 'James Carter', verified: true },
    ],
    schedule: [
      { id: 's1', title: 'Practical Training', date: '2025-01-15', time: '9:00 AM - 5:00 PM', type: 'training', location: 'Elite Cuts Barbershop' },
      { id: 's2', title: 'Theory Quiz: Module 8', date: '2025-01-16', time: '7:00 PM', type: 'quiz', location: 'Online' },
      { id: 's3', title: 'Skills Assessment: Fades', date: '2025-01-18', time: '10:00 AM', type: 'assessment', location: 'Training Center' },
      { id: 's4', title: 'Live Q&A with Mentor', date: '2025-01-20', time: '6:00 PM', type: 'mentorship', location: 'Google Meet' },
    ],
    achievements: [
      { id: 'a1', title: 'First 500 Hours', earned_at: '2024-12-15', icon: '🎯' },
      { id: 'a2', title: 'Theory Master', earned_at: '2024-11-20', icon: '📚' },
      { id: 'a3', title: 'Safety Certified', earned_at: '2024-10-10', icon: '✅' },
      { id: 'a4', title: 'Perfect Attendance', earned_at: '2024-10-30', icon: '⭐' },
    ],
    stats: { points: 2450, streak: 12 },
  },
  admin: {
    summary: {
      totalStudents: 847,
      activeStudents: 312,
      completedStudents: 214,
      atRiskStudents: 23,
      activePrograms: 12,
      activePartners: 24,
      pendingApplications: 45,
      completionRate: 78,
    },
    programs: [
      { id: 'p1', name: 'USDOL Registered Barber Apprenticeship', category: 'Skilled Trades', enrolled: 48, completed: 12, status: 'active' },
      { id: 'p2', name: 'Certified Nursing Assistant (CNA)', category: 'Healthcare', enrolled: 124, completed: 89, status: 'active' },
      { id: 'p3', name: 'HVAC Technician Training', category: 'Skilled Trades', enrolled: 36, completed: 8, status: 'active' },
      { id: 'p4', name: 'Medical Assistant', category: 'Healthcare', enrolled: 67, completed: 45, status: 'active' },
      { id: 'p5', name: 'Phlebotomy Technician', category: 'Healthcare', enrolled: 52, completed: 38, status: 'active' },
      { id: 'p6', name: 'Commercial Driver License (CDL)', category: 'Transportation', enrolled: 28, completed: 22, status: 'active' },
    ],
    recentActivity: [
      { id: 'a1', type: 'enrollment', message: 'Marcus J. enrolled in Barber Apprenticeship', time: '15 minutes ago' },
      { id: 'a2', type: 'completion', message: 'Sarah M. completed CNA Training', time: '1 hour ago' },
      { id: 'a3', type: 'verification', message: '24 OJT hours verified for HVAC cohort', time: '2 hours ago' },
      { id: 'a4', type: 'partner', message: 'Metro Healthcare Partners onboarded', time: '4 hours ago' },
    ],
    students: [
      { id: 's1', name: 'Darius Williams', email: 'd.williams@email.com', program: 'Barber Apprenticeship', progress: 42, status: 'active', avatar: '/images/testimonials/student-marcus.jpg' },
      { id: 's2', name: 'Sarah Mitchell', email: 's.mitchell@email.com', program: 'CNA Training', progress: 95, status: 'active', avatar: '/images/testimonials/student-sarah.jpg' },
      { id: 's3', name: 'Marcus Johnson', email: 'm.johnson@email.com', program: 'HVAC Training', progress: 28, status: 'active', avatar: '/images/testimonials/student-david.jpg' },
      { id: 's4', name: 'Lisa Rodriguez', email: 'l.rodriguez@email.com', program: 'Medical Assistant', progress: 67, status: 'active', avatar: '/images/testimonials/testimonial-medical-assistant.png' },
      { id: 's5', name: 'James Thompson', email: 'j.thompson@email.com', program: 'CDL Training', progress: 85, status: 'active', avatar: '/images/testimonials/student-graduate-testimonial.jpg' },
    ],
  },
  employer: {
    company: {
      id: 'emp-001',
      name: 'Metro Healthcare Partners',
      industry: 'Healthcare',
      location: 'Indianapolis, IN',
      partner_since: '2024-03-15',
    },
    stats: { openRoles: 5, activeCandidates: 12, hiredThisYear: 8, apprentices: 3 },
    candidates: [
      { id: 'c1', name: 'Sarah Mitchell', program: 'CNA Training', progress: 95, status: 'Interview Scheduled', match: 95, avatar: '/images/testimonials/student-sarah.jpg' },
      { id: 'c2', name: 'James Thompson', program: 'CNA Training', progress: 88, status: 'Application Review', match: 88, avatar: '/images/testimonials/student-david.jpg' },
      { id: 'c3', name: 'Lisa Rodriguez', program: 'Medical Assistant', progress: 67, status: 'Screening', match: 82, avatar: '/images/testimonials/testimonial-medical-assistant.png' },
      { id: 'c4', name: 'Michael Chen', program: 'Phlebotomy', progress: 100, status: 'Offer Extended', match: 91, avatar: '/images/testimonials/student-marcus.jpg' },
    ],
    openRoles: [
      { id: 'r1', title: 'CNA - Day Shift', department: 'Patient Care', location: 'Downtown Campus', applicants: 8, status: 'Active' },
      { id: 'r2', title: 'CNA - Night Shift', department: 'Patient Care', location: 'West Campus', applicants: 5, status: 'Active' },
      { id: 'r3', title: 'Medical Assistant', department: 'Outpatient', location: 'Main Office', applicants: 3, status: 'Active' },
      { id: 'r4', title: 'Phlebotomist', department: 'Laboratory', location: 'Downtown Campus', applicants: 12, status: 'Active' },
    ],
    apprentices: [
      { id: 'ap1', name: 'David Park', role: 'CNA Apprentice', hours: 847, level: 'Intermediate', wage: '$16.50/hr', avatar: '/images/testimonials/student-david.jpg' },
      { id: 'ap2', name: 'Jennifer Lee', role: 'MA Apprentice', hours: 456, level: 'Entry', wage: '$15.00/hr', avatar: '/images/testimonials/student-sarah.jpg' },
      { id: 'ap3', name: 'Robert Wilson', role: 'CNA Apprentice', hours: 1203, level: 'Advanced', wage: '$18.00/hr', avatar: '/images/testimonials/student-marcus.jpg' },
    ],
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  if (type === 'learner') {
    return NextResponse.json(demoData.learner);
  } else if (type === 'admin') {
    return NextResponse.json(demoData.admin);
  } else if (type === 'employer') {
    return NextResponse.json(demoData.employer);
  }

  return NextResponse.json(demoData);
}
