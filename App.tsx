

import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CardData, Step, initialCardData, HandwritingData, HandwritingCharacter } from './types';

// Import new step components
import Step1Intro from './components/steps/Step1_Intro';
import Step2ChooseInk from './components/steps/Step2_ChooseInk';
import Step3ChooseCanvas from './components/steps/Step3_ChooseCanvas';
import Step4SetScene from './components/steps/Step4_SetScene';
import Step5Editor from './components/steps/Step5_Editor';
import Step6Preview from './components/steps/Step6_Preview';
import Step7Video from './components/steps/Step7_Video';
import ElegantBackground from './components/common/ElegantBackground';

const deserializeHandwriting = (serialized: string): HandwritingData => {
    const data: HandwritingData = {};
    if (!serialized) return data;

    serialized.split(';').forEach(entry => {
        const [char, content] = entry.split(/:(.*)/s);
        if (!char) return;

        if (!content) {
            data[char] = { strokes: [], width: 20, height: 20 };
            return;
        }

        const [dimsPart, ...strokesParts] = content.split('|');
        const strokesPart = strokesParts.join('|');
        
        const [width, height] = dimsPart.split(',').map(Number);
        
        const strokes = strokesPart 
            ? strokesPart.split('|').map(strokeStr => 
                strokeStr ? strokeStr.split(' ').map(pointStr => {
                    const [x, y] = pointStr.split(',').map(Number);
                    return [x, y] as [number, number];
                }) : []
            )
            : [];
            
        data[char] = { width, height, strokes };
    });
    return data;
};


const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Intro);
  const [cardData, setCardData] = useState<CardData>(initialCardData);

  const updateCardData = useCallback((data: Partial<CardData>) => {
    setCardData(prev => ({ ...prev, ...data }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardDataParam = params.get('card');

    if (cardDataParam) {
        try {
            // Robustly decode Base64 to UTF-8 string to handle unicode characters
            const binString = atob(cardDataParam);
            const uint8Array = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
            const jsonString = new TextDecoder().decode(uint8Array);

            const loadedCardData: Partial<CardData> & { handwritingData?: string | HandwritingData } = JSON.parse(jsonString);
            
            // Basic validation to ensure it's a valid card object
            if (loadedCardData && loadedCardData.canvas && typeof loadedCardData.message === 'string') {
                if (typeof loadedCardData.handwritingData === 'string') {
                    loadedCardData.handwritingData = deserializeHandwriting(loadedCardData.handwritingData);
                }
                 updateCardData(loadedCardData as CardData);
                 setStep(Step.Preview);

                 // Clean the URL to avoid confusion
                 const newUrl = `${window.location.pathname}`;
                 window.history.replaceState({}, '', newUrl);
            }
        } catch (e) {
            console.error("Failed to load card data from URL", e);
            // If there's an error, just load the app normally.
        }
    }
  }, [updateCardData]);

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, Step.Video));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, Step.Intro));
  };
  
  const reset = () => {
    setCardData(initialCardData);
    setStep(Step.Intro);
  }

  const renderStep = () => {
    const props = { cardData, updateCardData, nextStep, prevStep };
    switch (step) {
      case Step.Intro:
        return <Step1Intro nextStep={nextStep} />;
      case Step.ChooseInk:
        return <Step2ChooseInk {...props} />;
      case Step.ChooseCanvas:
        return <Step3ChooseCanvas {...props} />;
      case Step.SetScene:
        return <Step4SetScene {...props} />;
      case Step.Editor:
        return <Step5Editor {...props} />;
      case Step.Preview:
        return <Step6Preview cardData={cardData} reset={reset} nextStep={nextStep} />;
      case Step.Video:
        return <Step7Video cardData={cardData} prevStep={prevStep} reset={reset} />;
      default:
        return <Step1Intro nextStep={nextStep} />;
    }
  };
  
  const stepTitles = ["Welcome", "Ink", "Canvas", "Scene", "Create", "Preview", "Video"];

  return (
    <div className="min-h-screen text-charcoal-ink font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <ElegantBackground />
        <header className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
             <h1 className="font-serif text-3xl font-medium tracking-wide">Kairo<span className="text-kairo-gold">Pi</span></h1>
             <div className="flex items-center space-x-4">
                {stepTitles.map((title, index) => (
                    <div key={title} className="flex items-center space-x-2">
                        <div className={`w-8 h-1 rounded-full transition-colors duration-500 ${step >= index ? 'bg-kairo-gold' : 'bg-charcoal-ink/10'}`}></div>
                        <span className={`text-sm transition-opacity duration-500 ${step === index ? 'opacity-100 font-medium' : 'opacity-40'}`}>{title}</span>
                    </div>
                ))}
             </div>
        </header>
        <main className="w-full h-full flex-grow flex items-center justify-center z-10">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </main>
    </div>
  );
};

export default App;