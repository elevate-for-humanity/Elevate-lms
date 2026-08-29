/**
 * Every Admin AI prompt enters one governed execution path.
 *
 * The command runtime selects the registered tool, stages protected actions
 * for approval, records the audit trail, and returns advisory output only
 * when no executable capability exists. Capability workspaces remain
 * available for direct inspection; users do not choose one before asking.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';

export function routeEllieMessage(message: string): EllieMessageRoute {
  void message;
  return 'command';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Unified execution',
  ops: 'Unified execution',
  platform: 'Unified execution',
};
