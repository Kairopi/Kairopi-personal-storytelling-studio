import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { CardData, CardElement, ElementType } from '../../types';
import Button from '../common/Button';
import { generateSticker } from '../../services/geminiService';
import LivingInkRenderer from '../handwriting/LivingInkRenderer';
import MuseSidebar from '../ai/MuseSidebar';
import DoodleCanvas from '../doodle/DoodleCanvas';
import DoodleEnhanceModal from '../doodle/DoodleEnhanceModal';

interface Step5EditorProps {
  cardData: CardData;
  updateCardData: (data: Partial<CardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LoadingIcon = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-5 h-5 border-2 border-kairo-gold border-t-transparent rounded-full"
    />
);

const useTilt = (enabled: boolean) => {
  const [style, setStyle] = useState({});
  const [sheenStyle, setSheenStyle] = useState({ opacity: 0 });

  useEffect(() => {
    if (!enabled) {
      setStyle({ 
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
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
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
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
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
    });
    setSheenStyle({ opacity: 0, transition: 'opacity 0.6s ease' });
  }, [enabled]);

  return { style, sheenStyle, onMouseMove, onMouseLeave };
};

const stickerStyles = ['watercolor', 'line art', 'cartoon', 'pixel art', 'flat icon'];
const presetTextColors = ['#2C3539', '#FFFFFF', '#D4AF37', '#004D40', '#A52A2A', '#4682B4'];
const fontSizes = [{ name: 'S', value: 18 }, { name: 'M', value: 24 }, { name: 'L', value: 36 }, { name: 'XL', value: 48 }];
const foilOptions = [
    { name: 'None', value: 'none', class: 'bg-charcoal-ink' },
    { name: 'Gold', value: 'gold', class: 'foil-base foil-gold' },
    { name: 'Silver', value: 'silver', class: 'foil-base foil-silver' },
    { name: 'Rose Gold', value: 'rose-gold', class: 'foil-base foil-rose-gold' },
];

// ToyBox component
const ToyBox: React.FC<{ 
    cardData: CardData, 
    updateCardData: (data: Partial<CardData>) => void, 
    addElement: (el: CardElement) => void, 
    onOpenMuse: () => void,
    onStartDoodle: () => void
}> = ({ cardData, updateCardData, addElement, onOpenMuse, onStartDoodle }) => {
    const [stickerPrompt, setStickerPrompt] = useState('');
    const [stickerStyle, setStickerStyle] = useState('watercolor');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerateSticker = async () => {
        if (!stickerPrompt) return;
        setIsGenerating(true);

        let backgroundContext = '';
        if (cardData.background.startsWith('data:')) {
            backgroundContext = `The sticker will be placed on an artistic background with this theme: "${cardData.backgroundPrompt || 'a beautiful scene'}".`;
        } else {
            backgroundContext = `The sticker will be placed on a solid color background with the hex code ${cardData.background}.`;
        }

        const imageUrl = await generateSticker(stickerPrompt, stickerStyle, backgroundContext);
        if (imageUrl) {
            addElement({
                id: `img-${Date.now()}`, type: ElementType.Image, content: imageUrl,
                x: 50, y: 150, width: 100, height: 100, rotation: 0, prompt: stickerPrompt
            });
        }
        setIsGenerating(false);
        setStickerPrompt('');
    };

    return (
        <div className="p-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-subtle w-full h-full flex flex-col overflow-y-auto">
            <h3 className="font-serif text-2xl">Toy Box</h3>
            
            <div className="mt-6 border-b border-charcoal-ink/10 pb-6">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-charcoal-ink/80">Your Message</h4>
                    <button onClick={onOpenMuse} className="p-1 rounded-full hover:bg-kairo-gold/20 transition-colors group" title="Get writing help with Muse">
                        <span className="text-lg group-hover:scale-125 transition-transform duration-300 ease-spring block">✨</span>
                    </button>
                </div>
                <div className="relative">
                    <textarea
                        value={cardData.message}
                        onChange={(e) => updateCardData({ message: e.target.value })}
                        rows={5}
                        className="w-full p-2 bg-white/80 text-charcoal-ink rounded-lg border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold placeholder:text-charcoal-ink/40"
                    />
                </div>
                
                 <div className="mt-4">
                    <h4 className="font-medium text-xs text-charcoal-ink/80">Ink Color</h4>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {presetTextColors.map(color => (
                            <button key={color} onClick={() => updateCardData({ textColor: color, messageFoil: 'none' })}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 border border-charcoal-ink/10 ${cardData.textColor === color && cardData.messageFoil === 'none' ? 'ring-2 ring-kairo-gold ring-offset-1' : ''}`}
                                style={{ backgroundColor: color }} aria-label={`Select text color ${color}`} />
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-medium text-xs text-charcoal-ink/80">Foil Accent</h4>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {foilOptions.slice(1).map(foil => (
                           <button key={foil.value} onClick={() => updateCardData({ messageFoil: foil.value })}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 border border-charcoal-ink/10 ${cardData.messageFoil === foil.value ? 'ring-2 ring-kairo-gold ring-offset-1' : ''} ${foil.class}`}
                                aria-label={`Select foil ${foil.name}`} />
                        ))}
                    </div>
                </div>
                
                <div className="mt-4">
                    <h4 className="font-medium text-xs text-charcoal-ink/80">Card Motion</h4>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-charcoal-ink/60">Enable 3D tilt effect</p>
                        <label htmlFor="tilt-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="tilt-toggle" 
                                className="sr-only peer" 
                                checked={cardData.enableTilt} 
                                onChange={(e) => updateCardData({ enableTilt: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-charcoal-ink/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kairo-gold"></div>
                        </label>
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-medium text-xs text-charcoal-ink/80">Font Size</h4>
                    <div className="mt-2 flex items-center space-x-2">
                        {fontSizes.map(size => (
                             <button
                                key={size.name}
                                onClick={() => updateCardData({ fontSize: size.value })}
                                className={`w-8 h-8 flex items-center justify-center text-xs rounded-full border transition-colors ${cardData.fontSize === size.value ? 'bg-kairo-gold text-white border-kairo-gold' : 'bg-white/50 border-charcoal-ink/20 text-charcoal-ink hover:border-kairo-gold'}`}
                            >
                                {size.name}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
            
            <div className="mt-6 border-b border-charcoal-ink/10 pb-6">
                <h4 className="font-medium text-sm text-charcoal-ink/80">AI Sticker</h4>
                <p className="text-xs text-charcoal-ink/50 mt-1">Describe a sticker subject.</p>
                <input
                    type="text" value={stickerPrompt} onChange={(e) => setStickerPrompt(e.target.value)}
                    placeholder="e.g., a happy little robot"
                    className="w-full mt-2 bg-white/80 rounded-full px-4 py-2 border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold"
                />
                 <div className="mt-3">
                    <p className="text-xs text-charcoal-ink/50">Choose a style:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {stickerStyles.map(style => (
                            <button
                                key={style}
                                onClick={() => setStickerStyle(style)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize ${stickerStyle === style ? 'bg-kairo-gold text-white border-kairo-gold' : 'bg-white/50 border-charcoal-ink/20 text-charcoal-ink hover:border-kairo-gold'}`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                <Button onClick={handleGenerateSticker} disabled={isGenerating} className="w-full mt-4">
                    {isGenerating ? <LoadingIcon /> : 'Generate'}
                </Button>
            </div>
             <div className="mt-6">
                <h4 className="font-medium text-sm text-charcoal-ink/80">Doodle Pen</h4>
                <p className="text-xs text-charcoal-ink/50 mt-1">Add a personal, hand-drawn touch.</p>
                <Button onClick={onStartDoodle} className="w-full mt-4" variant="secondary">
                    Start Drawing
                </Button>
            </div>
        </div>
    );
};


const ElementToolbar: React.FC<{ 
    onBringToFront: () => void; 
    onSendToBack: () => void; 
    onDelete: () => void; 
    onSetFoil: (foil: string) => void;
    currentFoil?: string;
}> = ({ onBringToFront, onSendToBack, onDelete, onSetFoil, currentFoil }) => {
    const btnClasses = "w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 transition-colors flex items-center justify-center text-charcoal-ink/80";
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-[-50px] z-50 bg-white/60 backdrop-blur-xl border border-white/20 rounded-full shadow-subtle p-2 flex items-center space-x-1"
        >
            <button onClick={onBringToFront} className={btnClasses} title="Bring to Front"><svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 17h16" /></svg></button>
            <button onClick={onSendToBack} className={btnClasses} title="Send to Back"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" /></svg></button>
            <div className="w-px h-6 bg-charcoal-ink/10 mx-1"></div>
            {foilOptions.map(foil => (
                <button key={foil.value} onClick={() => onSetFoil(foil.value)} className={`w-8 h-8 rounded-full border border-charcoal-ink/10 transition-all ${foil.class} ${currentFoil === foil.value ? 'ring-2 ring-kairo-gold ring-offset-1' : ''}`} title={`Foil: ${foil.name}`}></button>
            ))}
            <div className="w-px h-6 bg-charcoal-ink/10 mx-1"></div>
            <button onClick={onDelete} className={`${btnClasses} hover:text-red-500`} title="Delete Element"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </motion.div>
    );
};

const Step5Editor: React.FC<Step5EditorProps> = ({ cardData, updateCardData, nextStep, prevStep }) => {
    const { canvas, background, ink, message, elements, textColor, fontSize, paperTexture, messageFoil, enableTilt } = cardData;
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [isMuseOpen, setIsMuseOpen] = useState(false);
    const { style: tiltStyle, sheenStyle, onMouseMove, onMouseLeave } = useTilt(enableTilt);
    const [isDoodling, setIsDoodling] = useState(false);
    const [doodleForModal, setDoodleForModal] = useState<string | null>(null);

    const aspectClass = canvas.displayClass.split(' ').find(c => c.startsWith('aspect-')) || 'aspect-[5/7]';

    const setElements = (els: CardElement[]) => updateCardData({ elements: els });
    const addElement = (el: CardElement) => setElements([...elements, el]);
    const updateElement = (id: string, updates: Partial<CardElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const bringToFront = () => {
        if (!selectedElementId) return;
        const el = elements.find(e => e.id === selectedElementId);
        if (!el) return;
        const otherElements = elements.filter(e => e.id !== selectedElementId);
        setElements([...otherElements, el]);
    };

    const sendToBack = () => {
        if (!selectedElementId) return;
        const el = elements.find(e => e.id === selectedElementId);
        if (!el) return;
        const otherElements = elements.filter(e => e.id !== selectedElementId);
        setElements([el, ...otherElements]);
    };

    const deleteSelected = () => {
        if (!selectedElementId) return;
        setElements(elements.filter(e => e.id !== selectedElementId));
        setSelectedElementId(null);
    };

    const setFoilOnSelected = (foil: string) => {
        if (!selectedElementId) return;
        updateElement(selectedElementId, { foil: foil === 'none' ? undefined : foil });
    };

    const handleSaveDoodle = (imageData: string, prompt?: string) => {
        addElement({
            id: `doodle-${Date.now()}`,
            type: ElementType.Image,
            content: imageData,
            x: 50,
            y: 150,
            width: 150,
            height: 150,
            rotation: 0,
            prompt: prompt || 'a user-drawn doodle'
        });
        setDoodleForModal(null);
    };

    const isBackgroundUrl = background.startsWith('data:');
    const selectedElement = elements.find(el => el.id === selectedElementId);

    return (
        <motion.div
            key="step5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full max-w-screen-xl flex flex-col md:flex-row gap-8 p-4"
        >
            <div className="flex-grow flex flex-col items-center justify-center relative" style={{ perspective: '1000px' }}>
                <AnimatePresence>
                    {selectedElementId && (
                        <ElementToolbar
                            onBringToFront={bringToFront}
                            onSendToBack={sendToBack}
                            onDelete={deleteSelected}
                            onSetFoil={setFoilOnSelected}
                            currentFoil={selectedElement?.foil || 'none'}
                        />
                    )}
                </AnimatePresence>
                <motion.div 
                    className={`w-full max-w-[900px] rounded-2xl shadow-card relative overflow-hidden border border-charcoal-ink/10 ${aspectClass}`}
                    style={{ 
                        transformStyle: 'preserve-3d',
                        ...tiltStyle
                    }}
                    onClick={() => setSelectedElementId(null)}
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
                    <div className="absolute inset-0 p-8 pointer-events-none" style={{ color: messageFoil !== 'none' ? 'transparent' : textColor, fontSize: `${fontSize}px`, zIndex: 5 }}>
                        {ink.type === 'handwriting' && cardData.handwritingData ? (
                            <LivingInkRenderer text={message} handwritingData={cardData.handwritingData}
                                className={`whitespace-pre-wrap ${messageFoil !== 'none' ? `foil-base foil-text foil-${messageFoil}` : ''}`} />
                        ) : (
                            <p className={`whitespace-pre-wrap ${ink.value} ${messageFoil !== 'none' ? `foil-base foil-text foil-${messageFoil}` : ''}`}>{message}</p>
                        )}
                    </div>

                    {elements.map((el, index) => (
                        <Rnd
                            key={el.id}
                            size={{ width: el.width, height: el.height }}
                            position={{ x: el.x, y: el.y }}
                            onMouseDown={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                            onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, dir, ref, delta, pos) => {
                                updateElement(el.id, {
                                    width: parseFloat(ref.style.width), height: parseFloat(ref.style.height), ...pos,
                                });
                            }}
                            className={`flex items-center justify-center border-2 transition-colors duration-200 ${selectedElementId === el.id ? 'border-dashed border-kairo-gold' : 'border-transparent hover:border-dashed hover:border-kairo-gold/50'}`}
                            style={{ zIndex: index + 10 }}
                        >
                            {el.foil && el.foil !== 'none' ? (
                                <div className={`w-full h-full foil-base foil-${el.foil}`} style={{
                                    maskImage: `url(${el.content})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
                                    WebkitMaskImage: `url(${el.content})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
                                }} />
                            ) : (
                                <img src={el.content} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
                            )}
                        </Rnd>
                    ))}
                    <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{...sheenStyle, zIndex: 99}}></div>
                </motion.div>
            </div>

            <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
                <ToyBox 
                    addElement={addElement} 
                    cardData={cardData} 
                    updateCardData={updateCardData} 
                    onOpenMuse={() => setIsMuseOpen(true)}
                    onStartDoodle={() => setIsDoodling(true)}
                />
                 <div className="mt-8 flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <Button onClick={prevStep} variant="secondary">Back</Button>
                    <Button onClick={nextStep} variant="primary">Preview</Button>
                </div>
            </div>

            <AnimatePresence>
                 {isMuseOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMuseOpen(false)}
                            className="fixed inset-0 bg-black/30 z-30"
                        />
                        <MuseSidebar
                            initialMessage={cardData.message}
                            onUpdateMessage={(newMessage) => {
                                updateCardData({ message: newMessage });
                            }}
                            onClose={() => setIsMuseOpen(false)}
                        />
                    </>
                )}
                 {isDoodling && (
                    <DoodleCanvas
                        onCancel={() => setIsDoodling(false)}
                        onFinish={(imageData) => {
                            setIsDoodling(false);
                            setDoodleForModal(imageData);
                        }}
                    />
                )}
                {doodleForModal && (
                    <DoodleEnhanceModal
                        doodleImage={doodleForModal}
                        onClose={() => setDoodleForModal(null)}
                        onSave={handleSaveDoodle}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step5Editor;