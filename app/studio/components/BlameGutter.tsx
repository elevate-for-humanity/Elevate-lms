'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BlameInfo {
  sha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  avatar?: string;
  login?: string;
}

interface BlameGutterProps {
  repo: string;
  path: string;
  branch: string;
  token: string;
  lineCount: number;
  visible: boolean;
}

export function BlameGutter({ repo, path, branch, token, lineCount, visible }: BlameGutterProps) {
  const [blame, setBlame] = useState<Record<number, BlameInfo>>({});
  const [loading, setLoading] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !path) return;

    async function loadBlame() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/github/blame?repo=${repo}&path=${encodeURIComponent(path)}&ref=${branch}`,
          { headers: { 'x-gh-token': token } }
        );
        const data = await res.json();
        if (data.blame) {
          setBlame(data.blame);
        }
      } catch (error) {
        console.error('Failed to load blame:', error);
      }
      setLoading(false);
    }

    loadBlame();
  }, [repo, path, branch, token, visible]);

  if (!visible) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Group consecutive lines with same commit
  const groups: { startLine: number; endLine: number; info: BlameInfo }[] = [];
  let currentGroup: { startLine: number; endLine: number; info: BlameInfo } | null = null;

  for (let line = 1; line <= lineCount; line++) {
    const info = blame[line];
    if (!info) continue;

    if (currentGroup && currentGroup.info.sha === info.sha) {
      currentGroup.endLine = line;
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { startLine: line, endLine: line, info };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  return (
    <div style={{
      width: 200,
      borderRight: '1px solid #3c3c3c',
      fontSize: 11,
      fontFamily: 'ui-monospace, monospace',
      overflow: 'hidden',
      background: '#1e1e1e',
    }}>
      {loading ? (
        <div style={{ padding: 8, color: '#888' }}>Loading blame...</div>
      ) : (
        <div style={{ position: 'relative' }}>
          {groups.map((group, i) => {
            const lineHeight = 19; // Monaco default line height
            const top = (group.startLine - 1) * lineHeight;
            const height = (group.endLine - group.startLine + 1) * lineHeight;
            const isHovered = hoveredLine !== null && 
              hoveredLine >= group.startLine && 
              hoveredLine <= group.endLine;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top,
                  height,
                  left: 0,
                  right: 0,
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 2,
                  background: isHovered ? '#2d2d2d' : 'transparent',
                  borderBottom: '1px solid #2d2d2d',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredLine(group.startLine)}
                onMouseLeave={() => setHoveredLine(null)}
                title={`${group.info.message}\n\n${group.info.author} <${group.info.email}>\n${group.info.sha.slice(0, 7)}`}
              >
                <div style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {group.info.avatar && (
                    <Image 
                      src={group.info.avatar} 
                      alt={group.info.author || 'Author'} 
                      width={14}
                      height={14}
                      style={{ 
                        borderRadius: '50%', 
                        marginRight: 4,
                        verticalAlign: 'middle',
                      }} 
                    />
                  )}
                  <span style={{ color: '#888' }}>
                    {group.info.login || group.info.author.split(' ')[0]}
                  </span>
                  <span style={{ color: '#555', marginLeft: 4 }}>
                    {formatDate(group.info.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
