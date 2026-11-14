import React, { useState, useRef } from 'react';

/**
 * FileUpload Component - Drag and drop file upload
 */
export function FileUpload({ onUpload, folderId = null, maxSize = 100 * 1024 * 1024 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${formatBytes(maxSize)}`);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Upload failed');

      const uploadedFile = await response.json();

      if (onUpload) {
        onUpload(uploadedFile);
      }

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      // Error: $1
      alert('Failed to upload file');
      setUploading(false);
      setProgress(0);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--brand-info)' : 'var(--brand-border-dark)'}`,
          borderRadius: '0.5rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'var(--brand-surface)' : 'var(--brand-surface)',
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--brand-border)',
                borderTopColor: 'var(--brand-info)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <p
              style={{
                color: 'var(--brand-text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Uploading... {progress}%
            </p>
            <div
              style={{
                width: '100%',
                maxWidth: '300px',
                height: '8px',
                backgroundColor: 'var(--brand-border)',
                borderRadius: '4px',
                margin: '0 auto',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--brand-info)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                color: 'var(--brand-text-light)',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: '500',
                color: 'var(--brand-text)',
                marginBottom: '0.5rem',
              }}
            >
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
              Maximum file size: {formatBytes(maxSize)}
            </p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FileUpload;
