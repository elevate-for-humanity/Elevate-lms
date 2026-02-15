'use client';

import { useExperiment } from '@/lib/experiments/ab-testing';
import { ReactNode } from 'react';

interface ABTestProps {
  experiment: Experiment;
  children: (variant: { id: string; name: string }) => ReactNode;
  fallback?: ReactNode;
}

/**
 * A/B Test wrapper component
 * 
 * Usage:
 * ```tsx
 * <ABTest experiment={EXPERIMENTS.homepageCTA}>
 *   {(variant) => (
 *     <Button color={variant.id === 'green' ? 'green' : 'blue'}>
 *       Apply Now
 *     </Button>
 *   )}
 * </ABTest>
 * ```
 */
export function ABTest({ experiment, children, fallback }: ABTestProps) {
  const { variant, isLoading } = useExperiment(experiment);
  
  if (isLoading && fallback) {
    return <>{fallback}</>;
  }
  
  return <>{children(variant)}</>;
}

/**
 * Variant component for cleaner syntax
 * 
 * Usage:
 * ```tsx
 * <Experiment experiment={EXPERIMENTS.homepageCTA}>
 *   <Variant id="control">
 *     <Button color="blue">Apply Now</Button>
 *   </Variant>
 *   <Variant id="green">
 *     <Button color="green">Apply Now</Button>
 *   </Variant>
 * </Experiment>
 * ```
 */
interface ExperimentProps {
  experiment: Experiment;
  children: ReactNode;
}

interface VariantProps {
  id: string;
  children: ReactNode;
}

export function Experiment({ experiment, children }: ExperimentProps) {
  const { variant } = useExperiment(experiment);
  
  // Find the matching variant child
  const childArray = Array.isArray(children) ? children : [children];
  
  for (const child of childArray) {
    if (
      child && 
      typeof child === 'object' && 
      'props' in child &&
      child.props?.id === variant.id
    ) {
      return <>{child.props.children}</>;
    }
  }
  
  // Fallback to control variant
  for (const child of childArray) {
    if (
      child && 
      typeof child === 'object' && 
      'props' in child &&
      child.props?.id === 'control'
    ) {
      return <>{child.props.children}</>;
    }
  }
  
  // Return first child as last resort
  return <>{childArray[0]}</>;
}

export function Variant({ children }: VariantProps) {
  return <>{children}</>;
}

/**
 * Hook-based approach for more complex scenarios
 */
export { useExperiment } from '@/lib/experiments/ab-testing';
