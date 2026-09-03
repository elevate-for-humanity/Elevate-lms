/**
 * lib/curriculum/export/docx-exporter.ts
 * 
 * DOCX Export for Curriculum Package
 * Generates Microsoft Word documents
 */

import type { CurriculumPackage, ApprovalPacket } from '@/lib/curriculum/package/types';

interface DOCXElement {
  type: 'heading' | 'paragraph' | 'table' | 'list' | 'pageBreak';
  content?: string;
  level?: number;
  rows?: string[][];
  items?: string[];
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createDocument(elements: DOCXElement[]): string {
  const body = elements.map(el => {
    switch (el.type) {
      case 'heading':
        return `<w:p><w:pPr><w:pStyle w:val="Heading${el.level || 1}"/></w:pPr><w:r><w:t>${escapeXML(el.content || '')}</w:t></w:r></w:p>`;
      case 'paragraph':
        return `<w:p><w:r><w:t xml:space="preserve">${escapeXML(el.content || '')}</w:t></w:r></w:p>`;
      case 'list':
        return el.items?.map(item => 
          `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${escapeXML(item)}</w:t></w:r></w:p>`
        ).join('') || '';
      case 'table':
        const rows = el.rows?.map((row, i) => 
          `<w:tr>${row.map(cell => 
            `<w:tc><w:p><w:r><w:rPr>${i === 0 ? '<w:b/>' : ''}</w:rPr><w:t>${escapeXML(cell)}</w:t></w:r></w:p></w:tc>`
          ).join('')}</w:tr>`
        ).join('') || '';
        return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="dxa"/></w:tblPr>${rows}</w:tbl>`;
      case 'pageBreak':
        return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      default:
        return '';
    }
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/**
 * Generate approval checklist DOCX
 */
export function generateApprovalChecklistDOCX(approval: ApprovalPacket): Buffer {
  const elements: DOCXElement[] = [
    { type: 'heading', content: approval.programTitle, level: 1 },
    { type: 'heading', content: 'Curriculum Approval Checklist', level: 2 },
    { type: 'paragraph', content: `Credential: ${approval.credentialCode} | State: ${approval.state}` },
    { type: 'paragraph', content: `Generated: ${new Date(approval.generatedAt).toLocaleDateString()}` },
    { type: 'heading', content: 'Approval Checklist', level: 2 },
  ];

  // Add checklist items
  const checklistItems = approval.validationResult.missingItems.length === 0
    ? ['All required documents present', 'Hours reconcile correctly', 'Competencies mapped', 'Assessments aligned']
    : ['⚠️ Missing items detected', ...approval.validationResult.missingItems];

  elements.push({ type: 'list', items: checklistItems });

  // Add clock hours table
  elements.push({ type: 'heading', content: 'Clock Hour Summary', level: 2 });
  elements.push({
    type: 'table',
    rows: [
      ['Module', 'Lecture', 'Lab', 'Clinical', 'Total'],
      ...approval.hourBreakdown.map(h => [
        h.moduleTitle,
        `${h.lectureHours}h`,
        `${h.labHours}h`,
        `${h.clinicalHours}h`,
        `${h.totalHours}h`,
      ]),
    ],
  });

  // Add documents list
  elements.push({ type: 'heading', content: 'Included Documents', level: 2 });
  elements.push({
    type: 'list',
    items: approval.documents.map(d => 
      `[${d.generated ? '✓' : '○'}] ${d.name}`
    ),
  });

  const doc = createDocument(elements);
  return Buffer.from(doc, 'utf-8');
}

/**
 * Generate instructor guide DOCX
 */
export function generateInstructorGuideDOCX(pkg: CurriculumPackage): Buffer {
  const elements: DOCXElement[] = [
    { type: 'heading', content: pkg.programTitle, level: 1 },
    { type: 'heading', content: 'Instructor Guide', level: 2 },
    { type: 'paragraph', content: `Version ${pkg.version} | Generated ${new Date(pkg.generatedAt).toLocaleDateString()}` },
  ];

  if (pkg.instructorGuides) {
    const guide = pkg.instructorGuides;
    
    elements.push({ type: 'paragraph', content: `Total Lecture Hours: ${guide.totalLectureHours}` });
    elements.push({ type: 'paragraph', content: `Total Lab Hours: ${guide.totalLabHours}` });
    elements.push({ type: 'paragraph', content: `Total Clinical Hours: ${guide.totalClinicalHours}` });

    for (const mod of guide.modules) {
      elements.push({ type: 'pageBreak' });
      elements.push({ type: 'heading', content: mod.moduleTitle, level: 1 });
      elements.push({ type: 'paragraph', content: mod.moduleOverview });

      elements.push({ type: 'heading', content: 'Learning Objectives', level: 2 });
      elements.push({ type: 'list', items: mod.learningObjectives });

      elements.push({ type: 'heading', content: 'Preparation Steps', level: 2 });
      elements.push({ type: 'list', items: mod.preparationSteps });

      elements.push({ type: 'heading', content: 'Equipment Needed', level: 2 });
      elements.push({ type: 'list', items: mod.equipmentNeeded });

      elements.push({ type: 'heading', content: 'Lecture Outline', level: 2 });
      for (const lecture of mod.lectureOutline) {
        elements.push({ type: 'paragraph', content: `${lecture.topic} (${lecture.duration} min)` });
        elements.push({ type: 'paragraph', content: lecture.teachingNotes });
      }

      if (mod.labGuidance) {
        elements.push({ type: 'heading', content: 'Lab Guidance', level: 2 });
        elements.push({ type: 'paragraph', content: mod.labGuidance.description });
        elements.push({ type: 'list', items: mod.labGuidance.tips });
      }

      elements.push({ type: 'heading', content: 'Assessment Guidance', level: 2 });
      elements.push({ type: 'paragraph', content: mod.assessmentGuidance.quizNotes });
    }
  }

  const doc = createDocument(elements);
  return Buffer.from(doc, 'utf-8');
}

/**
 * Generate syllabus DOCX
 */
export function generateSyllabusDOCX(pkg: CurriculumPackage): Buffer {
  const elements: DOCXElement[] = [];
  
  if (pkg.syllabus) {
    const syllabus = pkg.syllabus;
    
    elements.push({ type: 'heading', content: syllabus.programTitle, level: 1 });
    elements.push({ type: 'heading', content: 'Course Syllabus', level: 2 });
    elements.push({ type: 'paragraph', content: syllabus.programDescription });
    
    elements.push({ type: 'heading', content: 'Program Information', level: 2 });
    elements.push({ type: 'paragraph', content: `Credential: ${syllabus.credentialAwarded}` });
    elements.push({ type: 'paragraph', content: `Total Clock Hours: ${syllabus.totalClockHours}` });
    
    elements.push({ type: 'heading', content: 'Grading Policy', level: 2 });
    elements.push({
      type: 'table',
      rows: [
        ['Component', 'Weight'],
        ...syllabus.gradingPolicy.map(g => [g.component, `${g.weight}%`]),
      ],
    });
    
    elements.push({ type: 'heading', content: 'Policies', level: 2 });
    elements.push({ type: 'paragraph', content: `Attendance: ${syllabus.attendancePolicy}` });
    elements.push({ type: 'paragraph', content: `Participation: ${syllabus.participationPolicy}` });
    elements.push({ type: 'paragraph', content: `Academic Integrity: ${syllabus.academicIntegrityPolicy}` });
    elements.push({ type: 'paragraph', content: `Withdrawal: ${syllabus.withdrawalPolicy}` });
    
    elements.push({ type: 'heading', content: 'Required Materials', level: 2 });
    elements.push({ type: 'list', items: syllabus.requiredMaterials });
    
    elements.push({ type: 'heading', content: 'Technical Requirements', level: 2 });
    elements.push({ type: 'list', items: syllabus.technicalRequirements });
    
    elements.push({ type: 'heading', content: 'Instructor Information', level: 2 });
    elements.push({ type: 'paragraph', content: `Name: ${syllabus.instructorInformation.name}` });
    elements.push({ type: 'paragraph', content: `Email: ${syllabus.instructorInformation.email}` });
    if (syllabus.instructorInformation.officeHours) {
      elements.push({ type: 'paragraph', content: `Office Hours: ${syllabus.instructorInformation.officeHours}` });
    }
    
    elements.push({ type: 'heading', content: 'Course Schedule', level: 2 });
    elements.push({
      type: 'table',
      rows: [
        ['Week', 'Topic', 'Readings', 'Assignments'],
        ...syllabus.courseSchedule.map(s => [String(s.week), s.topic, s.readings || '-', s.assignments || '-']),
      ],
    });
  }

  const doc = createDocument(elements);
  return Buffer.from(doc, 'utf-8');
}
