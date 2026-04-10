'use client';

import { useEffect } from 'react';

export default function MOUDownloadPage() {
  useEffect(() => {
    async function generatePDF() {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const margin = 20;
      const pageWidth = 215.9;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addText = (text: string, fontSize: number, bold: boolean = false, center: boolean = false, color: [number,number,number] = [0,0,0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        if (center) {
          doc.text(text, pageWidth / 2, y, { align: 'center' });
        } else {
          const lines = doc.splitTextToSize(text, contentWidth);
          doc.text(lines, margin, y);
          y += (lines.length - 1) * (fontSize * 0.4);
        }
        y += fontSize * 0.45;
      };

      const addLine = () => {
        doc.setDrawColor(0);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      const checkPage = (needed: number = 20) => {
        if (y + needed > 270) { doc.addPage(); y = 20; }
      };

      // Header
      addText('MEMORANDUM OF UNDERSTANDING', 14, true, true);
      addText('Registered Apprenticeship Partnership Agreement', 11, false, true);
      y += 4;
      addLine();
      y += 2;

      addText('Between:', 10, true, true);
      addText('2Exclusive LLC-S dba Elevate for Humanity Career and Training Institute', 10, false, true);
      addText('AND', 10, true, true);
      addText('2Exclusive LLC-S dba 2Exclusive Platinum Cleaning', 10, false, true);
      y += 4;

      addText('Effective Date: January 29, 2025', 10, false);
      addText('Grant Period: July 1, 2025 – May 15, 2028', 10, false);
      addText('Grant: Indiana DWD SAEF Competitive Grant Round 2 — Advanced Manufacturing & Logistics RTI (RAP)', 10, false);
      addText('Occupation: Building Services Technician (DOL Provider ID: 206251 | 432 RTI Hours)', 10, false);
      y += 4;

      // Purpose
      checkPage();
      addText('PURPOSE', 11, true);
      addLine();
      addText('This Memorandum of Understanding establishes a formal partnership between 2Exclusive LLC-S dba Elevate for Humanity Career and Training Institute ("Elevate"), a U.S. Department of Labor Registered Apprenticeship Sponsor, and 2Exclusive LLC-S dba 2Exclusive Platinum Cleaning ("2Exclusive Platinum Cleaning"), a licensed building services and janitorial employer, for the purpose of delivering a DOL Registered Apprenticeship program in the Building Services Technician occupation in support of the Indiana Department of Workforce Development State Apprenticeship Expansion Formula (SAEF) Grant, Round 2.', 10, false);
      y += 4;

      // Elevate responsibilities
      checkPage();
      addText('RESPONSIBILITIES OF ELEVATE FOR HUMANITY', 11, true);
      addLine();
      const elevateItems = [
        'Serve as DOL Registered Apprenticeship Sponsor (Provider ID 206251)',
        'Deliver all 432 Related Technical Instruction (RTI) hours per apprentice through proprietary web-based LMS',
        'Register all apprentices in RAPIDS within 30 days of enrollment',
        'Enter all participants into Indiana Career Connect for federal reporting',
        'Assign dedicated case manager to each apprentice for ongoing support and compliance',
        'Submit all required quarterly financial and narrative reports to DWD-WBLA within 15 days of quarter end',
        'Maintain audit-ready records of all participant data, OJT hours, and RTI completion',
        'Disburse grant funds for RTI, mentoring stipends, and case management per award terms',
        'Comply with all applicable federal apprenticeship standards including 29 CFR Parts 29 & 30',
      ];
      elevateItems.forEach(item => { checkPage(8); addText('• ' + item, 10); });
      y += 4;

      // Platinum responsibilities
      checkPage();
      addText('RESPONSIBILITIES OF 2EXCLUSIVE PLATINUM CLEANING', 11, true);
      addLine();
      const platinumItems = [
        'Serve as employer of record and OJT host site for Building Services Technician apprentices',
        'Employ a minimum of 12 apprentices during the grant period in building services and janitorial roles',
        'Provide supervised on-the-job training aligned to DOL-registered apprenticeship standards',
        'Assign a qualified mentor (minimum 3 years experience) to each apprentice',
        'Submit monthly OJT hour logs through the Elevate employer portal for case manager review',
        'Participate in monthly three-way check-ins with apprentice and Elevate case manager',
        'Maintain apprentice employment in good standing throughout the program period',
        'Comply with 29 CFR Parts 29 & 30 and Equal Employment Opportunity requirements',
        'Ensure no participant is charged any fee for participation in this apprenticeship program',
      ];
      platinumItems.forEach(item => { checkPage(8); addText('• ' + item, 10); });
      y += 4;

      // Shared
      checkPage();
      addText('SHARED RESPONSIBILITIES', 11, true);
      addLine();
      const sharedItems = [
        'Both parties will cooperate fully with any DWD-WBLA monitoring, audit, or evaluation activities',
        'Both parties will protect participant PII in accordance with federal privacy requirements',
        'Both parties will participate in quarterly AiHUBs community of practice meetings',
      ];
      sharedItems.forEach(item => { checkPage(8); addText('• ' + item, 10); });
      y += 4;

      // Term
      checkPage();
      addText('TERM AND TERMINATION', 11, true);
      addLine();
      addText('This MOU is effective January 29, 2025 and remains in effect through May 15, 2028. Either party may terminate with 30 days written notice. Both parties will cooperate to ensure continuity of services for enrolled apprentices upon termination.', 10);
      y += 8;

      // Signatures
      checkPage(60);
      addText('SIGNATURES', 11, true);
      addLine();
      y += 4;

      const sigY = y;

      // Left sig
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2Exclusive LLC-S dba', margin, sigY);
      doc.text('Elevate for Humanity Career and Training Institute', margin, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.line(margin, sigY + 25, margin + 80, sigY + 25);
      doc.text('Signature', margin, sigY + 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Elizabeth Greene', margin, sigY + 38);
      doc.setFont('helvetica', 'normal');
      doc.text('Founder & Executive Director', margin, sigY + 43);
      doc.text('Date: January 29, 2025', margin, sigY + 48);
      doc.text('Phone: (317) 314-3757', margin, sigY + 53);
      doc.text('Email: elevate4humanityedu@gmail.com', margin, sigY + 58);

      // Right sig
      const rightX = pageWidth / 2 + 5;
      doc.setFont('helvetica', 'bold');
      doc.text('2Exclusive LLC-S dba', rightX, sigY);
      doc.text('2Exclusive Platinum Cleaning', rightX, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.line(rightX, sigY + 25, rightX + 80, sigY + 25);
      doc.text('Signature', rightX, sigY + 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Elizabeth Greene', rightX, sigY + 38);
      doc.setFont('helvetica', 'normal');
      doc.text('Owner', rightX, sigY + 43);
      doc.text('Date: January 29, 2025', rightX, sigY + 48);
      doc.text('Phone: (317) 314-3757', rightX, sigY + 53);
      doc.text('Email: elevate4humanityedu@gmail.com', rightX, sigY + 58);

      doc.save('MOU-2Exclusive-Platinum-Cleaning-Jan2025.pdf');
    }

    generatePDF();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Generating MOU PDF...</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>Your download should start automatically.</p>
      <p style={{ fontSize: '14px', color: '#888', marginTop: '12px' }}>If it does not start, <a href="#" onClick={() => window.location.reload()} style={{ color: '#2563eb' }}>click here to try again</a>.</p>
    </div>
  );
}
