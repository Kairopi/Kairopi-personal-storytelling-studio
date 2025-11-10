import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardData } from '../../types';
import Button from '../common/Button';
import GlassmorphismPanel from '../common/GlassmorphismPanel';
import { generateBackgrounds } from '../../services/geminiService';

interface Step4SetSceneProps {
  cardData: CardData;
  updateCardData: (data: Partial<CardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LoadingIcon = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
    />
);

const presetColors = ['#FDFBF6', '#E6E6FA', '#FFF0F5', '#F0F8FF', '#F5FFFA', '#FFFACD'];
const paperTextures = [
    { name: 'Smooth Matte', value: 'matte' },
    { name: 'Linen', value: 'linen' },
    { name: 'Recycled', value: 'recycled' },
    { name: 'Watercolor', value: 'watercolor' },
];


const Step4SetScene: React.FC<Step4SetSceneProps> = ({ cardData, updateCardData, nextStep, prevStep }) => {
    const [prompt, setPrompt] = useState('');
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setBackgrounds([]);
        updateCardData({ backgroundPrompt: prompt });
        const results = await generateBackgrounds(prompt, cardData.canvas.aspectRatio);
        setBackgrounds(results);
        setIsLoading(false);
    };

    const selectBackground = (bg: string) => {
        const isSolid = !bg.startsWith('data:');
        updateCardData({ background: bg, backgroundPrompt: isSolid ? '' : cardData.backgroundPrompt });
    };

    const selectTexture = (texture: string) => {
        updateCardData({ paperTexture: texture });
    };
    
    const isSolidColor = !cardData.background.startsWith('data:');

    return (
        <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
        >
            <GlassmorphismPanel>
                <h2 className="font-serif text-4xl text-center">Set the Scene</h2>
                <p className="text-center mt-2 text-charcoal-ink/60">
                    Choose a blank canvas or dream up a background with AI.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div
                        className={`p-6 rounded-xl border-2 cursor-pointer text-center transition-colors duration-300 ${isSolidColor ? 'border-kairo-gold bg-kairo-gold/10' : 'border-charcoal-ink/10 bg-white/50 hover:border-kairo-gold/50'}`}
                    >
                        <h3 className="font-medium">Solid Color</h3>
                        <p className="text-sm text-charcoal-ink/60 mt-1">Choose a simple, elegant background.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {presetColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => selectBackground(color)}
                                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 border border-charcoal-ink/10 ${cardData.background === color ? 'ring-2 ring-kairo-gold ring-offset-2' : ''}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                            <div className="relative w-8 h-8 rounded-full border border-charcoal-ink/10 overflow-hidden cursor-pointer">
                                <input
                                    type="color"
                                    value={isSolidColor ? cardData.background : '#FDFBF6'}
                                    onChange={(e) => selectBackground(e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                    aria-label="Custom color picker"
                                />
                            </div>
                        </div>
                    </div>
                     <div className="p-6 rounded-xl border border-charcoal-ink/10 bg-charcoal-ink/5">
                        <h3 className="font-medium text-center">Dream It (AI Scene Setter)</h3>
                        <div className="mt-4 flex space-x-2">
                             <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., soft blues, faint clouds"
                                className="flex-grow bg-white/80 rounded-full px-4 py-2 border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold"
                            />
                            <Button onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? <LoadingIcon /> : 'Generate'}
                            </Button>
                        </div>
                    </div>
                </div>

                {backgrounds.length > 0 && (
                    <motion.div initial={{ opacity: 0}} animate={{opacity: 1}} className="mt-6">
                        <h3 className="font-medium text-center text-charcoal-ink/80 mb-4">Pick a scene</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {backgrounds.map((bg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => selectBackground(bg)}
                                    className={`rounded-lg overflow-hidden border-4 cursor-pointer hover:border-kairo-gold transition-all duration-300 ${cardData.background === bg ? 'border-kairo-gold' : 'border-transparent'}`}
                                >
                                    <div className={`${cardData.canvas.displayClass.split(' ')[0]} bg-cover bg-center`} style={{backgroundImage: `url(${bg})`}}></div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="mt-8 border-t border-charcoal-ink/10 pt-8">
                    <h3 className="font-medium text-center">Paper Finish</h3>
                    <p className="text-sm text-charcoal-ink/60 mt-1 text-center">Give your card a tactile feel.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                        {paperTextures.map(texture => (
                            <button
                                key={texture.value}
                                onClick={() => selectTexture(texture.value)}
                                className={`px-4 py-2 rounded-full text-sm border transition-colors ${cardData.paperTexture === texture.value ? 'bg-kairo-gold text-white border-kairo-gold' : 'bg-white/50 border-charcoal-ink/20 hover:border-kairo-gold'}`}
                            >
                                {texture.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex justify-between">
                    <Button onClick={prevStep} variant="secondary">Back</Button>
                    <Button onClick={nextStep} variant="primary">Next: Create</Button>
                </div>
            </GlassmorphismPanel>
        </motion.div>
    );
};

export default Step4SetScene;