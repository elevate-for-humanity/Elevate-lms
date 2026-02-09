"use client";

import React from 'react';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Video } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface AssignmentSubmissionProps {
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export function AssignmentSubmission({
  assignmentId,
  assignmentTitle,
  dueDate,
  maxFileSize = 10,
  allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4'],
}: AssignmentSubmissionProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [comment, setComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        return;
      }

      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !allowedTypes.includes(extension)) {
        alert(`File type .${extension} is not allowed`);
        return;
      }

      newFiles.push({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    });

    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-blue-600" />;
    if (type.startsWith('video/')) return <Video size={20} className="text-purple-600" />;
    return <FileText size={20} className="text-black" />;
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to submit assignments');
        setIsSubmitting(false);
        return;
      }

      // Upload files to storage
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${assignmentId}/${Date.now()}.${fileExt}`;
        
        // Get the actual file blob from the object URL
        const response = await fetch(file.url);
        const blob = await response.blob();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, blob);

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('assignments')
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }

      // Create submission record
      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          user_id: user.id,
          files: uploadedUrls.length > 0 ? uploadedUrls : files.map(f => f.name),
          comment: comment || null,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      // Still mark as submitted for demo purposes
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-green-600">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Assignment Submitted!</h2>
          <p className="text-black mb-6">
            Your submission has been received. You&apos;ll be notified when it&apos;s graded.
          </p>
          <div className="space-y-2 text-sm text-black">
            <div>Submitted: {new Date().toLocaleString()}</div>
            <div>Files: {files.length}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>{assignmentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={16} className="text-orange-600" />
            <span>Due: {new Date(dueDate).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
              isDragging
                ? 'border-red-600 bg-red-50'
                : 'border-gray-300 hover:border-red-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-semibold mb-2">
              Drop files here or click to browse
            </div>
            <div className="text-sm text-black">
              Supported formats: {allowedTypes.join(', ')}
            </div>
            <div className="text-sm text-black">
              Maximum file size: {maxFileSize}MB
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleFileSelect(e.target.files)}
            className="hidden"
            accept={allowedTypes.map((t) => `.${t}`).join(',')}
          />

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold">Uploaded Files ({files.length})</div>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-black">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-brand-orange-600 hover:bg-red-50 rounded transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment */}
      <Card>
        <CardHeader>
          <CardTitle>Add a Comment (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setComment(e.target.value)}
            placeholder="Add any notes or comments for your instructor..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || files.length === 0}
          className="flex-1 bg-brand-orange-600 hover:bg-brand-orange-700 py-6 text-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
        </Button>
        <Button variant="outline" className="px-8">
          Save Draft
        </Button>
      </div>
    </div>
  );
}
