'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const offsets = {
  up:    { y: 20 },
  down:  { y: -20 },
  left:  { x: 20 },
  right: { x: -20 },
} as const;

export function Reveal({ children, className, delay = 0, direction = 'up' }: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
