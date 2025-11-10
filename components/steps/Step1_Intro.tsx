
import React from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';

interface Step1IntroProps {
  nextStep: () => void;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
    },
  },
};

const orbColors = ['#E6E6FA', '#FFF0F5', '#FDFBF6', '#D4AF37'];
const orbs = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 120 + 40; // size between 40 and 160
    return {
        id: i,
        size,
        style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 40 + 80}%`, // Start from below the viewport
            backgroundColor: orbColors[i % orbColors.length],
        },
        duration: Math.random() * 20 + 15, // 15 to 35 seconds
        delay: Math.random() * 7,
    };
});

const Step1Intro: React.FC<Step1IntroProps> = ({ nextStep }) => {
  const title = "Your Creative Partner for Life's Moments";

  return (
    <motion.div
      key="step1"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative text-center flex flex-col items-center w-full h-full justify-center"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {orbs.map(orb => (
          <motion.div
            key={orb.id}
            className="absolute rounded-full blur-3xl"
            style={orb.style}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: '-400%',
              opacity: [0, 0.1, 0.2, 0.1, 0],
              scale: [1, 1.2, 1],
              x: [`${Math.random() * 40 - 20}%`, `${Math.random() * 40 - 20}%`], // Gentle side to side drift
            }}
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <motion.h2
        variants={containerVariants}
        className="font-serif text-5xl md:text-7xl font-medium max-w-3xl leading-tight text-charcoal-ink flex flex-wrap justify-center"
      >
        {title.split(' ').map((word, index) => (
          <motion.span
            key={index}
            variants={wordVariants}
            className="inline-block mr-4 mt-2" // using margin for spacing
          >
            {word}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 1.2 }}
        className="mt-6 max-w-xl text-lg text-charcoal-ink/70"
      >
        KairoPi merges your emotion with the magic of AI to create beautiful, personal keepsakes. Let's craft something unforgettable together.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 1.4 }}
        className="mt-12"
      >
        <Button onClick={nextStep} variant="primary">
          Start Creating
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Step1Intro;
