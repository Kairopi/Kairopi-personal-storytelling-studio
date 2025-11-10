import React from 'react';
import { motion } from 'framer-motion';

const shapes = [
  // Shape 1: Large, slow, top-left
  {
    id: 1,
    bg: 'bg-soft-lavender',
    initial: { x: '-10%', y: '-10%', scale: 1.2, opacity: 0 },
    animate: { x: '20%', y: '15%', scale: 1, opacity: 0.15 },
    transition: { duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
    size: 'w-[40vw] h-[40vw]',
  },
  // Shape 2: Medium, bottom-right
  {
    id: 2,
    bg: 'bg-blush-pink',
    initial: { x: '90%', y: '80%', scale: 1, opacity: 0 },
    animate: { x: '70%', y: '60%', scale: 1.3, opacity: 0.15 },
    transition: { duration: 30, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 5 },
    size: 'w-[35vw] h-[35vw]',
  },
  // Shape 3: Small, travels across
  {
    id: 3,
    bg: 'bg-kairo-gold',
    initial: { x: '-20%', y: '60%', scale: 1, opacity: 0 },
    animate: { x: '110%', y: '40%', scale: 1.1, opacity: 0.08 },
    transition: { duration: 45, repeat: Infinity, repeatType: 'loop', ease: 'linear', delay: 10 },
    size: 'w-[20vw] h-[20vw]',
  },
];

const ElegantBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ethereal-cream">
      {/* The base gradient with pulse */}
      <div className="absolute inset-0 bg-gradient-to-tr from-soft-lavender/20 via-ethereal-cream to-blush-pink/20 animate-[pulse_20s_ease-in-out_infinite]" />
      
      {/* The animated shapes */}
      {shapes.map(shape => (
        <motion.div
          key={shape.id}
          className={`absolute rounded-full blur-3xl mix-blend-multiply ${shape.bg} ${shape.size}`}
          initial={shape.initial}
          animate={shape.animate}
          transition={shape.transition}
        />
      ))}
    </div>
  );
};

export default ElegantBackground;
