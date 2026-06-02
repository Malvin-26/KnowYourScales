import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const baseClass = (hover?: boolean, className?: string) =>
  `glass rounded-2xl p-5 text-left w-full ${hover ? 'cursor-pointer hover:border-brand-500/30 transition-colors' : ''} ${className ?? ''}`;

export function Card({ children, className = '', hover, onClick }: CardProps) {
  if (onClick) {
    return (
      <motion.button
        type="button"
        whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
        className={baseClass(hover, className)}
        onClick={onClick}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      className={baseClass(hover, className)}
    >
      {children}
    </motion.div>
  );
}
