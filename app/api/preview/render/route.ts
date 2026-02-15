
export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { gh, parseRepo } from '@/lib/github';
import { marked } from 'marked';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Simple HTML escape for security
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const ref = searchParams.get('ref') || 'main';
  const path = searchParams.get('path') || 'README.md';

  // If no repo specified, show Content
  if (!repo) {
    const Content = `
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            max-width: 600px;
          }
          h1 { font-size: 2.5rem; margin-bottom: 1rem; }
          p { font-size: 1.1rem; opacity: 0.9; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Live Preview</h1>
          <p>Select a file from the file tree to see a live preview here.</p>
          <p style="margin-top: 30px; font-size: 0.9rem; opacity: 0.7;">
            Supports Markdown, HTML, JSON, and text files.
          </p>
        </div>
      </body>
      </html>
    `;
    return new Response(Content, {
      headers: { 'content-type': 'text/html' },
    });
  }

  const client = gh();
  const { owner, name } = parseRepo(repo);

  try {
    // Fetch file from GitHub
    const response = await client.repos.getContent({
      owner,
      repo: name,
      path,
      ref,
    });

    // Handle directory case
    if (Array.isArray(response.data)) {
      const dirListing = `
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { color: #333; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px; border-bottom: 1px solid #eee; }
            li:hover { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>📁 Directory: ${path}</h2>
          <ul>
            ${response.data
              .map(
                (item) => `
              <li>
                ${item.type === 'dir' ? '📁' : '📄'} ${item.name}
              </li>
            `
              )
              .join('')}
          </ul>
        </body>
        </html>
      `;
      return new Response(dirListing, {
        headers: { 'content-type': 'text/html' },
      });
    }

    // Decode file content
    const raw = Buffer.from(response.data.content || '', 'base64').toString(
      'utf8'
    );

    let html = '';
    const fileExt = path.split('.').pop()?.toLowerCase();

    // Process based on file type
    if (fileExt === 'md' || fileExt === 'mdx') {
      // Markdown to HTML (marked already sanitizes by default)
      html = (await marked.parse(raw)) as string;
    } else if (fileExt === 'html' || fileExt === 'htm') {
      // Use HTML as-is (trusted source from GitHub)
      html = raw;
    } else if (fileExt === 'json') {
      // Pretty print JSON
      try {
        const parsed = JSON.parse(raw);
        const formatted = JSON.stringify(parsed, null, 2);
        html = `
          <div style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto;">
            <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">${escapeHtml(formatted)}</pre>
          </div>
        `;
      } catch (e) {
        html = `<pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto;">${escapeHtml(raw)}</pre>`;
      }
    } else if (
      ['js', 'ts', 'tsx', 'jsx', 'css', 'scss', 'py', 'go', 'rs'].includes(
        fileExt || ''
      )
    ) {
      // Code files
      html = `
        <div style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto;">
          <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">${escapeHtml(raw)}</pre>
        </div>
      `;
    } else {
      // Plain text
      html = `
        <pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 20px; border-radius: 8px; line-height: 1.5;">${escapeHtml(raw)}</pre>
      `;
    }

    // Final wrapper with styling
    const rendered = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${path}</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            padding: 20px;
            margin: 0;
            background: #ffffff;
            color: #333;
            line-height: 1.6;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 10px 0;
          }
          pre {
            background: #f5f5f5;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid #e0e0e0;
          }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          pre code {
            background: none;
            padding: 0;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
          }
          h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          h3 { font-size: 1.25em; }
          a {
            color: #0366d6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          blockquote {
            margin: 0;
            padding: 0 1em;
            color: #6a737d;
            border-left: 4px solid #dfe2e5;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
          }
          table th,
          table td {
            padding: 8px 12px;
            border: 1px solid #dfe2e5;
          }
          table th {
            background: #f6f8fa;
            font-weight: 600;
          }
          ul, ol {
            padding-left: 2em;
          }
          li {
            margin: 4px 0;
          }
          hr {
            border: none;
            border-top: 1px solid #eee;
            margin: 24px 0;
          }
          .file-info {
            background: #f6f8fa;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 0.9em;
            color: #586069;
          }
        </style>
      </head>
      <body>
        <div class="file-info">
          📄 <strong>${path}</strong> • ${ref}
        </div>
        ${html}
      </body>
      </html>
    `;

    return new Response(rendered, {
      headers: { 'content-type': 'text/html' },
    });
  } catch (error) { 
    logger.error(
      'Preview render error:',
      error instanceof Error ? error : new Error(String(error))
    );

    const errorHtml = `
      <html>
      <head>
        <style>
          body {
            font-family: sans-serif;
            padding: 40px;
            background: #fff5f5;
            color: #c53030;
          }
          .error-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            border: 2px solid #fc8181;
            max-width: 600px;
            margin: 0 auto;
          }
          h2 { margin-top: 0; }
          pre {
            background: #fff;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #feb2b2;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h2>❌ Error Rendering Preview</h2>
          <p><strong>File:</strong> ${path}</p>
          <p><strong>Repo:</strong> ${repo}</p>
          <p><strong>Branch:</strong> ${ref}</p>
          <pre>${toErrorMessage(error)}</pre>
        </div>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: { 'content-type': 'text/html' },
      status: 500,
    });
  }
}
