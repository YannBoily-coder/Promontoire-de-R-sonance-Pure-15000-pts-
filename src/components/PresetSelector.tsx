/**
 * Preset Selector for Promontoire de Résonance Alpine
 */

import React from 'react';
import { PRESETS } from '../data';
import { Preset } from '../types';
import { CloudFog, Wind, Sunset, Compass, Sparkles } from 'lucide-react';

interface PresetSelectorProps {
  activePresetId: string | null;
  onSelectPreset: (preset: Preset) => void;
  isAudioActive: boolean;
}

// Icon mapper for presets
const getPresetIcon = (iconName: string, size = 18, className = '') => {
  switch (iconName) {
    case 'CloudFog':
      return <CloudFog size={size} className={className} />;
    case 'Wind':
      return <Wind size={size} className={className} />;
    case 'Sunset':
      return <Sunset size={size} className={className} />;
    case 'Compass':
    default:
      return <Compass size={size} className={className} />;
  }
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  activePresetId,
  onSelectPreset,
  isAudioActive,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 px-1">
        <Sparkles size={14} className="text-alpine-300" />
        <h3 className="font-display font-medium text-white/90 text-sm tracking-wide">Paysages Sonores</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`group p-4 rounded-xl text-left border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-alpine-800 border-alpine-300/40 text-white shadow-lg shadow-alpine-900/40'
                  : 'bg-slate-900/30 border-white/5 text-white/60 hover:bg-slate-900/50 hover:border-white/10 hover:text-white'
              }`}
            >
              {/* Active neon highlight bar */}
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-rose-300" />
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-alpine-300/10 text-alpine-300' : 'bg-slate-800/50 text-white/40 group-hover:text-white/70'
                  }`}>
                    {getPresetIcon(preset.iconName, 16)}
                  </span>
                  
                  {isActive && (
                    <span className="text-[9px] font-mono font-bold tracking-widest text-alpine-300 uppercase px-1.5 py-0.5 rounded-full bg-alpine-300/5 border border-alpine-300/10">
                      ACTIF
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className={`font-display font-medium text-sm transition-colors ${
                    isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                  }`}>
                    {preset.name}
                  </h4>
                  <p className="text-[11px] leading-relaxed opacity-70">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Little stats summary at the bottom */}
              <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
                <span>VENT: {preset.settings.windVelocity}km/h</span>
                <span>ALT: {preset.settings.altitude}m</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
