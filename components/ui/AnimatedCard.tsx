'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

type AnimatedCardProps = Omit<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'transition' | 'whileHover'
>;

export function AnimatedCard({ className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 18px 35px rgba(15,23,42,0.18)' }}
      className={clsx('rounded-2xl border border-slate-100 bg-white shadow-card', className)}
      {...props}
    />
  );
}
