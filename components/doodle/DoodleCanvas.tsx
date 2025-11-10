import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';

interface DoodleCanvasProps {
  onFinish: (imageDataUrl: string) => void;
  onCancel: () => void;
}

type Path = {
    points: { x: number; y: number }[];
    color: string;
    strokeWidth: number;
};

const penColors = ['#2C3539', '#FFFFFF', '#D4AF37', '#e57373', '#64b5f6', '#81c784'];
const strokeWidths = [2, 5, 10];

const DoodleCanvas: React.FC<DoodleCanvasProps> = ({ onFinish, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [paths, setPaths] = useState<Path[]>([]);
    const [color, setColor] = useState('#2C3539');
    const [strokeWidth, setStrokeWidth] = useState(5);

    const getCanvasContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

    const redrawCanvas = useCallback(() => {
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        paths.forEach(path => {
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            if (path.points.length > 0) {
                 ctx.moveTo(path.points[0].x, path.points[0].y);
                for (let i = 1; i < path.points.length; i++) {
                    ctx.lineTo(path.points[i].x, path.points[i].y);
                }
                ctx.stroke();
            }
        });
    }, [paths, getCanvasContext]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawCanvas();
    }, [redrawCanvas]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        setPaths([...paths, { points: [{ x: offsetX, y: offsetY }], color, strokeWidth }]);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const newPaths = [...paths];
        newPaths[newPaths.length - 1].points.push({ x: offsetX, y: offsetY });
        setPaths(newPaths);
        redrawCanvas();
    };
    
    const handlePointerUp = () => setIsDrawing(false);
    const handleUndo = () => setPaths(paths.slice(0, -1));
    const handleClear = () => setPaths([]);
    
    const handleFinish = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        if (paths.length === 0 || paths.every(p => p.points.length === 0)) {
            onCancel(); // Nothing to save
            return;
        }

        paths.forEach(p => p.points.forEach(pt => {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
        }));

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        tempCanvas.width = width;
        tempCanvas.height = height;

        const originalPaths = paths;
        const shiftedPaths = originalPaths.map(path => ({
            ...path,
            points: path.points.map(pt => ({ x: pt.x - minX + padding, y: pt.y - minY + padding }))
        }));
        
        // Temporarily set paths to shifted paths to use redraw
        setPaths(shiftedPaths);
        const oldCanvasRef = canvasRef.current;
        (canvasRef as any).current = tempCanvas; // Trick redraw to use temp canvas
        redrawCanvas();
        (canvasRef as any).current = oldCanvasRef;
        setPaths(originalPaths); // Restore original paths

        onFinish(tempCanvas.toDataURL('image/png'));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-5 bg-white/60 backdrop-blur-xl border border-white/20 rounded-full shadow-subtle p-2 flex items-center space-x-2"
            >
                {penColors.map(c => (
                     <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border border-charcoal-ink/10 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-kairo-gold ring-offset-2' : ''}`} />
                ))}
                <div className="w-px h-6 bg-charcoal-ink/10"></div>
                {strokeWidths.map(w => (
                     <button key={w} onClick={() => setStrokeWidth(w)} className={`w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform hover:scale-110 ${strokeWidth === w ? 'ring-2 ring-kairo-gold ring-offset-2' : ''}`}>
                         <div className="bg-charcoal-ink rounded-full" style={{ width: w + 2, height: w + 2 }}></div>
                     </button>
                ))}
                <div className="w-px h-6 bg-charcoal-ink/10"></div>
                <button onClick={handleUndo} className="p-2 rounded-full hover:bg-white/50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg></button>
                <button onClick={handleClear} className="p-2 rounded-full hover:bg-white/50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </motion.div>
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-5 flex space-x-4"
            >
                <Button onClick={onCancel} variant="secondary">Cancel</Button>
                <Button onClick={handleFinish} variant="primary">Finish Drawing</Button>
            </motion.div>
        </motion.div>
    );
};

export default DoodleCanvas;
