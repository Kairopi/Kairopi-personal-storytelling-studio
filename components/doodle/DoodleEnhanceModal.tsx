import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { enhanceDoodle } from '../../services/geminiService';

interface DoodleEnhanceModalProps {
  doodleImage: string;
  onSave: (imageDataUrl: string, prompt?: string) => void;
  onClose: () => void;
}

const LoadingIcon: React.FC = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
    />
);

const DoodleEnhanceModal: React.FC<DoodleEnhanceModalProps> = ({ doodleImage, onSave, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEnhance = async () => {
        if (!prompt) {
            setError('Please describe the style you want.');
            return;
        }
        setError('');
        setIsLoading(true);
        const result = await enhanceDoodle(doodleImage, prompt);
        setIsLoading(false);
        if (result) {
            onSave(result, `enhanced doodle: ${prompt}`);
        } else {
            setError('Could not enhance doodle. Please try again.');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-ethereal-cream rounded-2xl shadow-card p-8 w-full max-w-lg relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-charcoal-ink/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h2 className="font-serif text-3xl text-center">Finalize Your Doodle</h2>
            <p className="text-charcoal-ink/60 mt-2 text-center">Your doodle is ready! Use it as is, or enhance it with a touch of AI magic.</p>
            
            <div className="mt-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-48 h-48 bg-white/50 rounded-lg flex items-center justify-center p-2 shadow-inner border border-charcoal-ink/10 flex-shrink-0">
                    <img src={doodleImage} alt="User's doodle" className="max-w-full max-h-full" />
                </div>
                <div className="flex-grow w-full">
                    <Button onClick={() => onSave(doodleImage)} variant="secondary" className="w-full">
                        Use As Is
                    </Button>
                    <div className="my-4 text-center text-xs text-charcoal-ink/50">OR</div>
                    <label htmlFor="enhance-prompt" className="text-sm font-medium">Enhance it:</label>
                    <input
                        id="enhance-prompt"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., a shimmering crystal"
                        className="w-full mt-1 bg-white/80 rounded-full px-4 py-2 border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    <Button onClick={handleEnhance} disabled={isLoading} className="w-full mt-3">
                        {isLoading ? <LoadingIcon /> : 'Enhance with AI'}
                    </Button>
                </div>
            </div>
          </motion.div>
        </div>
    );
};

export default DoodleEnhanceModal;
