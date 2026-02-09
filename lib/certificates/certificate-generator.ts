import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateNumber: string;
  issuer: string;
  type: 'module' | 'program';
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');

  // Border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);

  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, 267, 180);

  // Title
  doc.setFontSize(36);
  doc.setTextColor(0, 102, 204);
  doc.text('Certificate of Completion', 148.5, 50, { align: 'center' });

  // Presented to
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text('This certificate is proudly presented to', 148.5, 70, { align: 'center' });

  // Student name
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.text(data.studentName, 148.5, 90, { align: 'center' });

  // Course completion text
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('for successfully completing', 148.5, 105, { align: 'center' });

  // Course name
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text(data.courseName, 148.5, 120, { align: 'center' });

  // Date
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const formattedDate = data.completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Completed on ${formattedDate}`, 148.5, 135, { align: 'center' });

  // Issuer
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.issuer, 148.5, 160, { align: 'center' });

  // Certificate number
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate No: ${data.certificateNumber}`, 148.5, 185, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function issueModuleCertificate(
  enrollmentId: string,
  moduleId: string
): Promise<string> {
  const supabase = getSupabaseClient();

  // Get enrollment and module details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('partner_course_enrollments')
    .select(`
      *,
      student:profiles!partner_course_enrollments_student_id_fkey(full_name),
      course:partner_courses(name, partner_id)
    `)
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error('Enrollment not found');
  }

  const { data: module, error: moduleError } = await supabase
    .from('partner_course_modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    throw new Error('Module not found');
  }

  // Generate certificate number
  const certificateNumber = `MOD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Generate PDF
  const pdfBuffer = await generateCertificatePDF({
    studentName: enrollment.student.full_name,
    courseName: `${enrollment.course.name} - ${module.name}`,
    completionDate: new Date(),
    certificateNumber,
    issuer: 'Partner Certification',
    type: 'module'
  });

  // Upload to storage
  const fileName = `certificates/modules/${enrollmentId}/${moduleId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('certificates')
    .getPublicUrl(fileName);

  // Record certificate
  const now = new Date().toISOString();
  const { error: recordError } = await supabase
    .from('student_certificates')
    .insert({
      student_id: enrollment.student_id,
      certificate_type: 'module',
      certificate_number: certificateNumber,
      course_name: `${enrollment.course.name} - ${module.name}`,
      issued_date: now,
      issuer: 'Partner Certification',
      pdf_url: urlData.publicUrl,
      metadata: {
        enrollment_id: enrollmentId,
        module_id: moduleId,
        partner_id: enrollment.course.partner_id
      }
    });

  if (recordError) {
    throw new Error(`Failed to record certificate: ${recordError.message}`);
  }

  // Update enrollment with certificate_issued_at timestamp (for module certs)
  await supabase
    .from('partner_course_enrollments')
    .update({ certificate_issued_at: now })
    .eq('id', enrollmentId);

  return certificateNumber;
}

export async function issueProgramCertificate(
  studentId: string,
  programId: string
): Promise<string> {
  const supabase = getSupabaseClient();

  // Get student and program details
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
  }

  const { data: program, error: programError } = await supabase
    .from('programs')
    .select('name')
    .eq('id', programId)
    .single();

  if (programError || !program) {
    throw new Error('Program not found');
  }

  // Verify all required certifications are complete
  const { data: requiredCerts, error: certsError } = await supabase
    .from('program_required_certifications')
    .select('partner_course_id')
    .eq('program_id', programId);

  if (certsError) {
    throw new Error('Failed to fetch required certifications');
  }

  // Check if student has completed all required certifications
  for (const cert of requiredCerts || []) {
    const { data: enrollment } = await supabase
      .from('partner_course_enrollments')
      .select('status')
      .eq('student_id', studentId)
      .eq('partner_course_id', cert.partner_course_id)
      .eq('status', 'completed')
      .single();

    if (!enrollment) {
      throw new Error('Not all required certifications are complete');
    }
  }

  // Generate certificate number
  const certificateNumber = `PROG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Generate PDF
  const pdfBuffer = await generateCertificatePDF({
    studentName: student.full_name,
    courseName: program.name,
    completionDate: new Date(),
    certificateNumber,
    issuer: 'Elevate for Humanity',
    type: 'program'
  });

  // Upload to storage
  const fileName = `certificates/programs/${studentId}/${programId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('certificates')
    .getPublicUrl(fileName);

  // Record certificate
  const now = new Date().toISOString();
  const { error: recordError } = await supabase
    .from('student_certificates')
    .insert({
      student_id: studentId,
      certificate_type: 'program',
      certificate_number: certificateNumber,
      course_name: program.name,
      issued_date: now,
      issuer: 'Elevate for Humanity',
      pdf_url: urlData.publicUrl,
      metadata: {
        program_id: programId
      }
    });

  if (recordError) {
    throw new Error(`Failed to record certificate: ${recordError.message}`);
  }

  // Update enrollment with certificate_issued_at timestamp
  // Note: 'enrollments' may be a view, so we update student_enrollments directly
  await supabase
    .from('student_enrollments')
    .update({ certificate_issued_at: now })
    .eq('student_id', studentId)
    .eq('program_id', programId);

  return certificateNumber;
}

export async function verifyCertificate(certificateNumber: string) {
  const supabase = getSupabaseClient();

  const { data, error }: any = await supabase
    .from('student_certificates')
    .select(`
      *,
      student:profiles!student_certificates_student_id_fkey(full_name, email)
    `)
    .eq('certificate_number', certificateNumber)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    valid: true,
    studentName: data.student.full_name,
    courseName: data.course_name,
    issuedDate: data.issued_date,
    issuer: data.issuer,
    type: data.certificate_type
  };
}
