/**
 * Types and Interfaces for Promontoire de Résonance Alpine
 */

export interface Mountain {
  id: string;
  name: string;
  xPercent: number; // 0 to 100 representing horizontal position on canvas
  yPercent: number; // 0 to 100 representing vertical height (lower values = higher peak)
  frequency: number; // base resonance frequency in Hz
  harmonics: number[]; // relative multiplier frequencies
  color: string; // hex or tailwind color name
  type: 'chime' | 'alphorn' | 'noise-wind' | 'crystal-bell' | 'pure-sine';
  description: string;
}

export type HarmonyMode = 'pentatonic' | 'quartz' | 'drone' | 'solfeggio';

export interface AudioSettings {
  altitude: number; // 0 (low valley) to 100 (high peaks)
  valleyWidth: number; // 0 (narrow gorge) to 100 (wide glacier valley)
  rockDensity: number; // 0 (soft meadows/snow) to 100 (hard granite peaks)
  windVelocity: number; // 0 (calm breeze) to 100 (summit tempest)
  harmonyMode: HarmonyMode;
  backgroundWind: boolean;
  backgroundBells: boolean;
  backgroundStream: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  settings: AudioSettings;
  iconName: string; // Lucide icon reference
}

export interface WaveRipple {
  id: string;
  startX: number;
  startY: number;
  currentRadius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  color: string;
  strength: number;
}

export interface EchoImpact {
  id: string;
  mountainId: string;
  x: number;
  y: number;
  time: number;
  intensity: number;
}
