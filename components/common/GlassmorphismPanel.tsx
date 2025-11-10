
import React from 'react';
import { motion } from 'framer-motion';

interface GlassmorphismPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassmorphismPanel: React.FC<GlassmorphismPanelProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className={`bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-subtle p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphismPanel;
