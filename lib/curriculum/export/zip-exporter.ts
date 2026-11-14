/**
 * lib/curriculum/export/zip-exporter.ts
 * 
 * ZIP Package Export for Curriculum Package
 * Bundles all documents into a single downloadable package
 */

import type { CurriculumPackage, ApprovalPacket } from '@/lib/curriculum/package/types';

export interface PackageFile {
  name: string;
  path: string;
  content: Buffer | string;
  mimeType: string;
}

export interface ExportPackage {
  programTitle: string;
  credentialCode: string;
  state: string;
  generatedAt: string;
  version: string;
  files: PackageFile[];
  totalSize: number;
}

/**
 * Create package file list from curriculum package
 */
export function createPackageFiles(pkg: CurriculumPackage, approval: ApprovalPacket): PackageFile[] {
  const files: PackageFile[] = [];
  const timestamp = new Date().toISOString().split('T')[0];

  // 1. Approval Checklist (TXT)
  files.push({
    name: `approval-checklist-${timestamp}.txt`,
    path: 'approval-checklist.txt',
    content: generateApprovalChecklistText(pkg, approval),
    mimeType: 'text/plain',
  });

  // 2. Clock Hours Summary (CSV)
  files.push({
    name: `clock-hours-${timestamp}.csv`,
    path: 'clock-hours.csv',
    content: generateClockHoursCSV(pkg),
    mimeType: 'text/csv',
  });

  // 3. Instructor Guide (TXT)
  if (pkg.instructorGuides) {
    files.push({
      name: `instructor-guide-${timestamp}.txt`,
      path: 'instructor-guide.txt',
      content: generateInstructorGuideText(pkg.instructorGuides),
      mimeType: 'text/plain',
    });
  }

  // 4. Student Syllabus (TXT)
  if (pkg.syllabus) {
    files.push({
      name: `syllabus-${timestamp}.txt`,
      path: 'syllabus.txt',
      content: generateSyllabusText(pkg.syllabus),
      mimeType: 'text/plain',
    });
  }

  // 5. Skills Checklists (JSON)
  if (pkg.skillsChecklists.length > 0) {
    files.push({
      name: `skills-checklists-${timestamp}.json`,
      path: 'skills-checklists.json',
      content: JSON.stringify(pkg.skillsChecklists, null, 2),
      mimeType: 'application/json',
    });
  }

  // 6. Practical Rubrics (JSON)
  if (pkg.practicalRubrics.length > 0) {
    files.push({
      name: `rubrics-${timestamp}.json`,
      path: 'rubrics.json',
      content: JSON.stringify(pkg.practicalRubrics, null, 2),
      mimeType: 'application/json',
    });
  }

  // 7. Lab Activities (JSON)
  if (pkg.labActivities.length > 0) {
    files.push({
      name: `lab-activities-${timestamp}.json`,
      path: 'lab-activities.json',
      content: JSON.stringify(pkg.labActivities, null, 2),
      mimeType: 'application/json',
    });
  }

  // 8. Competency Coverage (CSV)
  files.push({
    name: `competency-coverage-${timestamp}.csv`,
    path: 'competency-coverage.csv',
    content: generateCompetencyCoverageCSV(pkg),
    mimeType: 'text/csv',
  });

  // 9. Package Manifest (JSON)
  files.push({
    name: `package-manifest-${timestamp}.json`,
    path: 'manifest.json',
    content: JSON.stringify({
      programTitle: pkg.programTitle,
      credentialCode: pkg.credentialCode,
      state: pkg.state,
      generatedAt: pkg.generatedAt,
      version: pkg.version,
      files: files.map(f => ({ name: f.name, path: f.path, mimeType: f.mimeType })),
      validation: approval.validationResult,
    }, null, 2),
    mimeType: 'application/json',
  });

  return files;
}

