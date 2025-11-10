import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandwritingData, Stroke, HandwritingCharacter } from '../../types';
import Button from '../common/Button';

const CHARS_TO_CAPTURE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!'.split('');
const CANVAS_SIZE = 300;

interface HandwritingCaptureModalProps {
  onSave: (data: HandwritingData) => void;
  onClose: () => void;
}

const HandwritingCaptureModal: React.FC<HandwritingCaptureModalProps> = ({ onSave, onClose }) => {
  const [charIndex, setCharIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [capturedData, setCapturedData] = useState<HandwritingData>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
    }
  }, []);

  const redrawStrokes = useCallback((strokesToDraw: Stroke[]) => {
    clearCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#2C3539';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    strokesToDraw.forEach(stroke => {
      if (stroke.length < 1) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      }
      ctx.stroke();
    });
  }, [clearCanvas]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startDrawing = (e: PointerEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const { offsetX, offsetY } = e;
      setStrokes(prev => [...prev, [[offsetX, offsetY]]]);
    };
    
    const draw = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { offsetX, offsetY } = e;
      setStrokes(prev => {
          const newStrokes = [...prev];
          newStrokes[newStrokes.length - 1].push([offsetX, offsetY]);
          return newStrokes;
      });
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);

    return () => {
      canvas.removeEventListener('pointerdown', startDrawing);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', stopDrawing);
      canvas.removeEventListener('pointerleave', stopDrawing);
    };
  }, []);

  useEffect(() => {
    redrawStrokes(strokes);
  }, [strokes, redrawStrokes]);

  const goToNextChar = () => {
    if (strokes.length > 0) {
      // Normalize and save character
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      strokes.flat().forEach(([x,y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });

      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);

      const normalizedStrokes = strokes.map(stroke => 
        stroke.map(([x,y]) => [x - minX, y - minY])
      );

      const newChar: HandwritingCharacter = { strokes: normalizedStrokes, width, height };

      setCapturedData(prev => ({ ...prev, [CHARS_TO_CAPTURE[charIndex]]: newChar }));
    } else {
       // Save empty character so it can be skipped
       setCapturedData(prev => ({ ...prev, [CHARS_TO_CAPTURE[charIndex]]: { strokes: [], width: 20, height: 20 } }));
    }
    
    setStrokes([]);
    clearCanvas();
    if (charIndex < CHARS_TO_CAPTURE.length - 1) {
      setCharIndex(charIndex + 1);
    } else {
      handleSave(); // Auto-save at the end
    }
  };

  const handleClear = () => {
    setStrokes([]);
    clearCanvas();
  };
  
  const handleSave = () => {
    // Save current character before finishing if it has been drawn
    let finalData = capturedData;
    if (strokes.length > 0) {
       let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.flat().forEach(([x,y]) => {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        });
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const normalizedStrokes = strokes.map(stroke => stroke.map(([x,y]) => [x - minX, y - minY]));
        const newChar: HandwritingCharacter = { strokes: normalizedStrokes, width, height };
        finalData = { ...capturedData, [CHARS_TO_CAPTURE[charIndex]]: newChar };
    }
    onSave(finalData);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-ethereal-cream rounded-2xl shadow-card p-8 w-full max-w-md"
      >
        <div className="text-center">
            <h2 className="font-serif text-3xl">Capture Your Hand</h2>
            <p className="text-charcoal-ink/60 mt-1">Draw the character below. You can skip any you don't need.</p>
            <div className="my-4 text-sm font-medium">{charIndex + 1} / {CHARS_TO_CAPTURE.length}</div>
        </div>
        <div className="relative w-[300px] h-[300px] mx-auto bg-white rounded-lg shadow-inner border border-charcoal-ink/10 flex items-center justify-center">
          <span className="absolute text-9xl font-serif text-charcoal-ink/5 select-none">
            {CHARS_TO_CAPTURE[charIndex]}
          </span>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="relative z-10 cursor-crosshair touch-none"></canvas>
        </div>
        <div className="flex justify-center space-x-4 mt-6">
            <Button variant="secondary" onClick={handleClear}>Clear</Button>
            <Button variant="primary" onClick={goToNextChar}>
              {charIndex === CHARS_TO_CAPTURE.length - 1 ? 'Finish' : 'Next'}
            </Button>
        </div>
        <div className="mt-6 flex justify-between items-center">
            <button onClick={onClose} className="text-sm text-charcoal-ink/50 hover:text-kairo-gold">Cancel</button>
            <Button variant="secondary" onClick={handleSave}>Save & Finish</Button>
        </div>
      </motion.div>
    </div>
  )
};

export default HandwritingCaptureModal;
