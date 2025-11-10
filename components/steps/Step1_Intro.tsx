
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';

interface Step1IntroProps {
  nextStep: () => void;
}

interface CardOfTheDayData {
    quote: string;
    imageUrl: string;
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

const CardOfTheDay: React.FC<{ cardData: CardOfTheDayData }> = ({ cardData }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 1.8 }}
        className="absolute bottom-6 right-6 w-64 bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-card p-4 flex flex-col items-center text-center"
    >
        <p className="text-xs font-medium text-kairo-gold tracking-widest uppercase">Inspiration</p>
        <div 
            className="w-full h-32 rounded-lg mt-2 bg-cover bg-center" 
            style={{ backgroundImage: `url(${cardData.imageUrl})` }}
        />
        <p className="font-serif text-sm mt-3 text-charcoal-ink/80">"{cardData.quote}"</p>
    </motion.div>
);


const Step1Intro: React.FC<Step1IntroProps> = ({ nextStep }) => {
  const title = "Your Creative Partner for Life's Moments";
  const [cardOfTheDay, setCardOfTheDay] = useState<CardOfTheDayData | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
        try {
            const response = await fetch('/api/card-of-the-day');
            if (response.ok && response.status !== 204) {
                const data = await response.json();
                setCardOfTheDay(data);
            }
        } catch (error) {
            console.error("Could not fetch card of the day:", error);
        }
    };
    fetchCard();
  }, []);

  return (
    <motion.div
      key="step1"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative text-center flex flex-col items-center w-full h-full justify-center"
    >
      <motion.h2
        variants={containerVariants}
        className="font-serif text-5xl md:text-7xl font-medium max-w-3xl leading-tight text-charcoal-ink flex flex-wrap justify-center"
      >
        {title.split(' ').map((word, index) => (
          <motion.span
            key={index}
            variants={wordVariants}
            className="inline-block mr-4 mt-2"
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

      {cardOfTheDay && <CardOfTheDay cardData={cardOfTheDay} />}
    </motion.div>
  );
};

export default Step1Intro;