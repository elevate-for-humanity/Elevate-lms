/**
 * lib/curriculum/export/pdf-exporter.ts
 * 
 * PDF Export for Curriculum Package
 * Uses @react-pdf/renderer for PDF generation
 */

import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
  checkbox: { width: 10, height: 10, marginRight: 5 },
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
        {/* Header */}
        <Text style={styles.header}>{pkg.programTitle}</Text>
        <Text style={styles.subheader}>
          Curriculum Package - {pkg.credentialCode} | {pkg.state}
        </Text>
        <Text style={styles.text}>Generated: {new Date(pkg.generatedAt).toLocaleDateString()}</Text>
        
        {/* Clock Hours */}
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
        
        {/* Approval Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Checklist ({summary.passed}/{summary.total})</Text>
          {checklist.map((item, i) => (
            <View key={i} style={styles.list}>
              <Text style={styles.listItem}>
                [{item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '○'}] {item.item}
              </Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.footer}>Elevate for Humanity | Curriculum Package Export</Text>
      </Page>
      
      {/* Skills Checklists */}
      {pkg.skillsChecklists.map((checklist, i) => (
        <Page key={`checklist-${i}`} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Skills Checklist: {checklist.moduleTitle}</Text>
          <Text style={styles.text}>Total Tasks: {checklist.totalTasks} | Required: {checklist.requiredTasks}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>Task</Text>
              <Text style={styles.tableCell}>Criteria</Text>
              <Text style={styles.tableCell}>Method</Text>
            </View>
            {checklist.checklistItems.map((item, j) => (
              <View key={j} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.stepNumber}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.task}</Text>
                <Text style={styles.tableCell}>{item.observationCriteria.substring(0, 30)}...</Text>
                <Text style={styles.tableCell}>{item.method}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footer}>Elevate for Humanity | Skills Checklist</Text>
        </Page>
      ))}
      
      {/* Rubrics */}
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
                  <Text style={styles.tableCell}>{crit.levels.excellent.description.substring(0, 100)}...</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Satisfactory</Text>
                  <Text style={styles.tableCell}>{crit.levels.satisfactory.score}</Text>
                  <Text style={styles.tableCell}>{crit.levels.satisfactory.description.substring(0, 100)}...</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Needs Improvement</Text>
                  <Text style={styles.tableCell}>{crit.levels.needsImprovement.score}</Text>
                  <Text style={styles.tableCell}>{crit.levels.needsImprovement.description.substring(0, 100)}...</Text>
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

/**
 * Generate PDF buffer from curriculum package
 */
export async function generatePackagePDF(pkg: CurriculumPackage, approval: ApprovalPacket): Promise<Buffer> {
  try {
    const buffer = await renderToBuffer(
      React.createElement(CurriculumPackagePDF, { package: pkg, approval })
    );
    return buffer;
  } catch (error) {
    console.error('[PDFExporter] Generation failed:', error);
    throw new Error('PDF generation failed');
  }
}

/**
 * Generate PDF for instructor guide
 */
export async function generateInstructorGuidePDF(
  guide: CurriculumPackage['instructorGuides']
): Promise<Buffer | null> {
  if (!guide) return null;
  
  // Simple text-based PDF for instructor guide
  const content = `
${guide.programTitle}
Instructor Guide v${guide.version}

Total Lecture Hours: ${guide.totalLectureHours}
Total Lab Hours: ${guide.totalLabHours}
Total Clinical Hours: ${guide.totalClinicalHours}

${guide.modules.map(mod => `
MODULE: ${mod.moduleTitle}
========================
Overview: ${mod.moduleOverview}

Learning Objectives:
${mod.learningObjectives.map(o => `- ${o}`).join('\n')}

Preparation Steps:
${mod.preparationSteps.map(s => `- ${s}`).join('\n')}

Equipment Needed:
${mod.equipmentNeeded.map(e => `- ${e}`).join('\n')}

Lecture Outline:
${mod.lectureOutline.map(l => `
  ${l.topic} (${l.duration} min)
  Teaching Notes: ${l.teachingNotes}
  Discussion: ${l.discussionQuestions.join(', ')}
`).join('\n')}
`).join('\n')}
`).join('\n')}
`;

  // Convert to buffer (simplified - in production use proper PDF generation)
  return Buffer.from(content, 'utf-8');
}
