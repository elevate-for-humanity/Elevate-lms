export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