function generateApprovalChecklistText(pkg: CurriculumPackage, approval: ApprovalPacket): string {
  const lines = [
    `═══════════════════════════════════════════════════════════════`,
    `  ${pkg.programTitle}`,
    `  Curriculum Approval Checklist`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `Program: ${pkg.programTitle}`,
    `Credential: ${pkg.credentialCode}`,
    `State: ${pkg.state}`,
    `Generated: ${new Date(approval.generatedAt).toLocaleDateString()}`,
    `Version: ${pkg.version}`,
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  VALIDATION RESULTS`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    `Hours Reconcile: ${approval.validationResult.missingItems.length === 0 ? '✓ PASS' : '⚠ WARN'}`,
    `Competencies Covered: ${pkg.validationResult.competenciesCovered ? '✓ PASS' : '⚠ WARN'}`,
    `Assessments Aligned: ${pkg.validationResult.assessmentsAligned ? '✓ PASS' : '⚠ WARN'}`,
    `Documents Complete: ${pkg.validationResult.documentsComplete ? '✓ PASS' : '⚠ WARN'}`,
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  INCLUDED DOCUMENTS`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    ...approval.documents.map(d => `  [${d.generated ? '✓' : '○'}] ${d.name}`),
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  CLOCK HOURS`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    ...pkg.clockHourBreakdown.map(h => 
      `  ${h.moduleTitle.padEnd(30)} Lecture: ${String(h.lectureHours).padStart(3)}h  Lab: ${String(h.labHours).padStart(3)}h  Clinical: ${String(h.clinicalHours).padStart(3)}h  Total: ${String(h.totalHours).padStart(3)}h`
    ),
    ``,
    `═══════════════════════════════════════════════════════════════`,
    `  Elevate for Humanity | Curriculum Package Export`,
    `═══════════════════════════════════════════════════════════════`,
  ];

  return lines.join('\n');
}

function generateClockHoursCSV(pkg: CurriculumPackage): string {
  const rows = [
    'Module,Module Title,Lecture Hours,Lab Hours,Clinical Hours,Externship Hours,Simulation Hours,Assessment Hours,Total Hours',
    ...pkg.clockHourBreakdown.map(h => 
      `${h.moduleSlug},${h.moduleTitle},${h.lectureHours},${h.labHours},${h.clinicalHours},${h.externshipHours},${h.simulationHours},${h.assessmentHours},${h.totalHours}`
    ),
  ];

  const totals = pkg.clockHourBreakdown.reduce(
    (acc, h) => ({
      lecture: acc.lecture + h.lectureHours,
      lab: acc.lab + h.labHours,
      clinical: acc.clinical + h.clinicalHours,
      total: acc.total + h.totalHours,
    }),
    { lecture: 0, lab: 0, clinical: 0, total: 0 }
  );

  rows.push('');
  rows.push(`TOTALS,,${totals.lecture},${totals.lab},${totals.clinical},0,0,0,${totals.total}`);

  return rows.join('\n');
}

function generateInstructorGuideText(guide: NonNullable<CurriculumPackage['instructorGuides']>): string {
  const lines: string[] = [
    `═══════════════════════════════════════════════════════════════`,
    `  ${guide.programTitle}`,
    `  INSTRUCTOR GUIDE`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `Version: ${guide.version}`,
    `Total Lecture Hours: ${guide.totalLectureHours}`,
    `Total Lab Hours: ${guide.totalLabHours}`,
    `Total Clinical Hours: ${guide.totalClinicalHours}`,
    ``,
  ];

  for (const mod of guide.modules) {
    lines.push(`─────────────────────────────────────────────────────────────`);
    lines.push(`  MODULE: ${mod.moduleTitle}`);
    lines.push(`─────────────────────────────────────────────────────────────`);
    lines.push(``);
    lines.push(`OVERVIEW:`);
    lines.push(`${mod.moduleOverview}`);
    lines.push(``);
    lines.push(`LEARNING OBJECTIVES:`);
    mod.learningObjectives.forEach(o => lines.push(`  • ${o}`));
    lines.push(``);
    lines.push(`PREPARATION:`);
    mod.preparationSteps.forEach(s => lines.push(`  • ${s}`));
    lines.push(``);
    lines.push(`EQUIPMENT NEEDED:`);
    mod.equipmentNeeded.forEach(e => lines.push(`  • ${e}`));
    lines.push(``);
    lines.push(`LECTURE OUTLINE:`);
    mod.lectureOutline.forEach((l, i) => {
      lines.push(`  ${i + 1}. ${l.topic} (${l.duration} min)`);
      lines.push(`     ${l.teachingNotes}`);
      if (l.discussionQuestions.length > 0) {
        lines.push(`     Discussion: ${l.discussionQuestions.join(', ')}`);
      }
    });
    lines.push(``);
  }

  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`  Elevate for Humanity | Instructor Guide`);
  lines.push(`═══════════════════════════════════════════════════════════════`);

  return lines.join('\n');
}

function generateSyllabusText(syllabus: NonNullable<CurriculumPackage['syllabus']>): string {
  const lines: string[] = [
    `═══════════════════════════════════════════════════════════════`,
    `  ${syllabus.programTitle}`,
    `  COURSE SYLLABUS`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `DESCRIPTION:`,
    `${syllabus.programDescription}`,
    ``,
    `CREDENTIAL: ${syllabus.credentialAwarded}`,
    `TOTAL CLOCK HOURS: ${syllabus.totalClockHours}`,
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  GRADING POLICY`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    ...syllabus.gradingPolicy.map(g => `  ${g.component}: ${g.weight}%`),
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  POLICIES`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    `ATTENDANCE:`,
    `${syllabus.attendancePolicy}`,
    ``,
    `PARTICIPATION:`,
    `${syllabus.participationPolicy}`,
    ``,
    `ACADEMIC INTEGRITY:`,
    `${syllabus.academicIntegrityPolicy}`,
    ``,
    `WITHDRAWAL:`,
    `${syllabus.withdrawalPolicy}`,
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  REQUIRED MATERIALS`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    ...syllabus.requiredMaterials.map(m => `  • ${m}`),
    ``,
    `─────────────────────────────────────────────────────────────`,
    `  INSTRUCTOR INFORMATION`,
    `─────────────────────────────────────────────────────────────`,
    ``,
    `Name: ${syllabus.instructorInformation.name}`,
    `Email: ${syllabus.instructorInformation.email}`,
    ...(syllabus.instructorInformation.officeHours ? [`Office Hours: ${syllabus.instructorInformation.officeHours}`] : []),
    ``,
    `═══════════════════════════════════════════════════════════════`,
    `  Elevate for Humanity | Course Syllabus`,
    `═══════════════════════════════════════════════════════════════`,
  ];

  return lines.join('\n');
}

function generateCompetencyCoverageCSV(pkg: CurriculumPackage): string {
  const rows = [
    'Module,Lesson,Competency Key,Assessment Method',
    ...pkg.clockHourBreakdown.flatMap(h => 
      pkg.skillsChecklists
        .filter(s => s.moduleSlug === h.moduleSlug)
        .flatMap(s => s.checklistItems.map(item => 
          `${h.moduleTitle},*,${item.competencyArea},${item.method}`
        ))
    ),
  ];

  return rows.join('\n');
}

/**
 * Create ZIP archive (simplified - uses basic ZIP format)
 * In production, use archiver or yauzl libraries
 */
export function createZipArchive(files: PackageFile[]): Buffer {
  // This is a placeholder - in production use proper ZIP library
  // For now, return concatenated files
  const combined = files.map(f => 
    `=== ${f.path} ===\n${f.content}\n\n`
  ).join('');

  return Buffer.from(combined, 'utf-8');
}
