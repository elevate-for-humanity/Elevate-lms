'use client';

import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
}

export function PrintButton({ className }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => window.print()}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}

export default PrintButton;
