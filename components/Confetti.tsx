'use client';

import React from 'react';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiProps {
  active?: boolean;
  duration?: number;
  pieceCount?: number;
}

const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#F8B739', // Gold
  '#EC7063', // Pink
];

export default function Confetti({
  active = true,
  duration = 3000,
  pieceCount = 50,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        delay: Math.random() * 0.5,
      }));

      setPieces(newPieces);
      setIsActive(true);

      // Au after duration
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, pieceCount]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: '-10vh',
              rotate: piece.rotation,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: piece.delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Alternative: Confetti Cannon Effect
export function ConfettiCannon({
  active = true,
  duration = 2000,
}: Omit<ConfettiProps, 'pieceCount'>) {
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isActive) return null;

  const leftCannon = Array.from({ length: 30 }, (_, i) => ({
    id: `left-${i}`,
    angle: -60 + Math.random() * 40,
    velocity: 15 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));

  const rightCannon = Array.from({ length: 30 }, (_, i) => ({
    id: `right-${i}`,
    angle: 180 + 60 - Math.random() * 40,
    velocity: 15 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Left Cannon */}
      {leftCannon.map((piece) => {
        const radians = (piece.angle * Math.PI) / 180;
        const vx = Math.cos(radians) * piece.velocity;
        const vy = Math.sin(radians) * piece.velocity;

        return (
          <motion.div
            key={piece.id}
            initial={{
              x: '0vw',
              y: '100vh',
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: `${vx * 5}vw`,
              y: `${100 + vy * 5}vh`,
              rotate: 720,
              opacity: 0,
            }}
            transition={{
              duration: 2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: 'absolute',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        );
      })}

      {/* Right Cannon */}
      {rightCannon.map((piece) => {
        const radians = (piece.angle * Math.PI) / 180;
        const vx = Math.cos(radians) * piece.velocity;
        const vy = Math.sin(radians) * piece.velocity;

        return (
          <motion.div
            key={piece.id}
            initial={{
              x: '100vw',
              y: '100vh',
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: `${100 + vx * 5}vw`,
              y: `${100 + vy * 5}vh`,
              rotate: -720,
              opacity: 0,
            }}
            transition={{
              duration: 2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: 'absolute',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        );
      })}
    </div>
  );
}

// Burst Effect from Center
export function ConfettiBurst({ active = true, duration = 2000, pieceCount = 40 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isActive) return null;

  const pieces = Array.from({ length: pieceCount }, (_, i) => {
    const angle = (360 / pieceCount) * i;
    const radians = (angle * Math.PI) / 180;
    const velocity = 20 + Math.random() * 15;

    return {
      id: i,
      angle,
      vx: Math.cos(radians) * velocity,
      vy: Math.sin(radians) * velocity,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: 0,
            y: 0,
            rotate: piece.rotation,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: piece.vx * 30,
            y: piece.vy * 30,
            rotate: piece.rotation + 720,
            opacity: 0,
            scale: 1,
          }}
          transition={{
            duration: 1.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            position: 'absolute',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}
    </div>
  );
}
