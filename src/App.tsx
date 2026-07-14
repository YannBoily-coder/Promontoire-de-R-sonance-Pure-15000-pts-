/**
 * Main Application Component - Promontoire de Résonance Alpine
 */

import { useState, useEffect, useCallback } from 'react';
import { AcousticCanvas } from './components/AcousticCanvas';
import { ControlDeck } from './components/ControlDeck';
import { PresetSelector } from './components/PresetSelector';
import { audioService } from './audio';
import { AudioSettings, Preset } from './types';
import { Mountain, Volume2, VolumeX, Radio, Compass, Snowflake, Sun } from 'lucide-react';

export default function App() {
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('secret-valley');
  
  // Initialize to Secret Valley by default
  const [settings, setSettings] = useState<AudioSettings>({
    altitude: 45,
    valleyWidth: 55,
    rockDensity: 55,
    windVelocity: 35,
    harmonyMode: 'pentatonic',
    backgroundWind: true,
    backgroundBells: true,
    backgroundStream: true
  });

  // Activate / Resume audio context
  const handleActivateAudio = async () => {
    try {
      await audioService.resume();
      setIsAudioActive(true);
      
      // Update parameters immediately on start
      audioService.updateParameters(
        settings.altitude,
        settings.valleyWidth,
        settings.rockDensity,
        settings.windVelocity,
        settings.harmonyMode
      );
      audioService.toggleBackgroundWind(settings.backgroundWind);
      audioService.toggleBackgroundBells(settings.backgroundBells);
      audioService.toggleBackgroundStream(settings.backgroundStream);
    } catch (e) {
      console.error('Permission denied or audio failed to start', e);
    }
  };

  const handleDeactivateAudio = () => {
    audioService.suspend();
    setIsAudioActive(false);
  };

  // Sync settings with Web Audio service on changes
  useEffect(() => {
    if (isAudioActive) {
      audioService.updateParameters(
        settings.altitude,
        settings.valleyWidth,
        settings.rockDensity,
        settings.windVelocity,
        settings.harmonyMode
      );
    }
  }, [
    settings.altitude,
    settings.valleyWidth,
    settings.rockDensity,
    settings.windVelocity,
    settings.harmonyMode,
    isAudioActive
  ]);

  useEffect(() => {
    if (isAudioActive) {
      audioService.toggleBackgroundWind(settings.backgroundWind);
    }
  }, [settings.backgroundWind, isAudioActive]);

  useEffect(() => {
    if (isAudioActive) {
      audioService.toggleBackgroundBells(settings.backgroundBells);
    }
  }, [settings.backgroundBells, isAudioActive]);

  useEffect(() => {
    if (isAudioActive) {
      audioService.toggleBackgroundStream(settings.backgroundStream);
    }
  }, [settings.backgroundStream, isAudioActive]);

  // Handle setting updates from sliders/toggles
  const handleChangeSetting = useCallback((key: keyof AudioSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
    // Break preset lock if user manually overrides a setting
    setActivePresetId(null);
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset: Preset) => {
    setSettings(preset.settings);
    setActivePresetId(preset.id);
  };

  // Performance triggers
  const handleTriggerManualBell = () => {
    if (!isAudioActive) return;
    // Play a randomized pasture/church bell
    const randomPan = Math.random() * 1.6 - 0.8;
    const randomPitch = 0.5 + Math.random() * 1.0;
    audioService.playCowbellSynth(randomPitch, randomPan, 0.45);
  };

  const handleTriggerManualHorn = () => {
    if (!isAudioActive) return;
    // Deep majestic drone at C3 (130.81 Hz)
    audioService.playAlphornDrone(130.81, 4.0, 0.5);
  };

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-alpine-950 text-alpine-100 flex flex-col selection:bg-alpine-400 selection:text-alpine-950">
      
      {/* 1. Elegant Header */}
      <header className="px-6 py-5 border-b border-white/5 bg-alpine-900/45 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="p-2.5 rounded-xl bg-alpine-300/10 text-alpine-300 border border-alpine-300/20">
              <Compass size={22} className="animate-spin-slow" />
            </span>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                Promontoire de Résonance Alpine
              </h1>
              <p className="text-xs text-white/50 tracking-wide font-medium">
                Belvédère de synthèse acoustique et d'ondes d'écho transalpines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick status bar */}
            <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-[10px] font-mono tracking-wider text-alpine-300">
              <span className="flex items-center gap-1">
                <Snowflake size={11} className="text-sky-300" /> ALTITUDE: {settings.altitude}m
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="flex items-center gap-1">
                <Sun size={11} className="text-rose-300" /> HARMONIE: {settings.harmonyMode.toUpperCase()}
              </span>
            </div>

            {/* Mute/Unmute switch */}
            {isAudioActive ? (
              <button
                id="btn-suspend-audio"
                onClick={handleDeactivateAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium tracking-wide transition-all duration-300 text-xs"
                title="Désactiver le son"
              >
                <VolumeX size={14} />
                <span>SILENCE</span>
              </button>
            ) : (
              <button
                id="btn-activate-audio-header"
                onClick={handleActivateAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-alpine-300 hover:bg-white text-alpine-950 font-medium tracking-wide shadow-lg hover:shadow-white/5 transition-all duration-300 text-xs"
                title="Démarrer le moteur Web Audio"
              >
                <Volume2 size={14} />
                <span>ÉCOUTER</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main content structure */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Visual Skyline Canvas */}
        <AcousticCanvas
          isAudioActive={isAudioActive}
          onActivateAudio={handleActivateAudio}
          altitude={settings.altitude}
          rockDensity={settings.rockDensity}
          harmonyMode={settings.harmonyMode}
        />

        {/* Ambient landscape soundscapes / Presets */}
        <PresetSelector
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          isAudioActive={isAudioActive}
        />

        {/* Interactive sound controllers / Deck */}
        <ControlDeck
          settings={settings}
          onChangeSetting={handleChangeSetting}
          isAudioActive={isAudioActive}
          onTriggerManualBell={handleTriggerManualBell}
          onTriggerManualHorn={handleTriggerManualHorn}
        />

      </main>

      {/* 3. Footer and architectural summary */}
      <footer className="mt-12 py-6 px-6 border-t border-white/5 text-center bg-slate-950 text-white/30 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] tracking-widest uppercase">
          <span>ALPS ACOUSTIC MODEL • CH-1800</span>
          <span>DESSINÉ SUR LES CONSTATS ACOUSTIQUES DES CINQ CIMES</span>
          <span>© 2026 PROMONTOIRE DE RÉSONANCE</span>
        </div>
      </footer>

    </div>
  );
}
