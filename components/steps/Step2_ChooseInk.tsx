import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardData, HandwritingData } from '../../types';
import Button from '../common/Button';
import GlassmorphismPanel from '../common/GlassmorphismPanel';
import HandwritingCaptureModal from '../handwriting/HandwritingCaptureModal';

interface Step2ChooseInkProps {
  cardData: CardData;
  updateCardData: (data: Partial<CardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const fonts = [
    { name: 'Sunday Morning Coffee', value: 'font-serif', description: 'Cozy, classic, and elegant.' },
    { name: 'Neon Nights', value: 'font-sans', description: 'Modern, clean, and bold.' },
    { name: 'Love Letter', value: 'font-script', description: 'Romantic, personal, and flowing.' },
]

const Step2ChooseInk: React.FC<Step2ChooseInkProps> = ({ cardData, updateCardData, nextStep, prevStep }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleSelectFont = (fontClass: string) => {
      updateCardData({ ink: { type: 'font', value: fontClass }});
  };

  const handleSaveHandwriting = (data: HandwritingData) => {
    updateCardData({
      handwritingData: data,
      ink: { type: 'handwriting', value: 'living-ink' }
    });
    setIsCapturing(false);
  };
  
  const isLivingInkSelected = cardData.ink.type === 'handwriting';

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl"
    >
      <GlassmorphismPanel>
        <h2 className="font-serif text-4xl text-center">Choose Your Ink</h2>
        <p className="text-center mt-2 text-charcoal-ink/60">
          How do you want your words to feel? Select a curated style.
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {fonts.map(font => (
                <motion.div
                    key={font.value}
                    whileHover={{ y: -5 }}
                    onClick={() => handleSelectFont(font.value)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-colors duration-300 ${cardData.ink.value === font.value ? 'border-kairo-gold bg-kairo-gold/10' : 'border-charcoal-ink/10 bg-white/50 hover:border-kairo-gold/50'}`}
                >
                    <p className={`text-3xl ${font.value}`}>Ag</p>
                    <h3 className="font-medium mt-4">{font.name}</h3>
                    <p className="text-xs text-charcoal-ink/60 mt-1">{font.description}</p>
                </motion.div>
            ))}
        </div>

        <motion.div 
            whileHover={{ y: isCapturing ? 0 : -5 }}
            onClick={() => setIsCapturing(true)}
            className={`mt-8 p-6 rounded-xl border-2 cursor-pointer text-center transition-colors duration-300 ${isLivingInkSelected ? 'border-kairo-gold bg-kairo-gold/10' : 'border-charcoal-ink/10 bg-white/50 hover:border-kairo-gold/50'}`}
        >
            <h3 className="font-medium">Capture My Hand</h3>
            <p className="text-sm text-charcoal-ink/60 mt-1">Create your own font by writing a few letters. A truly personal touch.</p>
        </motion.div>
        
        {isCapturing && <HandwritingCaptureModal onSave={handleSaveHandwriting} onClose={() => setIsCapturing(false)} />}


        <div className="mt-8 flex justify-between">
          <Button onClick={prevStep} variant="secondary">Back</Button>
          <Button onClick={nextStep} variant="primary">Next: Canvas</Button>
        </div>
      </GlassmorphismPanel>
    </motion.div>
  );
};

export default Step2ChooseInk;