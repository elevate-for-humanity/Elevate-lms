import JSZip from 'jszip';
import { XMLValidator } from 'fast-xml-parser';

function xmlBuffer(value) {
  const content = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  const xml = content.toString('utf8');
  if (xml.charCodeAt(0) === 0xfeff) throw new Error('Remove the XML byte-order mark');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entity declarations are not permitted');
  if (XMLValidator.validate(xml) !== true) throw new Error('Malformed XML document');
  return content;
}

/** Build a real local archive from the XML produced against installed IRS schemas.
 * This does not generate return XML or imply IRS acceptance.
 */
export async function buildSubmissionArchive({ submissionId, processingYear, manifestXml, returnXml, attachments = [] }) {
  if (!/^\d{20}$/.test(submissionId) || submissionId.slice(6, 10) !== String(processingYear)) throw new Error('Submission ID must contain 20 digits and the selected processing year');
  const manifest = xmlBuffer(manifestXml);
  const xml = xmlBuffer(returnXml);
  // IDs must agree across the supplied manifest and the archive filename.
  if (!new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?SubmissionId(?:\\s[^>]*)?>\\s*${submissionId}\\s*</`, 'i').test(manifest.toString('utf8'))) throw new Error('Manifest submission ID does not match the archive ID');
  const zip = new JSZip();
  zip.file('manifest/manifest.xml', manifest, { createFolders: false });
  zip.file('xml/submission.xml', xml, { createFolders: false });
  const names = new Set();
  for (const attachment of attachments) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.pdf$/i.test(attachment.name) || names.has(attachment.name.toLowerCase())) throw new Error('Attachment filenames must be unique PDF filenames without directories');
    names.add(attachment.name.toLowerCase());
    const content = Buffer.from(attachment.content);
    if (content.subarray(0, 5).toString() !== '%PDF-') throw new Error('Attachment must contain a PDF');
    zip.file(`attachment/${attachment.name}`, content, { createFolders: false });
  }
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { filename: `${submissionId}.zip`, content, atsAccepted: false };
}

/** Pub. 5446: submission ZIPs are compressed; their outer attachment ZIP is stored. */
export async function buildIfaTransmission({ soapEnvelopeXml, submissions, boundary = 'ElevateMefBoundary' }) {
  if (!/^[A-Za-z0-9_-]{1,70}$/.test(boundary)) throw new Error('Invalid MIME boundary');
  if (!Array.isArray(submissions) || !submissions.length || submissions.length > 100) throw new Error('Provide between one and 100 submissions');
  const envelope = xmlBuffer(soapEnvelopeXml);
  if (!envelope.toString('utf8').includes('http://schemas.xmlsoap.org/soap/envelope/')) throw new Error('Provide a SOAP 1.1 envelope from the current IRS message schema');
  const attachmentZip = new JSZip();
  const names = new Set();
  for (const submission of submissions) {
    if (!/^\d{20}\.zip$/.test(submission.filename) || names.has(submission.filename)) throw new Error('Submission archive names must be unique 20-digit IDs');
    const id = submission.filename.slice(0, 20);
    if (!envelope.toString('utf8').includes(id)) throw new Error('SOAP transmission manifest does not reference a submission');
    names.add(submission.filename);
    attachmentZip.file(submission.filename, submission.content, { createFolders: false, compression: 'STORE' });
  }
  const attachments = await attachmentZip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
  const newline = '\r\n';
  const header = ['MIME-Version: 1.0', `Content-Type: Multipart/Related; boundary="${boundary}"; type="text/xml"`, 'X-eFileRoutingCode: MEF', '', `--${boundary}`, 'Content-Type: text/xml; charset=UTF-8', 'Content-Transfer-Encoding: 8Bit', '', ''].join(newline);
  const between = ['', '', `--${boundary}`, 'Content-Type: application/octet-stream', 'Content-Transfer-Encoding: Binary', '', ''].join(newline);
  return { filename: 'ats-transmission.mime', content: Buffer.concat([Buffer.from(header), envelope, Buffer.from(between), attachments, Buffer.from(`${newline}${newline}--${boundary}--${newline}`)]), atsAccepted: false };
}
