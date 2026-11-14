import { FEATURE_REGISTRY } from './registry';
import type { FeatureDefinition, FeatureSurface, FeatureStatus } from './types';

export function getAllFeatures(): FeatureDefinition[] {
  return FEATURE_REGISTRY;
}

export function getFeature(id: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY.find((f) => f.id === id);
}

export function isFeatureEnabled(id: string): boolean {
  const feature = getFeature(id);
  if (!feature) return false;
  if (feature.status === 'disabled') return false;
  if (feature.requiresEnvVar && !process.env[feature.requiresEnvVar]) return false;
  return true;
}

export function getFeaturesForSurface(surface: FeatureSurface): FeatureDefinition[] {
  return FEATURE_REGISTRY.filter((f) => f.surface === surface);
}

export function getEnabledFeaturesForSurface(surface: FeatureSurface): FeatureDefinition[] {
  return getFeaturesForSurface(surface).filter((f) => isFeatureEnabled(f.id));
}

export function groupFeaturesByStatus(): Record<FeatureStatus, FeatureDefinition[]> {
  const groups: Record<FeatureStatus, FeatureDefinition[]> = {
    enabled: [],
    disabled: [],
    beta: [],
  };
  for (const f of FEATURE_REGISTRY) {
    groups[f.status].push(f);
  }
  return groups;
}
