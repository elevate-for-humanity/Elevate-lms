'use client';

import { useState, type ReactNode } from 'react';

export function ContactRequestForm({ children }: { children: ReactNode }) {
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      id="contact-form"
      className="space-y-6 scroll-mt-24"
      action="/api/contact"
      method="post"
      onInvalidCapture={() => setInvalid(true)}
      onInput={() => setInvalid(false)}
    >
      <p className="text-sm text-slate-600">All fields are required. Your message must include at least 10 characters.</p>
      {invalid && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          Please complete each required field, enter a valid email address, and include at least 10 characters in your message.
        </p>
      )}
      {children}
    </form>
  );
}
