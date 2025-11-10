

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData, ElementType, HandwritingData } from '../../types';
import Button from '../common/Button';
import LivingInkRenderer from '../handwriting/LivingInkRenderer';

interface Step6PreviewProps {
  cardData: CardData;
  reset: () => void;
  nextStep: () => void;
}

const ShareModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const [copied, setCopied] = useState(false);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const handleCopy = () => {
        if (urlInputRef.current) {
            urlInputRef.current.select();
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert("Failed to copy link. Please try again.");
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-ethereal-cream rounded-2xl shadow-card p-8 w-full max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-charcoal-ink/10 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h2 className="font-serif text-3xl text-center">Share Your Creation</h2>
            <p className="text-charcoal-ink/60 mt-2 text-center">Anyone with this link will be able to view your card.</p>
            
            <div className="mt-8 flex items-stretch overflow-hidden rounded-full border border-charcoal-ink/10 bg-white/80 shadow-inner focus-within:ring-2 focus-within:ring-kairo-gold">
                <input
                    ref={urlInputRef}
                    type="text"
                    readOnly
                    value={url}
                    className="min-w-0 flex-grow truncate bg-transparent px-5 py-3 text-sm text-charcoal-ink focus:outline-none"
                    aria-label="Shareable link"
                />
                <Button 
                    onClick={handleCopy} 
                    variant="primary" 
                    className="w-28 flex-shrink-0 rounded-l-none"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
          </motion.div>
        </div>
    );
};


