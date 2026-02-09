import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { getUserById } from '@/lib/supabase-admin';
import QRCode from 'qrcode';

// Use Node.js runtime for PDF generation
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const serial = searchParams.get('serial');

  if (!serial) return new Response('Missing serial', { status: 400 });

  // Fetch certificate data
  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle();

  if (!cert) return new Response('Certificate not found', { status: 404 });

  // Fetch user and course details
  let u;
  try {
    u = await getUserById(cert.user_id);
  } catch (error) { /* Error handled silently */ 
    // User lookup failed, will use fallback data
  }

  const { data: c } = await supabase
    .from('courses')
    .select('title')
    .eq('id', cert.course_id)
    .maybeSingle();

  // Generate QR code
  const origin = req.headers.get('origin') || 'https://efh-lms.com';
  const verifyUrl = `${origin}/cert/verify/${cert.verification_code || cert.serial}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0 });

  // Dynamic import to reduce bundle size
  const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer');
  
  const styles = StyleSheet.create({
    page: { padding: 60, fontFamily: 'Helvetica' },
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
    },
    h2: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
    row: { fontSize: 14, marginBottom: 8 },
    qrRow: { marginTop: 30, flexDirection: 'row', alignItems: 'center', gap: 15 },
    qrText: { fontSize: 10, color: '#666' },
  });

  // Create PDF document
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Certificate of Completion</Text>
        <Text style={styles.h2}>
          Elevate for Humanity Career & Technical Institute
        </Text>
        <View>
          <Text style={styles.row}>
            Awarded to: {cert.student_name || u?.email || 'Learner'}
          </Text>
          <Text style={styles.row}>
            Course: {cert.course_name || c?.title || 'Course'}
          </Text>
          <Text style={styles.row}>
            Completed: {new Date(cert.completion_date).toLocaleDateString()}
          </Text>
          <Text style={styles.row}>
            Issued: {new Date(cert.issued_at).toLocaleDateString()}
          </Text>
          {cert.expires_at && (
            <Text style={styles.row}>
              Expires: {new Date(cert.expires_at).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.row}>Serial: {cert.serial}</Text>
        </View>
        <View style={styles.qrRow}>
          <Image
            src={qrDataUrl}
            style={{ width: 88, height: 88 }}
          />
          <View>
            <Text style={styles.qrText}>Scan to verify certificate</Text>
            <Text style={styles.qrText}>{verifyUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  // Generate PDF buffer
  const pdfBuffer = await pdf(doc).toBuffer();

  return new Response(pdfBuffer as any as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${serial}.pdf"`,
    },
  });
}
