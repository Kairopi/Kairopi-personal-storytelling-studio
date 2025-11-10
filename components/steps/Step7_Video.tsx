import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../../types';
import Button from '../common/Button';
import GlassmorphismPanel from '../common/GlassmorphismPanel';
import { GoogleGenAI } from '@google/genai';

interface Step7VideoProps {
  cardData: CardData;
  prevStep: () => void;
  reset: () => void;
}

const LoadingIcon: React.FC<{className?: string}> = ({className}) => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full ${className}`}
    />
);

const loadingMessages = [
    "Contacting the muse...",
    "Storyboarding your scene...",
    "Gathering stardust...",
    "Rendering the magic...",
    "Polishing the final cut...",
    "Almost there..."
];

const Step7Video: React.FC<Step7VideoProps> = ({ cardData, prevStep, reset }) => {
    const [prompt, setPrompt] = useState("A beautiful rose gold envelope on a wooden table, surrounded by soft morning light. It opens with a burst of shimmering confetti to reveal the card inside.");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        };
        checkKey();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
    };

    const buildDetailedPrompt = (): string => {
        let cardDescription = 'The video ends by revealing a greeting card. The card looks like this:';

        // Background
        if (cardData.backgroundPrompt) {
            cardDescription += ` The background is artistic and minimalist, in a style of "${cardData.backgroundPrompt}".`;
        } else if (cardData.background) {
            cardDescription += ` The background is a solid color: ${cardData.background}.`;
        }

        // Paper Texture
        if (cardData.paperTexture !== 'matte') {
            cardDescription += ` The card has a physical texture of ${cardData.paperTexture}.`;
        }

        // Message
        const fontStyle = cardData.ink.value.replace('font-', '');
        cardDescription += ` The main message says "${cardData.message}", written in an elegant ${fontStyle} font.`;
        if (cardData.messageFoil !== 'none') {
            cardDescription += ` The text has a shimmering ${cardData.messageFoil} foil effect.`
        }

        // Stickers
        if (cardData.elements.length > 0) {
            cardDescription += " It's decorated with stickers: ";
            const stickerDescriptions = cardData.elements.map(el => {
                let stickerDesc = `a sticker of a "${el.prompt}"`;
                if (el.foil && el.foil !== 'none') {
                    stickerDesc += ` with a shiny ${el.foil} foil accent`;
                }
                return stickerDesc;
            });
            cardDescription += stickerDescriptions.join(', ') + '.';
        }

        return `${prompt}. ${cardDescription} The video should be about 8 seconds long, cinematic, and beautiful.`;
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const detailedPrompt = buildDetailedPrompt();

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: detailedPrompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: cardData.canvas.aspectRatio === '1:1' ? '1:1' : cardData.canvas.aspectRatio === '3:4' ? '9:16' : '16:9',
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            if (operation.error) {
                 throw new Error(operation.error.message || 'An unknown error occurred during video generation.');
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                 const blob = await response.blob();
                 setVideoUrl(URL.createObjectURL(blob));
            } else {
                throw new Error('Video generation finished, but no download link was provided.');
            }

        } catch (e: any) {
            console.error(e);
            if (e.message.includes("Requested entity was not found")) {
                setError("Your API Key is invalid. Please select a valid key and try again.");
                setHasApiKey(false);
            } else {
                setError(`An error occurred: ${e.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <LoadingIcon className="mx-auto w-12 h-12 border-4"/>
                    <p className="mt-4 font-medium text-lg text-charcoal-ink/80">{loadingMessage}</p>
                    <p className="text-sm text-charcoal-ink/60 mt-1">This can take a few minutes. Please stay on this page.</p>
                </div>
            )
        }
        if (videoUrl) {
            return (
                <div className="w-full">
                    <h3 className="font-serif text-3xl text-center mb-4">Your Magic Reveal is Ready!</h3>
                    <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-card aspect-video"></video>
                    <div className="mt-6 flex justify-center space-x-4">
                        <a href={videoUrl} download="kairo-pi-reveal.mp4">
                            <Button variant="primary">Download Video</Button>
                        </a>
                    </div>
                </div>
            )
        }
        if (!hasApiKey) {
            return (
                <div className="text-center max-w-md mx-auto">
                    <h3 className="font-medium text-lg">API Key Required for Video</h3>
                    <p className="text-sm text-charcoal-ink/60 mt-2">
                        This feature uses the Veo model, which requires a Project API key with the Gemini API enabled. Please select your key to continue.
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-kairo-gold-dark underline ml-1">Learn about billing</a>
                    </p>
                    {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                    <div className="mt-6">
                        <Button onClick={handleSelectKey}>Select API Key</Button>
                    </div>
                </div>
            )
        }

        return (
            <>
                <h2 className="font-serif text-4xl text-center">Create a Magic Reveal</h2>
                <p className="text-center mt-2 text-charcoal-ink/60">
                    Describe how you want your card to be revealed in an 8-second video.
                </p>

                <div className="mt-6">
                    <label className="text-sm font-medium text-charcoal-ink/80">Scene Description</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="w-full mt-2 p-3 bg-white/80 text-charcoal-ink rounded-lg border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold"
                    />
                </div>
                {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                <div className="mt-8 flex justify-center">
                    <Button onClick={handleGenerate} variant="primary" disabled={isLoading}>
                        Generate Video
                    </Button>
                </div>
            </>
        )
    };

    return (
        <motion.div
            key="step7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl"
        >
            <GlassmorphismPanel className="min-h-[400px] flex flex-col items-center justify-center">
                {renderContent()}
            </GlassmorphismPanel>
             <div className="mt-8 flex justify-between">
                <Button onClick={prevStep} variant="secondary" disabled={isLoading}>Back</Button>
                <Button onClick={reset} variant="secondary" disabled={isLoading}>Create Another</Button>
            </div>
        </motion.div>
    );
};

export default Step7Video;
