export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Find the launch href from a parsed imsmanifest.xml.
 * Handles both SCORM 1.2 and 2004 manifest structures.
 */
function findLaunchHref(manifestObj: Record<string, any>): string | null {
  const resources =
    manifestObj?.manifest?.resources?.resource ??
    manifestObj?.['lom:manifest']?.resources?.resource;

  const arr = Array.isArray(resources) ? resources : resources ? [resources] : [];

  for (const r of arr) {
    if (typeof r?.href === 'string' && r.href.length > 0) return r.href;
  }
  return null;
}

/**
 * Find the SCORM version from the manifest metadata.
 */
function findScormVersion(manifestObj: Record<string, any>): string {
  const schemaVersion =
    manifestObj?.manifest?.metadata?.schemaversion ??
    manifestObj?.manifest?.metadata?.['adlcp:schemaversion'] ??
    '';
  if (typeof schemaVersion === 'string') {
    if (schemaVersion.includes('2004')) return '2004';
    if (schemaVersion.includes('1.2')) return '1.2';
  }
  return '1.2'; // default
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin/instructor role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const courseId = formData.get('course_id') as string;
    const title = (formData.get('title') as string) || file?.name || 'SCORM Package';

    if (!file || !courseId) {
      return NextResponse.json(
        { error: 'Missing file or course_id' },
        { status: 400 }
      );
    }

    // Read ZIP into memory
    const zipBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);

    // Parse imsmanifest.xml
    const manifestFile = zip.file('imsmanifest.xml') || zip.file(/imsmanifest\.xml$/i)[0];
    if (!manifestFile) {
      return NextResponse.json(
        { error: 'Invalid SCORM package: missing imsmanifest.xml' },
        { status: 400 }
      );
    }

    const manifestXml = await manifestFile.async('text');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const manifestObj = parser.parse(manifestXml);

    const launchHref = findLaunchHref(manifestObj);
    if (!launchHref) {
      return NextResponse.json(
        { error: 'Could not determine launch href from imsmanifest.xml' },
        { status: 400 }
      );
    }

    const scormVersion = findScormVersion(manifestObj);

    // Create DB record first to get the package ID
    const { data: scormData, error: scormError } = await db
      .from('scorm_packages')
      .insert({
        course_id: courseId,
        title,
        uploaded_by: user.id,
        scorm_version: scormVersion,
        status: 'processing',
      })
      .select()
      .single();

    if (scormError) throw scormError;

    const packageId = scormData.id;

    // Extract all files to storage under scorm/<packageId>/
    const uploadPromises: Promise<void>[] = [];
    zip.forEach((relativePath, entry) => {
      if (entry.dir) return;
      uploadPromises.push(
        entry.async('uint8array').then(async (bytes) => {
          const dest = `scorm/${packageId}/${relativePath}`;
          const { error: uploadErr } = await supabase.storage
            .from('course-content')
            .upload(dest, bytes, { upsert: true });
          if (uploadErr) {
            logger.error(`Failed to upload ${dest}:`, uploadErr);
          }
        })
      );
    });

    await Promise.all(uploadPromises);

    // Update DB with launch path and internal URL
    const internalLaunchUrl = `/api/scorm/content/${packageId}/${launchHref}`;
    await db
      .from('scorm_packages')
      .update({
        launch_path: launchHref,
        launch_url: internalLaunchUrl,
        manifest_data: manifestObj,
        storage_path: `scorm/${packageId}`,
        file_path: `scorm/${packageId}/${file.name}`,
        status: 'ready',
      })
      .eq('id', packageId);

    // Also store the original ZIP for re-extraction if needed
    await supabase.storage
      .from('course-content')
      .upload(`scorm/${packageId}/_original.zip`, new Uint8Array(zipBuffer), {
        upsert: true,
      });

    return NextResponse.json(
      {
        message: 'SCORM package uploaded and extracted',
        package: {
          id: packageId,
          title,
          scormVersion,
          launchPath: launchHref,
          launchUrl: internalLaunchUrl,
          status: 'ready',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('SCORM upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload SCORM package' },
      { status: 500 }
    );
  }
}
