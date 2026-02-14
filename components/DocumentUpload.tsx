"use client";

import React from 'react';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, File, FileText, Image as ImageIcon, X, Check,
  AlertCircle, Loader, Download, Eye, Trash2
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface DocumentUploadProps {
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
  required?: boolean;
}

export default function DocumentUpload({
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  onUploadComplete,
  required = false
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not accepted. Allowed types: ${acceptedTypes.join(', ')}`;
    }

    // Check total files
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'success', progress: 100, url: URL.createObjectURL(f.file) }
            : f
        ));
      } else {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 200);
  };

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    setError(null);
    const fileArray = Array.from(newFiles);

    fileArray.forEach(file => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setFiles(prev => [...prev, uploadedFile]);
      simulateUpload(uploadedFile.id);
    });
  }, [files.length, maxFiles, maxSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return ImageIcon;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const successCount = files.filter(f => f.status === 'success').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
          isDragging
            ? 'border-brand-blue-500 bg-brand-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-brand-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            className="inline-block"
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-brand-blue-600' : 'bg-gray-200'
            }`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-black'}`} />
            </div>
          </motion.div>

          <h3 className="text-xl font-bold text-black mb-2">
            {isDragging ? 'Drop files here' : 'Upload Documents'}
          </h3>

          <p className="text-black mb-4">
            Drag and drop files here, or click to browse
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Choose Files
          </button>

          <div className="mt-6 text-sm text-gray-500 space-y-1">
            <p>Accepted formats: {acceptedTypes.join(', ')}</p>
            <p>Maximum file size: {maxSize}MB</p>
            <p>Maximum files: {maxFiles}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Upload Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-brand-orange-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-black">
              Uploaded Files ({successCount}/{files.length})
            </h4>
            {uploadingCount > 0 && (
              <span className="text-sm text-brand-blue-600">
                Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...
              </span>
            )}
          </div>

          <AnimatePresence>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      file.status === 'success' ? 'bg-green-100' :
                      file.status === 'error' ? 'bg-red-100' :
                      'bg-brand-blue-100'
                    }`}>
                      {file.status === 'success' ? (
                        <Check className="w-6 h-6 text-green-600" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-brand-orange-600" />
                      ) : (
                        <FileIcon className="w-6 h-6 text-brand-blue-600" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-semibold text-black truncate">
                          {file.name}
                        </h5>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {file.status === 'uploading' && (
                        <div className="mb-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-brand-blue-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-black">
                              Uploading... {Math.round(file.progress)}%
                            </span>
                            <Loader className="w-4 h-4 text-brand-blue-600 animate-spin" />
                          </div>
                        </div>
                      )}

                      {file.status === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          <span>Upload complete</span>
                        </div>
                      )}

                      {file.status === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-brand-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{file.error || 'Upload failed'}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === 'success' && file.url && (
                        <>
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-2 text-black hover:text-brand-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-2 text-black hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-black hover:text-brand-orange-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Required Field Indicator */}
      {required && files.length === 0 && (
        <p className="mt-4 text-sm text-black">
          * At least one document is required
        </p>
      )}

      {/* Success Summary */}
      {successCount > 0 && successCount === files.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">All files uploaded successfully!</h4>
            <p className="text-sm text-green-700">
              {successCount} file{successCount > 1 ? 's' : ''} ready for submission
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
