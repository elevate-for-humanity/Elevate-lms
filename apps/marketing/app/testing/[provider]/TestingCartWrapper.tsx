'use client';

import { TestingCartProvider } from '@/components/testing/TestingCart';
import { ProviderExamList } from '@/components/testing/ProviderExamList';
import type { ExamDefinition } from '@/lib/testing/proctoring-capabilities';

interface TestingCartWrapperProps {
  children?: React.ReactNode;
  providerKey?: string;
  exams?: (string | ExamDefinition)[];
  isActive?: boolean;
}

export default function TestingCartWrapper({ 
  children, 
  providerKey, 
  exams, 
  isActive 
}: TestingCartWrapperProps) {
  // If we have exam data, render the exam list
  if (providerKey && exams) {
    return (
      <ProviderExamList 
        providerKey={providerKey} 
        exams={exams} 
        isActive={isActive ?? false} 
      />
    );
  }
  
  // Otherwise, just wrap children with the provider
  return <TestingCartProvider>{children}</TestingCartProvider>;
}
