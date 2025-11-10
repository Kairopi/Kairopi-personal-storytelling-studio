import React from 'react';
import { HandwritingData } from '../../types';

interface LivingInkRendererProps {
  text: string;
  handwritingData: HandwritingData;
  className?: string;
}

const pointsToPath = (points: [number, number][]): string => {
  if (!points || points.length === 0) return '';
  
  // Using a simplified Catmull-Rom to smooth the line
  let d = `M ${points[0][0]} ${points[0][1]}`;
  if (points.length === 1) {
    // Draw a tiny dot for single-point strokes
    return d + ` l 0.1 0.1`;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
};


const LivingInkRenderer: React.FC<LivingInkRendererProps> = ({ text, handwritingData, className }) => {
  return (
    <div className={className}>
      {text.split(/(\n)/).map((line, lineIndex) => (
        <div key={lineIndex} className="flex flex-wrap items-center" style={{ minHeight: '1.5em' }}>
          {line === '\n' ? <div className="w-full" /> : line.split('').map((char, charIndex) => {
            const charData = handwritingData[char];
            
            if (char === ' ') {
                return <span key={charIndex} style={{display: 'inline-block', width: '0.5em'}}></span>;
            }

            if (charData && charData.strokes.length > 0) {
              const transform = `rotate(${Math.random() * 2 - 1}deg) scale(${1 + (Math.random() * 0.04 - 0.02)})`;
              const aspectRatio = charData.width / charData.height;
              
              return (
                <span key={charIndex} style={{ display: 'inline-block', transform }} title={char}>
                  <svg
                    width={`${aspectRatio * 1.2}em`}
                    height="1.2em"
                    viewBox={`-1 -1 ${charData.width + 2} ${charData.height + 2}`} // Add padding to viewbox
                    style={{ overflow: 'visible', verticalAlign: 'middle' }}
                  >
                    {charData.strokes.map((stroke, i) => (
                      <path 
                        key={i} 
                        d={pointsToPath(stroke)} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" // Adjust stroke width as needed
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    ))}
                  </svg>
                </span>
              );
            }
            // Fallback for un-captured characters or empty drawings
            return <span key={charIndex} style={{fontFamily: 'serif'}}>{char}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

export default LivingInkRenderer;
