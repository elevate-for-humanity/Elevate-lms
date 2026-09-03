'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export default function ToasterWrapper() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '12px',
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );
}
