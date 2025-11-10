import type * as React from 'react';

export enum Step {
  Intro = 0,
  ChooseInk = 1,
  ChooseCanvas = 2,
  SetScene = 3,
  Editor = 4,
  Preview = 5,
  Video = 6,
}

export enum ElementType {
  Text = 'text',
  Image = 'image',
}

export type Stroke = [number, number][]; // A series of [x, y] points

export interface HandwritingCharacter {
  strokes: Stroke[];
  width: number;
  height: number;
}

export interface HandwritingData {
  [key: string]: HandwritingCharacter;
}

export interface CardElement {
  id: string;
  type: ElementType;
  content: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style?: React.CSSProperties;
  foil?: string; // 'gold', 'silver', 'rose-gold'
  prompt?: string;
}

export type CanvasSize = {
    name: 'The Classic' | 'The Storyteller' | 'The Postcard';
    aspectRatio: '3:4' | '1:1' | '4:3';
    displayClass: string;
};

export interface CardData {
  ink: {
    type: 'font' | 'handwriting';
    value: string; // Font family class name or a reference to handwriting model
  };
  canvas: CanvasSize;
  background: string; // data URL for AI image, or color string for blank
  backgroundPrompt?: string;
  textColor: string;
  fontSize: number;
  message: string;
  elements: CardElement[];
  handwritingData?: HandwritingData;
  paperTexture: string; // 'matte', 'linen', 'watercolor', 'recycled'
  messageFoil: string; // 'none', 'gold', 'silver', 'rose-gold'
  enableTilt: boolean;
}

export const initialCardData: CardData = {
    ink: { type: 'font', value: 'font-sans' },
    canvas: { name: 'The Classic', aspectRatio: '3:4', displayClass: 'aspect-[5/7]' },
    background: '#FDFBF6',
    backgroundPrompt: '',
    textColor: '#2C3539',
    fontSize: 24,
    message: 'Your story starts here...',
    elements: [],
    handwritingData: undefined,
    paperTexture: 'matte',
    messageFoil: 'none',
    enableTilt: true,
};