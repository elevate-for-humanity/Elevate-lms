import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { ProvisioningJob } from '../queue';

/**
 * STEP 6A: License suspend/reactivate job handler
 */
export async function processLicenseSuspend(job: ProvisioningJob): Promise<void> {
  const supabase = await requireAdminClient();
  const { licenseId, reason, action } = job.payload as {
    licenseId: string;
    reason: string;
    action: 'suspend' | 'reactivate';
  };

  if (!licenseId) {
    throw new Error('Missing required field: licenseId');
  }

  if (action === 'reactivate' || job.job_type === 'license_reactivate') {
    const { data, error } = await supabase.rpc('reactivate_license', {
      p_license_id: licenseId,
    });

    if (error) throw error;
    if (data?.success !== true) throw new Error(data?.message || 'License reactivation rejected');

    logger.info('License reactivated', {
      licenseId,
      correlationId: job.correlation_id,
    });
  } else {
    const { data, error } = await supabase.rpc('set_license_lifecycle', {
      p_license_id: licenseId,
      p_action: 'suspend',
      p_reason: reason || 'Automated suspension',
    });

    if (error) throw error;
    if (data?.success !== true) throw new Error(data?.message || 'License suspension rejected');

    logger.info('License suspended', {
      licenseId,
      reason,
      correlationId: job.correlation_id,
    });
  }
}
