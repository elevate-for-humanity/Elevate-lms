"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Pen, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SignatureInputProps {
  userName: string;
  documentId?: string;
  documentType?: string;
  onSignatureChange: (signature: string, type: 'TYPED' | 'DRAWN') => void;
  onSignatureSaved?: (signatureId: string) => void;
  required?: boolean;
  autoSave?: boolean;
}

export function SignatureInput({
  userName,
  documentId,
  documentType = 'enrollment_agreement',
  onSignatureChange,
  onSignatureSaved,
  required = true,
  autoSave = true,
}: SignatureInputProps) {
  const [signatureType, setSignatureType] = useState<'TYPED' | 'DRAWN'>('TYPED');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = '#1e3a8a';
      context.lineWidth = 2;
      contextRef.current = context;
    }
  }, [signatureType]);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Validate signature
  useEffect(() => {
    if (signatureType === 'TYPED') {
      // Check if typed signature matches user name (case insensitive)
      const normalizedTyped = typedSignature.toLowerCase().trim();
      const normalizedName = userName.toLowerCase().trim();
      setIsValid(normalizedTyped === normalizedName && typedSignature.length > 0);
    } else {
      // Check if canvas has content
      setIsValid(drawnSignature.length > 0);
    }
  }, [signatureType, typedSignature, drawnSignature, userName]);

  const handleTypedChange = (value: string) => {
    setTypedSignature(value);
    setSaved(false);
    setError(null);
    onSignatureChange(value, 'TYPED');
  };

  // Canvas drawing handlers
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    setIsDrawing(true);
    setSaved(false);
    setError(null);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.beginPath();
    context.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.lineTo(x, y);
    context.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setDrawnSignature(dataUrl);
      onSignatureChange(dataUrl, 'DRAWN');
    }
  }, [isDrawing, onSignatureChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature('');
    setSaved(false);
    onSignatureChange('', 'DRAWN');
  };

  // Save signature to database
  const saveSignature = async () => {
    if (!isValid || !userId) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      const signatureData = signatureType === 'TYPED' ? typedSignature : drawnSignature;
      
      // Save signature record
      const { data: signature, error: saveError } = await supabase
        .from('signatures')
        .insert({
          user_id: userId,
          document_id: documentId,
          document_type: documentType,
          signature_type: signatureType,
          signature_data: signatureData,
          signer_name: userName,
          ip_address: null, // Would be captured server-side
          user_agent: navigator.userAgent,
          signed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Log activity
      await supabase.from('user_activity').insert({
        user_id: userId,
        activity_type: 'document_signed',
        metadata: {
          document_id: documentId,
          document_type: documentType,
          signature_type: signatureType,
        },
      }).catch(() => {});

      setSaved(true);
      onSignatureSaved?.(signature.id);

    } catch (err: any) {
      console.error('Error saving signature:', err);
      setError(err.message || 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when valid
  useEffect(() => {
    if (autoSave && isValid && !saved && !saving && userId) {
      const timer = setTimeout(() => {
        saveSignature();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoSave, isValid, saved, saving, userId]);

  return (
    <div className="space-y-4">
      {/* Signature Type Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSignatureType('TYPED')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
            signatureType === 'TYPED'
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-slate-300 bg-white text-gray-700 hover:border-slate-400'
          }`}
        >
          <Type className="w-5 h-5" />
          <span className="font-medium">Type Signature</span>
        </button>
        <button
          type="button"
          onClick={() => setSignatureType('DRAWN')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
            signatureType === 'DRAWN'
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-slate-300 bg-white text-gray-700 hover:border-slate-400'
          }`}
        >
          <Pen className="w-5 h-5" />
          <span className="font-medium">Draw Signature</span>
        </button>
      </div>

      {/* Typed Signature Input */}
      {signatureType === 'TYPED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type Your Full Name {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder="Type your full name exactly as shown"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl ${
              typedSignature && !isValid 
                ? 'border-red-300 bg-red-50' 
                : 'border-slate-300'
            }`}
            style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">
              Must match: <strong className="text-gray-900">{userName}</strong>
            </p>
            {typedSignature && (
              <span className={`text-sm flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? (
                  <>
                    <Check className="w-4 h-4" /> Valid
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" /> Name doesn't match
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Drawn Signature Canvas */}
      {signatureType === 'DRAWN' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Draw Your Signature {required && <span className="text-red-500">*</span>}
            </label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-40 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Draw your signature using your mouse or touchscreen
          </p>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving signature...
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <Check className="w-4 h-4" />
          Signature saved successfully
        </div>
      )}

      {/* Legal Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Legal Notice:</strong> This digital signature has the same
          legal effect as a handwritten signature under the Electronic Signatures 
          in Global and National Commerce Act (E-SIGN Act). By signing, you agree 
          to be legally bound by this document.
        </p>
      </div>

      {/* Manual Save Button (if autoSave is disabled) */}
      {!autoSave && (
        <button
          type="button"
          onClick={saveSignature}
          disabled={!isValid || saving}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirm Signature
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default SignatureInput;
