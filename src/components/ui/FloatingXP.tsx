import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingXPProps {
  show: boolean;
  xp: number;
  gold: number;
  onComplete: () => void;
}

export const FloatingXP: React.FC<FloatingXPProps> = ({ show, xp, gold, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -80, scale: 1.3 }}
          exit={{ opacity: 0, y: -120 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={onComplete}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center gap-1"
        >
          <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]">
            +{xp} XP
          </span>
          <span className="text-xl font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
            +{gold} GOLD
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};