const useTilt = (enabled: boolean) => {
  const [style, setStyle] = useState({});
  const [sheenStyle, setSheenStyle] = useState({ opacity: 0 });

  useEffect(() => {
    if (!enabled) {
      setStyle({ 
        transform: 'perspective(2000px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
      });
      setSheenStyle({ opacity: 0, transition: 'opacity 0.6s ease' });
    }
  }, [enabled]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const rotateX = ((y / height) - 0.5) * -20;
    const rotateY = ((x / width) - 0.5) * 20;
    
    setStyle({
      transform: `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    });

    const sheenX = (x / width) * 100;
    const sheenY = (y / height) * 100;
    setSheenStyle({
      background: `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.6), transparent 50%)`,
      opacity: 0.5
    });
  }, [enabled]);

  const onMouseLeave = useCallback(() => {
    if (!enabled) return;
    setStyle({ 
        transform: 'perspective(2000px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
    });
    setSheenStyle({ opacity: 0, transition: 'opacity 0.6s ease' });
  }, [enabled]);

  return { style, sheenStyle, onMouseMove, onMouseLeave };
};

const serializeHandwriting = (data: HandwritingData): string => {
    return Object.entries(data)
        .map(([char, charData]) => {
            if (!charData || !charData.strokes || charData.strokes.length === 0) {
                return `${char}:`;
            }
            const strokesStr = charData.strokes
                .map(stroke => stroke.map(point => point.join(',')).join(' '))
                .join('|');
            return `${char}:${charData.width},${charData.height}|${strokesStr}`;
        })
        .join(';');
};

const Step6Preview: React.FC<Step6PreviewProps> = ({ cardData, reset, nextStep }) => {
  const { message, elements, background, canvas, ink, textColor, fontSize, paperTexture, messageFoil, enableTilt } = cardData;
  const { style: tiltStyle, sheenStyle, onMouseMove, onMouseLeave } = useTilt(enableTilt);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const isBackgroundUrl = background.startsWith('data:');
  const aspectClass = canvas.displayClass.split(' ').find(c => c.startsWith('aspect-')) || 'aspect-[5/7]';
  
  const handleDownload = useCallback(() => {
    const node = cardRef.current;
    if (!node) return;

    const originalTransform = node.style.transform;
    node.style.transform = 'none'; // Reset transform for accurate capture

    try {
        // 1. Gather all accessible CSS rules from the document.
        let css = '';
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                if (sheet.cssRules) {
                    css += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                }
            } catch (e) {
                // This will fail for cross-origin stylesheets, which is expected.
                // We'll link to them directly.
                console.warn('Cannot read cross-origin stylesheet, will link to it instead:', sheet.href);
            }
        }

        // 2. Define external font links to be embedded in the SVG.
        const fontLinks = `
            <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Dancing+Script:wght@400;500;600;700&display=swap" rel="stylesheet" />
        `;
        
        // 3. Clone the node to get its current state as HTML.
        const clone = node.cloneNode(true) as HTMLElement;
        const html = clone.outerHTML;

        // 4. Construct the SVG with embedded links, styles, and content.
        // This allows the SVG to render correctly in viewers that can access the internet.
        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${node.offsetWidth}" height="${node.offsetHeight}">
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
                    ${fontLinks}
                    <style>${css}</style>
                    ${html}
                </div>
            </foreignObject>
        </svg>`;

        // 5. Create a Blob from the SVG string and trigger the download.
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kairo-pi-card.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error during card SVG download process:', error);
        alert("An unexpected error occurred while trying to download the card.");
    } finally {
        node.style.transform = originalTransform; // Restore original transform
    }
  }, []);

  const handleShare = () => {
    try {
        const dataToShare: Partial<CardData> | { handwritingData?: string } = { ...cardData };

        // Fix: Check if handwritingData is an object before serializing to fix type error.
        if (dataToShare.handwritingData && typeof dataToShare.handwritingData === 'object') {
            (dataToShare as any).handwritingData = serializeHandwriting(dataToShare.handwritingData);
        }

        const jsonString = JSON.stringify(dataToShare);
        // Robustly encode UTF-8 string to Base64 to handle unicode characters
        const uint8Array = new TextEncoder().encode(jsonString);
        const binString = Array.from(uint8Array, (byte) => String.fromCodePoint(byte)).join('');
        const encodedData = btoa(binString);
        
        const url = `${window.location.origin}${window.location.pathname}?card=${encodeURIComponent(encodedData)}`;
        setShareUrl(url);
        setIsShareModalOpen(true);
    } catch (e) {
        console.error("Failed to create share link", e);
        alert("Sorry, there was an error creating the share link.");
    }
  };


  return (
    <motion.div
      key="step6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center"
    >
      <h2 className="font-serif text-5xl mb-4">The Magic Seal.</h2>
      <p className="text-charcoal-ink/60 mb-8 max-w-lg">
        Your creation is ready to unfold. Interact with it and share this moment of wonder.
      </p>

      <div className="w-full max-w-[900px] flex items-center justify-center cursor-grab active:cursor-grabbing" style={{ perspective: '2000px' }}>
         <motion.div
            ref={cardRef}
            className={`w-full rounded-2xl shadow-2xl relative ${aspectClass}`}
            style={{ 
                transformStyle: 'preserve-3d',
                ...tiltStyle
            }}
            initial={{ rotateX: -90, scale: 0.8 }}
            animate={{ rotateX: 0, scale: 1 }}
            transition={{ type: 'spring', duration: 1.5, delay: 0.2 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
        >
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundColor: isBackgroundUrl ? 'transparent' : background,
                    backgroundImage: isBackgroundUrl ? `url(${background})` : 'none',
                }}
            />
            <div className={`texture-overlay ${paperTexture !== 'matte' ? `texture-${paperTexture}` : ''}`}></div>
            <div className="absolute inset-0 p-8 overflow-hidden">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{ color: messageFoil !== 'none' ? 'transparent' : textColor, fontSize: `${fontSize}px`, zIndex: 5 }}
                >
                    {ink.type === 'handwriting' && cardData.handwritingData ? (
                        <LivingInkRenderer
                          text={message}
                          handwritingData={cardData.handwritingData}
                          className={`whitespace-pre-wrap ${messageFoil !== 'none' ? `foil-base foil-text foil-${messageFoil}` : ''}`}
                        />
                      ) : (
                        <p className={`whitespace-pre-wrap ${ink.value} ${messageFoil !== 'none' ? `foil-base foil-text foil-${messageFoil}` : ''}`}>{message}</p>
                      )}
                </motion.div>
                 {elements.map((el, i) => (
                    <motion.div
                        key={el.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4 + i * 0.1, type: 'spring' }}
                        className="absolute"
                        style={{
                            left: `${el.x}px`, top: `${el.y}px`,
                            width: `${el.width}px`, height: `${el.height}px`,
                            transform: `rotate(${el.rotation}deg)`,
                            zIndex: 10 + i
                        }}
                    >
                        {el.foil && el.foil !== 'none' ? (
                            <div className={`w-full h-full foil-base foil-${el.foil}`} style={{
                                maskImage: `url(${el.content})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
                                WebkitMaskImage: `url(${el.content})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
                            }} />
                        ) : (
                            <img src={el.content} alt="sticker" className="w-full h-full object-contain" />
                        )}
                    </motion.div>
                ))}
            </div>
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{...sheenStyle, zIndex: 99}}></div>
        </motion.div>
      </div>


      <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
        <Button onClick={handleDownload} variant="secondary">
          Download Card
        </Button>
        <Button onClick={handleShare} variant="secondary">
          Share Card
        </Button>
        <Button onClick={nextStep} variant="primary">
          Create Video Reveal
        </Button>
        <Button onClick={reset} variant="secondary">
          Create Another
        </Button>
      </div>

      <AnimatePresence>
        {isShareModalOpen && <ShareModal url={shareUrl} onClose={() => setIsShareModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default Step6Preview;