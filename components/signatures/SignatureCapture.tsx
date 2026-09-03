'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { PenLine, Type, Trash2 } from 'lucide-react';

// Signature fonts — loaded via Google Fonts in layout
const TYPED_FONTS = [
  { label: 'Cursive', family: 'Dancing Script, cursive' },
  { label: 'Elegant', family: 'Great Vibes, cursive' },
  { label: 'Classic', family: 'Pacifico, cursive' },
  { label: 'Print', family: 'Caveat, cursive' },
];

export type SignatureMode = 'draw' | 'typed';

export interface SignatureCaptureResult {
  mode: SignatureMode;
  signatureData?: string; // base64 PNG (draw mode)
  typedName?: string; // typed name string
  fontFamily?: string; // font used in typed mode
}

interface Props {
  signerName?: string; // pre-fill typed name
  onChange: (result: SignatureCaptureResult | null) => void;
}

export default function SignatureCapture({ signerName = '', onChange }: Props) {
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedName, setTypedName] = useState(signerName);
  const [selectedFont, setSelectedFont] = useState(TYPED_FONTS[0]);
  const [isEmpty, setIsEmpty] = useState(true);

  // Canvas draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (mode === 'draw') {
      setupCanvas();
      window.addEventListener('resize', setupCanvas);
      return () => window.removeEventListener('resize', setupCanvas);
    }
  }, [mode, setupCanvas]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    setIsEmpty(false);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    canvasRef.current?.getContext('2d')?.closePath();
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    if (dataUrl) onChange({ mode: 'draw', signatureData: dataUrl });
  };

  const clearCanvas = () => {
    setupCanvas();
    setIsEmpty(true);
    onChange(null);
  };

  // Typed mode — emit on change
  useEffect(() => {
    if (mode === 'typed') {
      if (typedName.trim()) {
        onChange({ mode: 'typed', typedName: typedName.trim(), fontFamily: selectedFont.family });
      } else {
        onChange(null);
      }
    }
  }, [mode, typedName, selectedFont, onChange]);

  const switchMode = (m: SignatureMode) => {
    setMode(m);
    onChange(null);
    setIsEmpty(true);
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => switchMode('draw')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'draw'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PenLine className="w-3.5 h-3.5" /> Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode('typed')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${
            mode === 'typed'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Type className="w-3.5 h-3.5" /> Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Guide line */}
            <div className="absolute bottom-10 left-6 right-6 border-b border-dashed border-slate-200 pointer-events-none" />
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className="block w-full cursor-crosshair touch-none"
              style={{ height: '140px' }}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-300 text-sm select-none">Sign here</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={isEmpty}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full name"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
          {/* Font picker */}
          <div className="flex flex-wrap gap-2">
            {TYPED_FONTS.map((f) => (
              <button
                key={f.family}
                type="button"
                onClick={() => setSelectedFont(f)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  selectedFont.family === f.family
                    ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                style={{ fontFamily: f.family }}
              >
                {typedName || 'Preview'}
              </button>
            ))}
          </div>
          {/* Live preview */}
          {typedName && (
            <div className="border-2 border-slate-200 rounded-xl bg-white px-6 py-4 min-h-[80px] flex items-center">
              <span
                className="text-3xl text-slate-800 leading-none"
                style={{ fontFamily: selectedFont.family }}
              >
                {typedName}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">
        By signing, you agree this electronic signature is legally binding.
      </p>
    </div>
  );
}
