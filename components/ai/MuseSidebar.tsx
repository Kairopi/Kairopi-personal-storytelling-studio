import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { getMuseBrainstormSuggestions, polishMessage } from '../../services/geminiService';

interface MuseSidebarProps {
  initialMessage: string;
  onUpdateMessage: (newMessage: string) => void;
  onClose: () => void;
}

const LoadingIcon: React.FC = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-5 h-5 border-2 border-kairo-gold border-t-transparent rounded-full"
    />
);

const MuseSidebar: React.FC<MuseSidebarProps> = ({ initialMessage, onUpdateMessage, onClose }) => {
    const [activeTab, setActiveTab] = useState<'brainstorm' | 'polish'>('brainstorm');
    
    // Brainstorm state
    const [recipient, setRecipient] = useState('');
    const [memory, setMemory] = useState('');
    const [vibe, setVibe] = useState('Heartfelt ❤️');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isBrainstorming, setIsBrainstorming] = useState(false);

    // Polish state
    const [polishText, setPolishText] = useState(initialMessage);
    const [isPolishing, setIsPolishing] = useState(false);
    
    useEffect(() => {
        setPolishText(initialMessage);
    }, [initialMessage]);

    const vibes = ['Heartfelt ❤️', 'Funny 😂', 'Nostalgic 🕰️', 'Poetic 🖋️'];

    const handleBrainstorm = async () => {
        if (!recipient || !memory) return;
        setIsBrainstorming(true);
        setIdeas([]);
        const results = await getMuseBrainstormSuggestions(recipient, memory, vibe);
        setIdeas(results);
        setIsBrainstorming(false);
    };

    const handlePolish = async (type: 'grammar' | 'warmer' | 'funnier') => {
        setIsPolishing(true);
        const result = await polishMessage(polishText, type);
        setPolishText(result);
        setIsPolishing(false);
    };
    
    const selectIdea = (idea: string) => {
        onUpdateMessage(idea);
        setPolishText(idea);
        setActiveTab('polish');
    };

    const TabButton: React.FC<{ name: 'brainstorm' | 'polish'; children: React.ReactNode }> = ({ name, children }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${activeTab === name ? 'text-charcoal-ink' : 'text-charcoal-ink/50 hover:text-charcoal-ink'}`}
        >
            {children}
            {activeTab === name && <motion.div layoutId="muse-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-kairo-gold" />}
        </button>
    );

    const inputClasses = "w-full mt-1 bg-white/80 rounded-lg px-3 py-2 border border-charcoal-ink/10 focus:outline-none focus:ring-2 focus:ring-kairo-gold text-sm";
    const labelClasses = "text-xs font-medium text-charcoal-ink/70";

    return (
        <motion.div
            key="muse-sidebar"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 right-0 h-full w-96 bg-white/60 backdrop-blur-xl border-l border-white/20 shadow-card flex flex-col p-6 z-40"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-2xl">Muse ✨</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal-ink/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex border-b border-charcoal-ink/10 mb-4">
                <TabButton name="brainstorm">Brainstorm</TabButton>
                <TabButton name="polish">Polish</TabButton>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'brainstorm' && (
                        <motion.div key="brainstorm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                             <div>
                                <label className={labelClasses}>Recipient (e.g., My Mom, Best Friend)</label>
                                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className={inputClasses} />
                             </div>
                             <div>
                                <label className={labelClasses}>A Core Memory or Story</label>
                                <textarea value={memory} onChange={e => setMemory(e.target.value)} rows={4} className={inputClasses} placeholder="That time we got lost in Tokyo..."></textarea>
                             </div>
                             <div>
                                <label className={labelClasses}>The Vibe</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                     {vibes.map(v => (
                                        <button key={v} onClick={() => setVibe(v)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${vibe === v ? 'bg-kairo-gold text-white border-kairo-gold' : 'bg-white/50 border-charcoal-ink/20 text-charcoal-ink hover:border-kairo-gold'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <Button onClick={handleBrainstorm} disabled={isBrainstorming} className="w-full">
                                {isBrainstorming ? <LoadingIcon /> : "Generate Ideas"}
                             </Button>
                             {ideas.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-charcoal-ink/10">
                                    {ideas.map((idea, i) => (
                                        <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}} className="p-3 bg-white/50 rounded-lg text-sm">
                                            <p>{idea}</p>
                                            <button onClick={() => selectIdea(idea)} className="text-xs font-bold text-kairo-gold-dark hover:underline mt-2">Use this message →</button>
                                        </motion.div>
                                    ))}
                                </div>
                             )}
                        </motion.div>
                    )}
                     {activeTab === 'polish' && (
                        <motion.div key="polish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 h-full flex flex-col">
                            <textarea value={polishText} onChange={e => setPolishText(e.target.value)} rows={10} className={`${inputClasses} flex-grow`}></textarea>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <button onClick={() => handlePolish('grammar')} disabled={isPolishing} className="p-2 border border-charcoal-ink/10 rounded-lg hover:bg-charcoal-ink/5">Fix Spelling & Grammar</button>
                                <button onClick={() => handlePolish('warmer')} disabled={isPolishing} className="p-2 border border-charcoal-ink/10 rounded-lg hover:bg-charcoal-ink/5">Make it Warmer</button>
                                <button onClick={() => handlePolish('funnier')} disabled={isPolishing} className="p-2 border border-charcoal-ink/10 rounded-lg hover:bg-charcoal-ink/5 col-span-2">Make it Funnier</button>
                            </div>
                            <Button onClick={() => onUpdateMessage(polishText)} disabled={isPolishing} className="w-full">
                               {isPolishing ? <LoadingIcon /> : "Apply Changes"}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default MuseSidebar;