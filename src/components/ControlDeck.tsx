/**
 * Control Deck Component for Promontoire de Résonance Alpine
 * Handles parameters, toggles for ambient layers, and harmony presets.
 */

import React from 'react';
import { HarmonyMode, AudioSettings } from '../types';
import { Sliders, Wind, Waves, BellRing, Compass, Music, Shield, Info } from 'lucide-react';

interface ControlDeckProps {
  settings: AudioSettings;
  onChangeSetting: (key: keyof AudioSettings, value: any) => void;
  isAudioActive: boolean;
  onTriggerManualBell: () => void;
  onTriggerManualHorn: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  settings,
  onChangeSetting,
  isAudioActive,
  onTriggerManualBell,
  onTriggerManualHorn,
}) => {
  
  const handleSliderChange = (key: keyof AudioSettings, value: number) => {
    onChangeSetting(key, value);
  };

  const handleToggleChange = (key: keyof AudioSettings, checked: boolean) => {
    onChangeSetting(key, checked);
  };

  const harmonyModes: Array<{ id: HarmonyMode; name: string; desc: string; freq: string }> = [
    { id: 'pentatonic', name: 'Majeur Pentatonique', desc: 'Harmonies traditionnelles et chaleureuses des alpes.', freq: 'Diatonique' },
    { id: 'quartz', name: 'Carillon de Quartz', desc: 'Sons cristallins et célestes à haute résonance.', freq: 'Troisième Majeure' },
    { id: 'drone', name: 'Bourdon des Abîmes', desc: 'Drones profonds et quintes mystiques d\'alphorn.', freq: 'Quinte Juste' },
    { id: 'solfeggio', name: 'Alignement Sacré', desc: 'Frequences spirituelles de Solfeggio (432Hz / 528Hz).', freq: 'Guérison' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Acoustic Sliders Panel */}
      <div id="deck-parameters" className="lg:col-span-2 p-6 rounded-2xl glass-panel space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <Sliders className="text-alpine-300 w-5 h-5" />
          <h3 className="font-display font-medium text-white tracking-wide text-base">Régulateur Acoustique</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Altitude Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white/70 flex items-center gap-1.5">
                <Compass size={13} className="text-alpine-400" />
                ALTITUDE (DENSITÉ)
              </span>
              <span className="text-alpine-300 font-bold">{settings.altitude}m</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.altitude}
              onChange={(e) => handleSliderChange('altitude', parseInt(e.target.value))}
              disabled={!isAudioActive}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-alpine-300 disabled:opacity-45 transition-opacity"
            />
            <p className="text-[10px] text-white/40 leading-normal">
              Ajuste le filtre global. Plus l'altitude est élevée, plus le son est cristallin et aigu.
            </p>
          </div>

          {/* Valley Width Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white/70 flex items-center gap-1.5">
                <Compass size={13} className="text-alpine-400" />
                LARGEUR DE LA VALLÉE
              </span>
              <span className="text-alpine-300 font-bold">{settings.valleyWidth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.valleyWidth}
              onChange={(e) => handleSliderChange('valleyWidth', parseInt(e.target.value))}
              disabled={!isAudioActive}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-alpine-300 disabled:opacity-45 transition-opacity"
            />
            <p className="text-[10px] text-white/40 leading-normal">
              Ajuste le délai d'écho. Plus la vallée est large, plus le temps de retour de l'écho est long.
            </p>
          </div>

          {/* Rock Density Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white/70 flex items-center gap-1.5">
                <Shield size={13} className="text-alpine-400" />
                DENSITÉ DE LA ROCHE
              </span>
              <span className="text-alpine-300 font-bold">{settings.rockDensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.rockDensity}
              onChange={(e) => handleSliderChange('rockDensity', parseInt(e.target.value))}
              disabled={!isAudioActive}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-alpine-300 disabled:opacity-45 transition-opacity"
            />
            <p className="text-[10px] text-white/40 leading-normal">
              Ajuste le retour (feedback) de l'écho. Plus la roche est dense, plus la réverbération dure longtemps.
            </p>
          </div>

          {/* Wind Velocity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white/70 flex items-center gap-1.5">
                <Wind size={13} className="text-alpine-400" />
                VÉLOCITÉ DU VENT
              </span>
              <span className="text-alpine-300 font-bold">{settings.windVelocity} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.windVelocity}
              onChange={(e) => handleSliderChange('windVelocity', parseInt(e.target.value))}
              disabled={!isAudioActive}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-alpine-300 disabled:opacity-45 transition-opacity"
            />
            <p className="text-[10px] text-white/40 leading-normal">
              Ajuste le sifflement de la brise et module l'amplitude des échos en mouvement.
            </p>
          </div>
        </div>

        {/* Ambient Generators Switches */}
        <div id="deck-ambiences" className="pt-4 border-t border-white/5">
          <h4 className="text-xs font-mono text-white/60 mb-3 tracking-wider">AMBiances DE FOND CONTINUES</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Wind generator switch */}
            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${settings.backgroundWind ? 'bg-alpine-300/10 border-alpine-300/30 text-white' : 'bg-slate-900/30 border-white/5 text-white/50 hover:bg-slate-900/50'}`}>
              <div className="flex items-center gap-2">
                <Wind className={`w-4 h-4 ${settings.backgroundWind ? 'text-alpine-300 animate-pulse' : ''}`} />
                <div className="text-left">
                  <span className="block text-xs font-display font-medium">Brise des Cimes</span>
                  <span className="block text-[9px] opacity-60">Vent d'altitude</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.backgroundWind}
                onChange={(e) => handleToggleChange('backgroundWind', e.target.checked)}
                disabled={!isAudioActive}
                className="sr-only"
              />
              <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${settings.backgroundWind ? 'bg-alpine-300' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 bg-slate-950 rounded-full transition-transform ${settings.backgroundWind ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Stream generator switch */}
            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${settings.backgroundStream ? 'bg-alpine-300/10 border-alpine-300/30 text-white' : 'bg-slate-900/30 border-white/5 text-white/50 hover:bg-slate-900/50'}`}>
              <div className="flex items-center gap-2">
                <Waves className={`w-4 h-4 ${settings.backgroundStream ? 'text-alpine-300 animate-pulse' : ''}`} />
                <div className="text-left">
                  <span className="block text-xs font-display font-medium">Torrent de l'Écluse</span>
                  <span className="block text-[9px] opacity-60">Eau ruisselante</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.backgroundStream}
                onChange={(e) => handleToggleChange('backgroundStream', e.target.checked)}
                disabled={!isAudioActive}
                className="sr-only"
              />
              <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${settings.backgroundStream ? 'bg-alpine-300' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 bg-slate-950 rounded-full transition-transform ${settings.backgroundStream ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Cowbells generator switch */}
            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${settings.backgroundBells ? 'bg-alpine-300/10 border-alpine-300/30 text-white' : 'bg-slate-900/30 border-white/5 text-white/50 hover:bg-slate-900/50'}`}>
              <div className="flex items-center gap-2">
                <BellRing className={`w-4 h-4 ${settings.backgroundBells ? 'text-alpine-300 animate-pulse' : ''}`} />
                <div className="text-left">
                  <span className="block text-xs font-display font-medium">Troupeau de l'Alpage</span>
                  <span className="block text-[9px] opacity-60">Cloches lointaines</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.backgroundBells}
                onChange={(e) => handleToggleChange('backgroundBells', e.target.checked)}
                disabled={!isAudioActive}
                className="sr-only"
              />
              <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${settings.backgroundBells ? 'bg-alpine-300' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 bg-slate-950 rounded-full transition-transform ${settings.backgroundBells ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </label>

          </div>
        </div>

      </div>

      {/* 2. Harmony Selection Panel & Live Actions */}
      <div id="deck-harmony" className="p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Music className="text-alpine-300 w-5 h-5" />
            <h3 className="font-display font-medium text-white tracking-wide text-base">Tempérament de l'Écho</h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {harmonyModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onChangeSetting('harmonyMode', mode.id)}
                disabled={!isAudioActive}
                className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all ${settings.harmonyMode === mode.id ? 'bg-alpine-300/10 border-alpine-400/30 text-white' : 'bg-slate-900/30 border-white/5 text-white/60 hover:bg-slate-900/50 hover:text-white disabled:opacity-45'}`}
              >
                <div className="space-y-0.5 pr-2">
                  <span className="block text-xs font-display font-medium">{mode.name}</span>
                  <span className="block text-[9px] opacity-75 leading-tight">{mode.desc}</span>
                </div>
                <span className="text-[8px] font-mono border border-white/10 px-1.5 py-0.5 rounded-md text-alpine-300 whitespace-nowrap">
                  {mode.freq}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Performance Actions */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
            <span>PERFORMANCE MANUELLE</span>
            <Info size={11} title="Jouez des sons traditionnels à volonté" className="cursor-help" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onTriggerManualBell}
              disabled={!isAudioActive}
              className="px-3 py-2 rounded-xl border border-white/5 hover:border-alpine-400/30 hover:bg-alpine-300/5 text-white/80 hover:text-white transition-all text-xs font-display flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              🔔 Cloche d'Airain
            </button>
            <button
              onClick={onTriggerManualHorn}
              disabled={!isAudioActive}
              className="px-3 py-2 rounded-xl border border-white/5 hover:border-alpine-400/30 hover:bg-alpine-300/5 text-white/80 hover:text-white transition-all text-xs font-display flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              📯 Cor d'Alpes
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
