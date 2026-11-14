# Certificate Auto-Generator

Automated certificate generation system for Elevate for Humanity.

## Features

- ✅ Automatic certificate number generation
- ✅ PDF certificate generation
- ✅ Supabase Storage integration
- ✅ Database record keeping
- ✅ Certificate verification API
- ✅ Revocation support

## Usage

### Issue a Certificate

```typescript
// API Route: POST /api/certificates/issue
const response = await fetch('/api/certificates/issue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'uuid',
    programId: 'uuid',
    studentName: 'John Doe',
    programName: 'CNA Training',
    programHours: 120,
  }),
});

const { certificate } = await response.json();
// Returns: { id, certificateNumber, pdfUrl, issuedAt }
```

### Verify a Certificate

```typescript
// API Route: GET /api/certificates/verify?number=EFH-XXX
const response = await fetch('/api/certificates/verify?number=EFH-1234567890-ABC123');
const { valid, certificate } = await response.json();
```

### Programmatic Usage

```typescript
import { issueCertificate } from '@/lib/certificates/generator';

const cert = await issueCertificate(
  'student-id',
  'program-id',
  'CNA',
  'John Doe',
  'Certified Nursing Assistant',
  'Jane Smith', // instructor
  'State Certified', // credential type
);
```

## Certificate Number Format

`EFH-YYYY-PROGRAM-XXXXX`

Example: `EFH-2024-CNA-12345`

- `EFH`: Elevate for Humanity prefix
- `YYYY`: Year issued
- `PROGRAM`: Program code (CNA, HVAC, BARBER, etc.)
- `XXXXX`: Random 5-digit number

## Database Schema

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  program_id UUID REFERENCES programs(id),
  certificate_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  program_hours INTEGER,
  instructor_name TEXT,
  credential_type TEXT,
  pdf_url TEXT NOT NULL,
  image_url TEXT,
  issued_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_status ON certificates(status);
```

## Storage Bucket

Certificates are stored in Supabase Storage bucket: `certificates`

File structure:

```
certificates/
  ├── EFH-2024-CNA-12345.pdf
  ├── EFH-2024-CNA-12345.png
  ├── EFH-2024-HVAC-67890.pdf
  └── EFH-2024-HVAC-67890.png
```

## Automatic Issuance

Certificates can be automatically issued when:

1. Student completes all course modules
2. Student passes final assessment
3. Instructor approves completion
4. Admin manually issues certificate

### Trigger Example

```typescript
// In your course completion handler
if (allModulesComplete && finalAssessmentPassed) {
  await fetch('/api/certificates/issue', {
    method: 'POST',
    body: JSON.stringify({
      studentId: student.id,
      programId: program.id,
      studentName: student.name,
      programName: program.name,
      programHours: program.hours,
    }),
  });
}
```

## Certificate Verification Page

Public verification page: `/verify-credential`

Users can enter certificate number to verify authenticity.

## Revocation

To revoke a certificate:

```typescript
const supabase = createClient(url, key);

await supabase
  .from('certificates')
  .update({
    status: 'revoked',
    revoked_at: new Date().toISOString(),
  })
  .eq('certificate_number', 'EFH-2024-CNA-12345');
```

## PDF Generation

Current implementation uses HTML template. For production, consider:

- **@react-pdf/renderer** - React components to PDF
- **pdfkit** - Low-level PDF generation
- **puppeteer** - HTML to PDF via headless Chrome
- **jsPDF** - Client-side PDF generation

## Future Enhancements

- [ ] Digital signatures
- [ ] QR code with verification link
- [ ] Email delivery
- [ ] Batch certificate generation
- [ ] Custom templates per program
- [ ] Blockchain verification
- [ ] LinkedIn integration
- [ ] Print-ready formatting

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing

```bash
# Test certificate generation
curl -X POST http://localhost:3000/api/certificates/issue \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "test-id",
    "programId": "test-program",
    "studentName": "Test Student",
    "programName": "Test Program",
    "programHours": 100
  }'

# Test certificate verification
curl http://localhost:3000/api/certificates/verify?number=EFH-2024-TEST-12345
```

## Support

For issues or questions, contact: info@www.elevateforhumanity.org
