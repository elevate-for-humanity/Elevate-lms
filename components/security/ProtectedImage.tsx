"use client";

import React from 'react';

import Image from "next/image";
import { useState } from "react";

interface ProtectedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Protected Image Component
 * - Adds invisible watermark overlay
 * - Prevents right-click and drag
 * - Disables context menu
 */
export function ProtectedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority,
  sizes,
}: ProtectedImageProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative select-none" onContextMenu={handleContextMenu}>
      {/* Invisible watermark overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.02) 100px, rgba(255,255,255,0.02) 200px)",
        }}
      >
        <div className="absolute bottom-2 right-2 text-[8px] text-white/20 font-mono">
          © Elevate for Humanity
        </div>
      </div>

      {/* The actual image */}
      <div onDragStart={handleDragStart}>
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className={className}
            priority={priority}
            sizes={sizes}
            draggable={false}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            priority={priority}
            sizes={sizes}
            draggable={false}
          />
        )}
      </div>

      {/* Warning message */}
      {showWarning && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="rounded-lg bg-white px-4 py-3 text-center text-white">
            <p className="text-sm font-semibold">⚠️ Content Protected</p>
            <p className="mt-1 text-xs">
              This image is copyrighted by Elevate for Humanity
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
