export type FeatureSurface =
  | 'global'
  | 'lms'
  | 'lms-lesson'
  | 'admin'
  | 'admin-course-builder'
  | 'admin-compliance'
  | 'admin-analytics'
  | 'marketing'
  | 'employer'
  | 'learner';

export type FeatureCategory =
  | 'avatar'
  | 'analytics'
  | 'video'
  | 'ai'
  | 'compliance'
  | 'marketing'
  | 'engagement'
  | 'tracking';

export type FeatureStatus = 'enabled' | 'disabled' | 'beta';

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  component: string;       // import path
  surface: FeatureSurface;
  category: FeatureCategory;
  status: FeatureStatus;
  requiresEnvVar?: string; // gate on env var presence
}
