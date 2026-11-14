'use client';

import { useRef, useState } from 'react';
import { Upload, X, AlertCircle, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type UploadedFile = { id: string; name: string; size: number; type: string; url: string };
type Props = {
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  maxFileSize?: number;
  allowedTypes?: string[];
};

export function AssignmentSubmission({
  assignmentId,
  assignmentTitle,
  dueDate,
  maxFileSize = 10,
  allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'png', 'webp'],
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [comment, setComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    const accepted: UploadedFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (file.size > maxFileSize * 1024 * 1024) continue;
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !allowedTypes.includes(extension)) continue;
      accepted.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    }
    setFiles((current) => [...current, ...accepted]);
  }

  async function handleSubmit() {
    if (!files.length) return;
    setIsSubmitting(true);
    try {
      setSubmissionError('');
      const form = new FormData();
      form.set('submissionText', comment);
      if (files.length > 5) throw new Error('Submit up to five evidence files at a time.');
      for (const file of files) {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error('A selected file could not be read. Select it again.');
        form.append('file', await response.blob(), file.name);
      }
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your assignment could not be submitted.');
      setSubmitted(true);
    } catch (error) {
      logger.error('Assignment submission failed', error);
      setSubmissionError(
        error instanceof Error ? error.message : 'Your assignment could not be submitted.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted)
    return (
      <Card className="border-2 border-green-600">
        <CardContent className="p-12 text-center">
          <h2 className="text-2xl font-bold">Assignment Submitted</h2>
          <p className="mt-2 text-slate-700">Your instructor can now review the submission.</p>
        </CardContent>
      </Card>
    );

  const fileIcon = (type: string) =>
    type.startsWith('image/') ? (
      <ImageIcon className="h-5 w-5 text-blue-600" />
    ) : type.startsWith('video/') ? (
      <Video className="h-5 w-5 text-purple-600" />
    ) : (
      <FileText className="h-5 w-5 text-slate-700" />
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{assignmentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            Due {new Date(dueDate).toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFileSelect(event.dataTransfer.files);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center ${isDragging ? 'border-brand-orange-500 bg-orange-50' : 'border-slate-300'}`}
          >
            <Upload className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="font-semibold">Drop files here or click to browse</p>
            <p className="mt-1 text-sm text-slate-600">
              {allowedTypes.join(', ')} · maximum {maxFileSize} MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={allowedTypes.map((type) => `.${type}`).join(',')}
            onChange={(event) => handleFileSelect(event.currentTarget.files)}
          />
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-lg border p-3">
              {fileIcon(file.type)}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Comment (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.currentTarget.value)}
            rows={4}
            className="w-full rounded-lg border px-4 py-3"
          />
        </CardContent>
      </Card>
      {submissionError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">
          {submissionError}
        </p>
      )}
      <Button
        onClick={() => void handleSubmit()}
        disabled={isSubmitting || !files.length}
        className="w-full"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Assignment'}
      </Button>
    </div>
  );
}

export default AssignmentSubmission;
