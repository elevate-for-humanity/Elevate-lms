"use client";

import React from 'react';

import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'signature_pad';
import { Button } from '@/components/ui/Button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSave,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(
    null
  );
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignatureCanvas(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });

      pad.addEventListener('endStroke', () => {
        setIsEmpty(pad.isEmpty());
      });

      setSignaturePad(pad);

      // Handle window resize
      const handleResize = () => {
        if (canvasRef.current && pad) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
          canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
          canvasRef.current.getContext('2d')?.scale(ratio, ratio);
          pad.clear();
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        pad.off();
      };
    }
  }, []);

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const dataUrl = signaturePad.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, touchAction: 'none' }}
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isEmpty}
        >
          Clear Signature
        </Button>
        <Button type="button" onClick={handleSave} disabled={isEmpty}>
          Save Signature
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Sign above using your mouse, trackpad, or touch screen
      </p>
    </div>
  );
}
