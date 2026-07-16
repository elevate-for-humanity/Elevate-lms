/**
 * lib/curriculum/export/pdf-exporter.tsx
 *
 * PDF Export for Curriculum Package
 * Uses @react-pdf/renderer for PDF generation
 */

import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CurriculumPackage, ApprovalPacket } from '@/lib/curriculum/package/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#1e3a5f' },
  subheader: { fontSize: 14, marginBottom: 10, color: '#4a5568' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, marginBottom: 10, color: '#2d3748', borderBottom: '1 solid #e2e8f0', paddingBottom: 5 },
  text: { fontSize: 11, marginBottom: 5, lineHeight: 1.5 },
  bold: { fontSize: 11, fontWeight: 'bold' },
  list: { marginLeft: 15, marginBottom: 5 },
  listItem: { fontSize: 10, marginBottom: 3 },
  table: { marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #e2e8f0', padding: 5 },
  tableCell: { flex: 1, fontSize: 9 },
  tableHeader: { backgroundColor: '#f7fafc', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#718096' },
});

interface PDFDocumentProps {
  pkg: CurriculumPackage;
  approval: ApprovalPacket;
}

function CurriculumPackagePDF({ pkg, approval }: PDFDocumentProps) {
  const { checklist, summary } = approval.validationResult;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{pkg.programTitle}</Text>
        <Text style={styles.subheader}>
          Curriculum Package - {pkg.credentialCode} | {pkg.state}
        </Text>
        <Text style={styles.text}>Generated: {new Date(pkg.generatedAt).toLocaleDateString()}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clock Hour Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Module</Text>
              <Text style={styles.tableCell}>Lecture</Text>
              <Text style={styles.tableCell}>Lab</Text>
              <Text style={styles.tableCell}>Clinical</Text>
              <Text style={styles.tableCell}>Total</Text>
            </View>
            {pkg.clockHourBreakdown.map((mod, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{mod.moduleTitle}</Text>
                <Text style={styles.tableCell}>{mod.lectureHours}h</Text>
                <Text style={styles.tableCell}>{mod.labHours}h</Text>
                <Text style={styles.tableCell}>{mod.clinicalHours}h</Text>
                <Text style={styles.tableCell}>{mod.totalHours}h</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Checklist ({summary.passed}/{summary.total})</Text>
          {checklist.map((item, i) => (
            <View key={i} style={styles.list}>
              <Text style={styles.listItem}>
                [{item.status === 'pass' ? 'PASS' : item.status === 'fail' ? 'FAIL' : 'PENDING'}] {item.item}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Elevate for Humanity | Curriculum Package Export</Text>
      </Page>

      {pkg.skillsChecklists.map((cl, i) => (
        <Page key={`checklist-${i}`} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Skills Checklist: {cl.moduleTitle}</Text>
          <Text style={styles.text}>Total Tasks: {cl.totalTasks} | Required: {cl.requiredTasks}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>Task</Text>
              <Text style={styles.tableCell}>Method</Text>
            </View>
            {cl.checklistItems.map((item, j) => (
              <View key={j} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.stepNumber}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.task}</Text>
                <Text style={styles.tableCell}>{item.method}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footer}>Elevate for Humanity | Skills Checklist</Text>
        </Page>
      ))}

      {pkg.practicalRubrics.map((rubric, i) => (
        <Page key={`rubric-${i}`} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Practical Rubric: {rubric.rubricTitle}</Text>
          <Text style={styles.text}>Passing Score: {rubric.passingScore}% | Total Points: {rubric.totalPoints}</Text>
          {rubric.criteria.map((crit, j) => (
            <View key={j} style={{ marginBottom: 15 }}>
              <Text style={styles.bold}>{crit.name} (Weight: {crit.weight}%)</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.tableCell}>Level</Text>
                  <Text style={styles.tableCell}>Score</Text>
                  <Text style={styles.tableCell}>Description</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Excellent</Text>
                  <Text style={styles.tableCell}>{crit.levels.excellent.score}</Text>
                  <Text style={styles.tableCell}>{crit.levels.excellent.description.substring(0, 100)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Satisfactory</Text>
                  <Text style={styles.tableCell}>{crit.levels.satisfactory.score}</Text>
                  <Text style={styles.tableCell}>{crit.levels.satisfactory.description.substring(0, 100)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Needs Improvement</Text>
                  <Text style={styles.tableCell}>{crit.levels.needsImprovement.score}</Text>
                  <Text style={styles.tableCell}>{crit.levels.needsImprovement.description.substring(0, 100)}</Text>
                </View>
              </View>
            </View>
          ))}
          <Text style={styles.footer}>Elevate for Humanity | Practical Rubric</Text>
        </Page>
      ))}
    </Document>
  );
}

export async function generatePackagePDF(pkg: CurriculumPackage, approval: ApprovalPacket): Promise<Buffer> {
  try {
    const buffer = await renderToBuffer(
      React.createElement(CurriculumPackagePDF, { pkg, approval })
    );
    return buffer;
  } catch (error) {
    console.error('[PDFExporter] Generation failed:', error);
    throw new Error('PDF generation failed', { cause: error });
  }
}

export async function generateInstructorGuidePDF(
  guide: CurriculumPackage['instructorGuides']
): Promise<Buffer | null> {
  if (!guide) return null;

  const lines: string[] = [];
  lines.push(guide.programTitle);
  lines.push('Instructor Guide v' + guide.version);
  lines.push('');
  lines.push('Total Lecture Hours: ' + guide.totalLectureHours);
  lines.push('Total Lab Hours: ' + guide.totalLabHours);
  lines.push('Total Clinical Hours: ' + guide.totalClinicalHours);
  lines.push('');

  for (const mod of guide.modules) {
    lines.push('MODULE: ' + mod.moduleTitle);
    lines.push('========================');
    lines.push('Overview: ' + mod.moduleOverview);
    lines.push('');
    lines.push('Learning Objectives:');
    for (const o of mod.learningObjectives) {
      lines.push('- ' + o);
    }
    lines.push('');
    lines.push('Preparation Steps:');
    for (const s of mod.preparationSteps) {
      lines.push('- ' + s);
    }
    lines.push('');
    lines.push('Equipment Needed:');
    for (const e of mod.equipmentNeeded) {
      lines.push('- ' + e);
    }
    lines.push('');
    lines.push('Lecture Outline:');
    for (const l of mod.lectureOutline) {
      lines.push('  ' + l.topic + ' (' + l.duration + ' min)');
      lines.push('  Teaching Notes: ' + l.teachingNotes);
      lines.push('  Discussion: ' + l.discussionQuestions.join(', '));
    }
    lines.push('');
  }

  return Buffer.from(lines.join('\n'), 'utf-8');
}
