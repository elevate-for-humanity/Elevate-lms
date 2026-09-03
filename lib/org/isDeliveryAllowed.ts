import { OrgConfig } from './getOrgConfig';

export type DeliveryMode = 'online' | 'hybrid' | 'in_person';

/**
 * Check if a delivery mode is allowed for this org
 * Defaults to true for backward compatibility
 */
export function isDeliveryAllowed(config: OrgConfig, mode: DeliveryMode): boolean {
  return config?.delivery?.[mode] !== false;
}
