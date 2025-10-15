import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
}

export const AnimatedCard = ({ children }: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-auth-card)]">
        {children}
      </div>
    </motion.div>
  );
};