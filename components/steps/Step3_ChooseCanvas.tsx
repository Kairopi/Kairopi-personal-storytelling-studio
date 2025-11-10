import React from 'react';
import { motion } from 'framer-motion';
import { CardData, CanvasSize } from '../../types';
import Button from '../common/Button';
import GlassmorphismPanel from '../common/GlassmorphismPanel';

interface Step3ChooseCanvasProps {
  cardData: CardData;
  updateCardData: (data: Partial<CardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const canvasOptions: CanvasSize[] = [
    { name: 'The Classic', aspectRatio: '3:4', displayClass: 'aspect-[5/7] w-40' },
    { name: 'The Storyteller', aspectRatio: '1:1', displayClass: 'aspect-square w-48' },
    { name: 'The Postcard', aspectRatio: '4:3', displayClass: 'aspect-[6/4] w-56' },
];

const CanvasOption: React.FC<{ option: CanvasSize, isSelected: boolean, onSelect: () => void }> = ({ option, isSelected, onSelect }) => {
    return (
        <div className="flex flex-col items-center space-y-4">
            <motion.div
                whileHover={{ scale: 1.05, y: -10, rotateX: 10, rotateY: -15 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={onSelect}
                className={`cursor-pointer bg-white/80 rounded-lg shadow-card transition-all duration-300 border-4 ${isSelected ? 'border-kairo-gold' : 'border-transparent'}`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className={`${option.displayClass} flex items-center justify-center`}>
                    <div className="w-3/4 h-3/4 bg-charcoal-ink/5 rounded-sm"></div>
                </div>
            </motion.div>
            <h3 className="font-medium">{option.name}</h3>
        </div>
    )
}

const Step3ChooseCanvas: React.FC<Step3ChooseCanvasProps> = ({ cardData, updateCardData, nextStep, prevStep }) => {

  const handleSelectCanvas = (canvas: CanvasSize) => {
    updateCardData({ canvas });
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl"
    >
      <GlassmorphismPanel>
        <h2 className="font-serif text-4xl text-center">Select Your Canvas</h2>
        <p className="text-center mt-2 text-charcoal-ink/60">
          Every story needs a stage. Choose the format that fits yours.
        </p>
        
        <div className="mt-12 flex justify-around items-end" style={{ perspective: '1000px' }}>
            {canvasOptions.map(option => (
                <CanvasOption 
                    key={option.name}
                    option={option}
                    isSelected={cardData.canvas.name === option.name}
                    onSelect={() => handleSelectCanvas(option)}
                />
            ))}
        </div>

        <div className="mt-12 flex justify-between">
          <Button onClick={prevStep} variant="secondary">Back</Button>
          <Button onClick={nextStep} variant="primary">Next: Scene</Button>
        </div>
      </GlassmorphismPanel>
    </motion.div>
  );
};

export default Step3ChooseCanvas;