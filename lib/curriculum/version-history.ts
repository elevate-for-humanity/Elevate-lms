/**
 * lib/curriculum/version-history.ts
 * 
 * Version History for Curriculum Packages
 * Tracks revisions, enables rollback, maintains audit trail
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { CurriculumPackage } from '@/lib/curriculum/package/types';

export interface VersionEntry {
  id: string;
  programId: string;
  version: string;
  label: string;
  createdAt: string;
  createdBy: string;
  package: CurriculumPackage;
  changes: VersionChange[];
  status: 'draft' | 'published' | 'archived';
  notes?: string;
}

export interface VersionChange {
  field: string;
  previousValue: string;
  newValue: string;
  type: 'added' | 'modified' | 'deleted';
}

export interface VersionDiff {
  added: { field: string; value: string }[];
  modified: { field: string; from: string; to: string }[];
  deleted: { field: string; value: string }[];
}

/**
 * Compare two curriculum packages and return diff
 */
export function diffPackages(a: CurriculumPackage, b: CurriculumPackage): VersionDiff {
  const diff: VersionDiff = { added: [], modified: [], deleted: [] };

  // Compare top-level fields
  if (a.programTitle !== b.programTitle) {
    diff.modified.push({ field: 'programTitle', from: a.programTitle, to: b.programTitle });
  }
  if (a.credentialCode !== b.credentialCode) {
    diff.modified.push({ field: 'credentialCode', from: a.credentialCode, to: b.credentialCode });
  }
  if (a.state !== b.state) {
    diff.modified.push({ field: 'state', from: a.state, to: b.state });
  }

  // Compare clock hour breakdowns
  if (JSON.stringify(a.clockHourBreakdown) !== JSON.stringify(b.clockHourBreakdown)) {
    diff.modified.push({ 
      field: 'clockHourBreakdown', 
      from: JSON.stringify(a.clockHourBreakdown), 
      to: JSON.stringify(b.clockHourBreakdown) 
    });
  }

  // Compare document counts
  const aDocCount = (a.instructorGuides ? 1 : 0) + (a.syllabus ? 1 : 0) + 
                    a.skillsChecklists.length + a.practicalRubrics.length;
  const bDocCount = (b.instructorGuides ? 1 : 0) + (b.syllabus ? 1 : 0) + 
                    b.skillsChecklists.length + b.practicalRubrics.length;
  if (aDocCount !== bDocCount) {
    diff.modified.push({ 
      field: 'documentCount', 
      from: String(aDocCount), 
      to: String(bDocCount) 
    });
  }

  return diff;
}

/**
 * Generate version label from diff
 */
export function generateVersionLabel(diff: VersionDiff): string {
  const changes = diff.added.length + diff.modified.length + diff.deleted.length;
  
  if (changes === 0) return 'Minor update';
  if (changes <= 3) return 'Small update';
  if (changes <= 10) return 'Major update';
  return 'Revision';
}

/**
 * Create a new version entry
 */
export async function createVersion(
  programId: string,
  pkg: CurriculumPackage,
  createdBy: string,
  notes?: string
): Promise<VersionEntry> {
  const supabase = createAdminClient();
  const version = `v${Date.now()}`;
  const label = generateVersionLabel({ added: [], modified: [], deleted: [] });

  // Fetch previous version if exists
  const { data: prevVersions } = await supabase
    .from('curriculum_versions')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(1);

  let changes: VersionChange[] = [];
  if (prevVersions && prevVersions.length > 0) {
    const diff = diffPackages(prevVersions[0].package as CurriculumPackage, pkg);
    changes = [
      ...diff.added.map(d => ({ ...d, type: 'added' as const })),
      ...diff.modified.map(d => ({ ...d, type: 'modified' as const })),
      ...diff.deleted.map(d => ({ ...d, type: 'deleted' as const })),
    ];
  }

  const entry: VersionEntry = {
    id: crypto.randomUUID(),
    programId,
    version,
    label,
    createdAt: new Date().toISOString(),
    createdBy,
    package: pkg,
    changes,
    status: 'draft',
    notes,
  };

  // Insert into database
  await supabase.from('curriculum_versions').insert({
    id: entry.id,
    program_id: programId,
    version,
    label,
    created_at: entry.createdAt,
    created_by: createdBy,
    package_json: pkg,
    changes_json: changes,
    status: 'draft',
    notes,
  });

  return entry;
}

/**
 * Get version history for a program
 */
export async function getVersionHistory(programId: string): Promise<VersionEntry[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[VersionHistory] Fetch failed:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    programId: row.program_id,
    version: row.version,
    label: row.label,
    createdAt: row.created_at,
    createdBy: row.created_by,
    package: row.package_json as CurriculumPackage,
    changes: row.changes_json as VersionChange[],
    status: row.status,
    notes: row.notes,
  }));
}

/**
 * Get specific version
 */
export async function getVersion(versionId: string): Promise<VersionEntry | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    programId: data.program_id,
    version: data.version,
    label: data.label,
    createdAt: data.created_at,
    createdBy: data.created_by,
    package: data.package_json as CurriculumPackage,
    changes: data.changes_json as VersionChange[],
    status: data.status,
    notes: data.notes,
  };
}

/**
 * Rollback to previous version
 */
export async function rollbackToVersion(
  programId: string,
  versionId: string,
  rolledBackBy: string
): Promise<{ success: boolean; newVersionId?: string; error?: string }> {
  const supabase = createAdminClient();

  // Get the version to rollback to
  const targetVersion = await getVersion(versionId);
  if (!targetVersion) {
    return { success: false, error: 'Version not found' };
  }

  // Create a new version based on the rollback target
  const newVersion = await createVersion(
    programId,
    targetVersion.package,
    rolledBackBy,
    `Rolled back from ${targetVersion.version}`
  );

  // Mark the rollback as published (it's now the current version)
  await supabase
    .from('curriculum_versions')
    .update({ status: 'published' })
    .eq('id', newVersion.id);

  // Archive the old current version
  await supabase
    .from('curriculum_versions')
    .update({ status: 'archived' })
    .eq('program_id', programId)
    .neq('id', newVersion.id);

  return { success: true, newVersionId: newVersion.id };
}

/**
 * Publish a version (make it the current version)
 */
export async function publishVersion(
  versionId: string,
  publishedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const version = await getVersion(versionId);
  if (!version) {
    return { success: false, error: 'Version not found' };
  }

  // Update version status
  const { error } = await supabase
    .from('curriculum_versions')
    .update({ status: 'published' })
    .eq('id', versionId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Archive other versions for this program
  await supabase
    .from('curriculum_versions')
    .update({ status: 'archived' })
    .eq('program_id', version.programId)
    .neq('id', versionId)
    .eq('status', 'published');

  return { success: true };
}

/**
 * Get current published version
 */
export async function getCurrentVersion(programId: string): Promise<VersionEntry | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('*')
    .eq('program_id', programId)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    programId: data.program_id,
    version: data.version,
    label: data.label,
    createdAt: data.created_at,
    createdBy: data.created_by,
    package: data.package_json as CurriculumPackage,
    changes: data.changes_json as VersionChange[],
    status: data.status,
    notes: data.notes,
  };
}
