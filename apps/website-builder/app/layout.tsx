import type { ReactNode } from 'react';

export const metadata = {
  title: 'Elevate Website Builder',
  description: 'Build, import, edit and publish websites with Elevate and PARIS.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
