/**
 * Attendance Tracking System
 * Manual check-in, QR code scanning, and attendance reporting
 */

import { createClient } from '@/lib/supabase/server';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  check_in_method: 'manual' | 'qr_code' | 'auto';
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  course_id: string;
  session_type: 'lecture' | 'lab' | 'clinical' | 'workshop';
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor_id: string;
  required: boolean;
  qr_code?: string;
  created_at: string;
}

export interface AttendanceSummary {
  student_id: string;
  total_sessions: number;
  attended: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
  hours_completed: number;
  hours_required: number;
}

/**
 * Create attendance session
 */
export async function createAttendanceSession(data: {
  course_id: string;
  session_type: 'lecture' | 'lab' | 'clinical' | 'workshop';
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor_id: string;
  required?: boolean;
}): Promise<AttendanceSession> {
  const supabase = await createClient();

  // Generate QR code data
  const qr_code = `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data: session, error } = await supabase
    .from('attendance_sessions')
    .insert({
      ...data,
      required: data.required ?? true,
      qr_code,
    })
    .select()
    .single();

  if (error) throw error;
  return session;
}

/**
 * Manual check-in
 */
export async function checkInStudent(
  student_id: string,
  session_id: string,
  instructor_id: string,
  notes?: string
): Promise<AttendanceRecord> {
  const supabase = await createClient();

  // Check if already checked in
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', student_id)
    .eq('session_id', session_id)
    .single();

  if (existing) {
    throw new Error('Student already checked in for this session');
  }

  // Get session details
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  // Determine status (late if after start time + 15 minutes)
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000);
  const status = now > lateThreshold ? 'late' : 'present';

  const { data: record, error } = await supabase
    .from('attendance_records')
    .insert({
      student_id,
      session_id,
      check_in_time: now.toISOString(),
      status,
      notes,
      check_in_method: 'manual',
    })
    .select()
    .single();

  if (error) throw error;
  return record;
}

/**
 * QR code check-in
 */
export async function checkInWithQRCode(
  student_id: string,
  qr_code: string
): Promise<AttendanceRecord> {
  const supabase = await createClient();

  // Find session by QR code
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('qr_code', qr_code)
    .single();

  if (!session) {
    throw new Error('Invalid QR code');
  }

  // Check if session is today
  const today = new Date().toISOString().split('T')[0];
  if (session.session_date !== today) {
    throw new Error('QR code is not valid for today');
  }

  // Check if already checked in
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', student_id)
    .eq('session_id', session.id)
    .single();

  if (existing) {
    throw new Error('Already checked in for this session');
  }

  // Determine status
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000);
  const status = now > lateThreshold ? 'late' : 'present';

  const { data: record, error } = await supabase
    .from('attendance_records')
    .insert({
      student_id,
      session_id: session.id,
      check_in_time: now.toISOString(),
      status,
      check_in_method: 'qr_code',
    })
    .select()
    .single();

  if (error) throw error;
  return record;
}

/**
 * Check out student
 */
export async function checkOutStudent(
  student_id: string,
  session_id: string
): Promise<AttendanceRecord> {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from('attendance_records')
    .update({
      check_out_time: new Date().toISOString(),
    })
    .eq('student_id', student_id)
    .eq('session_id', session_id)
    .select()
    .single();

  if (error) throw error;
  return record;
}

/**
 * Mark student absent
 */
export async function markAbsent(
  student_id: string,
  session_id: string,
  excused: boolean = false,
  notes?: string
): Promise<AttendanceRecord> {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from('attendance_records')
    .insert({
      student_id,
      session_id,
      status: excused ? 'excused' : 'absent',
      notes,
      check_in_method: 'manual',
    })
    .select()
    .single();

  if (error) throw error;
  return record;
}

/**
 * Get attendance summary for student
 */
export async function getAttendanceSummary(
  student_id: string,
  course_id?: string
): Promise<AttendanceSummary> {
  const supabase = await createClient();

  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      attendance_sessions(*)
    `)
    .eq('student_id', student_id);

  if (course_id) {
    query = query.eq('attendance_sessions.course_id', course_id);
  }

  const { data: records } = await query;

  if (!records) {
    return {
      student_id,
      total_sessions: 0,
      attended: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendance_rate: 0,
      hours_completed: 0,
      hours_required: 0,
    };
  }

  const attended = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const total_sessions = records.length;
  const attendance_rate = total_sessions > 0 ? (attended / total_sessions) * 100 : 0;

  // Calculate hours
  let hours_completed = 0;
  records.forEach(record => {
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(record.check_in_time);
      const checkOut = new Date(record.check_out_time);
      const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      hours_completed += hours;
    }
  });

  return {
    student_id,
    total_sessions,
    attended,
    absent,
    late,
    excused,
    attendance_rate,
    hours_completed,
    hours_required: 0, // Would come from course requirements
  };
}

/**
 * Get attendance records for session
 */
export async function getSessionAttendance(session_id: string): Promise<AttendanceRecord[]> {
  const supabase = await createClient();

  const { data: records } = await supabase
    .from('attendance_records')
    .select('*, profiles(full_name, email)')
    .eq('session_id', session_id)
    .order('check_in_time', { ascending: true });

  return records || [];
}

/**
 * Generate attendance report
 */
export async function generateAttendanceReport(
  course_id: string,
  start_date: string,
  end_date: string
): Promise<any[]> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      attendance_records(*, profiles(full_name))
    `)
    .eq('course_id', course_id)
    .gte('session_date', start_date)
    .lte('session_date', end_date)
    .order('session_date', { ascending: true });

  return sessions || [];
}

/**
 * Get students with low attendance
 */
export async function getStudentsWithLowAttendance(
  course_id: string,
  threshold: number = 80
): Promise<any[]> {
  const supabase = await createClient();

  // Get all students in course
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('student_id, profiles(full_name, email)')
    .eq('course_id', course_id)
    .eq('status', 'active');

  if (!enrollments) return [];

  const lowAttendanceStudents = [];

  for (const enrollment of enrollments) {
    const summary = await getAttendanceSummary(enrollment.student_id, course_id);
    if (summary.attendance_rate < threshold) {
      lowAttendanceStudents.push({
        ...enrollment,
        attendance_summary: summary,
      });
    }
  }

  return lowAttendanceStudents;
}
