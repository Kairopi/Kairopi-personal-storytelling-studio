
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../../types';
import Button from '../common/Button';
import GlassmorphismPanel from '../common/GlassmorphismPanel';

interface Step7VideoProps {
  cardData: CardData;
  prevStep: () => void;
  reset: () => void;
}

interface JobStatus {
    status: 'queued' | 'processing' | 'complete' | 'error';
    videoUrl?: string;
    errorMessage?: string;
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
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const pollIntervalRef = useRef<number | null>(null);

    const isLoading = jobStatus?.status === 'queued' || jobStatus?.status === 'processing';
    
    // Cleanup polling on component unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Update loading message while processing
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

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;

        setJobStatus({ status: 'queued' }); // Set initial status
        
        try {
            const response = await fetch('/api/request-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardData, prompt })
            });
            if (!response.ok) throw new Error('Failed to submit video request.');

            const { jobId: newJobId } = await response.json();
            setJobId(newJobId);

            // Start polling
            pollIntervalRef.current = window.setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/video-status/${newJobId}`);
                    if (statusRes.ok) {
                        const statusData: JobStatus = await statusRes.json();
                        setJobStatus(statusData);

                        if (statusData.status === 'complete' || statusData.status === 'error') {
                            stopPolling();
                        }
                    } else if (statusRes.status === 404) {
                        // Job not found yet, might be a slight delay. Continue polling for a bit.
                    } else {
                        // If polling fails consistently, stop.
                        throw new Error('Failed to get job status.');
                    }
                } catch (pollError) {
                    console.error(pollError);
                    setJobStatus({ status: 'error', errorMessage: 'Could not retrieve video status.' });
                    stopPolling();
                }
            }, 5000); // Poll every 5 seconds

        } catch (e: any) {
            console.error(e);
            setJobStatus({ status: 'error', errorMessage: e.message });
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <LoadingIcon className="mx-auto w-12 h-12 border-4"/>
                    <p className="mt-4 font-medium text-lg text-charcoal-ink/80">{loadingMessage}</p>
                    <p className="text-sm text-charcoal-ink/60 mt-1">This can take a few minutes. You can leave and come back.</p>
                </div>
            )
        }
        if (jobStatus?.status === 'complete' && jobStatus.videoUrl) {
            return (
                <div className="w-full">
                    <h3 className="font-serif text-3xl text-center mb-4">Your Magic Reveal is Ready!</h3>
                    <video src={jobStatus.videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-card aspect-video"></video>
                    <div className="mt-6 flex justify-center space-x-4">
                        <a href={jobStatus.videoUrl} download="kairo-pi-reveal.mp4">
                            <Button variant="primary">Download Video</Button>
                        </a>
                    </div>
                </div>
            )
        }
         if (jobStatus?.status === 'error') {
             return (
                 <div className="text-center max-w-md mx-auto">
                    <h3 className="font-medium text-lg text-red-600">Video Generation Failed</h3>
                    <p className="text-sm text-charcoal-ink/60 mt-2 bg-red-100 p-3 rounded-lg">
                       {jobStatus.errorMessage || 'An unknown error occurred.'}
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => setJobStatus(null)}>Try Again</Button>
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
                <div className="mt-8 flex justify-center">
                    <Button onClick={handleGenerate} variant="primary">
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