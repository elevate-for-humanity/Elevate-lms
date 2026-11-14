import { it, expect } from 'vitest';
import { validateDocument } from '@/lib/uploads/document-validation';

it('rejects executable content masquerading as a PDF', async () => {
  expect(await validateDocument(new File(['<script>alert(1)</script>'], 'x.pdf', { type: 'application/pdf' }), 'credential')).toHaveProperty('error');
});
it('uses the validated type for the storage extension', async () => {
  expect(await validateDocument(new File(['%PDF-1.7\n'], 'unsafe.html', { type: 'application/pdf' }), 'credential')).toHaveProperty('extension', 'pdf');
});
it('does not accept Word files as credential images', async () => {
  expect(await validateDocument(new File(['PK word/document.xml'], 'x.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'credential')).toHaveProperty('error');
});
it('rejects a generic zip renamed as a Word resume', async () => {
  expect(await validateDocument(new File(['PK unrelated file'], 'x.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'resume')).toHaveProperty('error');
});
it('rejects empty uploads', async () => {
  expect(await validateDocument(new File([], 'x.pdf', { type: 'application/pdf' }), 'resume')).toHaveProperty('error');
});
