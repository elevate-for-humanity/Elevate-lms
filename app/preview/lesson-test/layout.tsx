// Dead stub — no page.tsx exists. Layout retained to avoid 404 on direct navigation.
// Not indexed; no DB reads.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, background: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
