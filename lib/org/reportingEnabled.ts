import { OrgConfig } from './getOrgConfig';

export type ReportType = 'attendance' | 'outcomes' | 'credentials' | 'exports_enabled';

/**
 * Check if a report type is enabled for this org
 * Defaults to true for backward compatibility
 */
export function reportingEnabled(config: OrgConfig, report: ReportType): boolean {
  return config?.reporting?.[report] !== false;
}
