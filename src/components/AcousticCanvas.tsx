/**
 * Interactive Acoustic Canvas for Promontoire de Résonance Alpine
 * Renders stylized alpine peaks, handles wave propagation, collisions, and real-time visual feedback.
 */

import React, { useRef, useEffect, useState } from 'react';
import { MOUNTAINS } from '../data';
import { Mountain, WaveRipple, EchoImpact } from '../types';
import { audioService } from '../audio';
import { Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';

interface AcousticCanvasProps {
  isAudioActive: boolean;
  onActivateAudio: () => void;
  altitude: number;
  rockDensity: number;
  harmonyMode: string;
}

export const AcousticCanvas: React.FC<AcousticCanvasProps> = ({
  isAudioActive,
  onActivateAudio,
  altitude,
  rockDensity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Interactive states
  const [ripples, setRipples] = useState<WaveRipple[]>([]);
  const [activeEchoes, setActiveEchoes] = useState<Record<string, { intensity: number; time: number }>>({});
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: string; text: string; x: number; y: number; opacity: number; color: string }>>([]);
  const [hoveredMountain, setHoveredMountain] = useState<Mountain | null>(null);
  const [tooltipMountain, setTooltipMountain] = useState<Mountain | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Keep latest states in refs for use in render loop without re-triggering effects
  const ripplesRef = useRef<WaveRipple[]>([]);
  const activeEchoesRef = useRef<Record<string, { intensity: number; time: number }>>({});
  const floatingTextsRef = useRef<any[]>([]);

  useEffect(() => {
    ripplesRef.current = ripples;
  }, [ripples]);

  useEffect(() => {
    activeEchoesRef.current = activeEchoes;
  }, [activeEchoes]);

  useEffect(() => {
    floatingTextsRef.current = floatingTexts;
  }, [floatingTexts]);

  // Keep track of which waves have already hit which mountains to avoid double-triggers
  const hitMatrixRef = useRef<Record<string, Set<string>>>({}); // waveId -> Set of mountainIds

  // Handle canvas sizing and main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];

    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      // Initialize stars once canvas has size
      if (stars.length === 0) {
        stars = Array.from({ length: 60 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height * 0.5), // stars only in top half
          size: 0.5 + Math.random() * 1.5,
          alpha: 0.2 + Math.random() * 0.8,
          speed: 0.005 + Math.random() * 0.015,
        }));
      }
    };

    // Initial resize
    resizeCanvas();

    // Use ResizeObserver for responsive rendering
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Canvas Draw Loop
    const draw = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Clear with alpine night gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#060913'); // very deep night
      skyGrad.addColorStop(0.5, '#0b0f19'); // dark slate
      skyGrad.addColorStop(1, '#1b2334'); // slate blue reflection
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // --- 1. Draw Twinkling Stars ---
      stars.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0.1, Math.min(star.alpha, 0.9))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 2. Draw Real-time Audio Spectrum (Background Glowing Aurora) ---
      const freqData = audioService.getByteFrequencyData();
      if (freqData && isAudioActive) {
        ctx.save();
        ctx.beginPath();
        
        // Draw responsive glow behind mountain ranges
        const points = 24;
        const segmentWidth = w / (points - 1);
        ctx.moveTo(0, h);
        
        for (let i = 0; i < points; i++) {
          // Map frequency data to heights
          const dataIndex = Math.floor((i / points) * (freqData.length * 0.6));
          const value = freqData[dataIndex] || 0;
          const auraHeight = (value / 255) * (h * 0.25);
          
          const x = i * segmentWidth;
          const y = h * 0.65 - auraHeight;
          
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * segmentWidth;
            const prevIndex = Math.floor(((i - 1) / points) * (freqData.length * 0.6));
            const prevValue = freqData[prevIndex] || 0;
            const prevY = h * 0.65 - (prevValue / 255) * (h * 0.25);
            
            // smooth control points
            ctx.bezierCurveTo((prevX + x) / 2, prevY, (prevX + x) / 2, y, x, y);
          }
        }
        
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        // Aurora gradient
        const auroraGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
        auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)'); // blue mist
        auroraGrad.addColorStop(0.5, 'rgba(167, 183, 219, 0.15)'); // quartz mist
        auroraGrad.addColorStop(1, 'rgba(11, 14, 20, 0)');
        
        ctx.fillStyle = auroraGrad;
        ctx.fill();
        ctx.restore();
      }

      // --- 3. Draw Deep Background Mountains (Low Contrast) ---
      ctx.fillStyle = 'rgba(12, 17, 30, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.55);
      ctx.lineTo(w * 0.2, h * 0.42);
      ctx.lineTo(w * 0.4, h * 0.5);
      ctx.lineTo(w * 0.6, h * 0.38);
      ctx.lineTo(w * 0.8, h * 0.46);
      ctx.lineTo(w, h * 0.34);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // --- 4. Draw Mid-ground Mountains & Interactive Peaks ---
      // We render detailed mountain peaks using gradients
      MOUNTAINS.forEach((m) => {
        const px = (m.xPercent / 100) * w;
        const py = (m.yPercent / 100) * h;

        ctx.save();
        
        // Mountain base gradient
        const mGrad = ctx.createLinearGradient(px, py, px, h);
        mGrad.addColorStop(0, '#1c2436'); // dark charcoal slate
        mGrad.addColorStop(0.6, '#111522'); // deeper dark
        mGrad.addColorStop(1, '#080b12');
        
        ctx.fillStyle = mGrad;

        // Draw the mountain triangle from peak down to bottom corners
        ctx.beginPath();
        ctx.moveTo(px, py);
        
        // Left flank (slightly jagged)
        const leftBaseX = Math.max(0, px - w * 0.22);
        ctx.lineTo(px - w * 0.08, py + (h - py) * 0.35);
        ctx.lineTo(px - w * 0.14, py + (h - py) * 0.55);
        ctx.lineTo(leftBaseX, h);
        
        // Bottom
        const rightBaseX = Math.min(w, px + w * 0.22);
        ctx.lineTo(rightBaseX, h);
        
        // Right flank (jagged)
        ctx.lineTo(px + w * 0.14, py + (h - py) * 0.6);
        ctx.lineTo(px + w * 0.07, py + (h - py) * 0.3);
        ctx.closePath();
        ctx.fill();

        // Draw Snow Cap (white tip)
        const capHeight = (h - py) * 0.14; // size of cap
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - capHeight * 0.8, py + capHeight);
        
        // Jagged bottom edge of snowcap
        ctx.lineTo(px - capHeight * 0.3, py + capHeight * 0.75);
        ctx.lineTo(px, py + capHeight * 1.1);
        ctx.lineTo(px + capHeight * 0.4, py + capHeight * 0.8);
        
        ctx.lineTo(px + capHeight * 0.8, py + capHeight);
        ctx.closePath();

        // Cap gradient
        const capGrad = ctx.createLinearGradient(px, py, px, py + capHeight);
        capGrad.addColorStop(0, '#ffffff');
        capGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = capGrad;
        ctx.fill();

        // Draw Peak Glow effect if hit recently
        const hitInfo = activeEchoesRef.current[m.id];
        if (hitInfo) {
          const elapsed = Date.now() - hitInfo.time;
          const duration = 1500; // glow duration ms
          if (elapsed < duration) {
            const glowFactor = 1 - elapsed / duration;
            const glowRadius = 15 + glowFactor * 35;
            
            // Draw radial glow
            const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, glowRadius);
            glowGrad.addColorStop(0, `rgba(255, 255, 255, ${glowFactor * 0.8})`);
            glowGrad.addColorStop(0.3, `${m.color}${Math.floor(glowFactor * 99)}`); // faded color
            glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw concentric echo rings radiating from the peak
            const ringCount = 3;
            for (let r = 0; r < ringCount; r++) {
              const ringDelay = r * 150;
              if (elapsed > ringDelay) {
                const ringAge = (elapsed - ringDelay) / (duration - ringDelay);
                if (ringAge > 0 && ringAge < 1) {
                  ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ringAge) * 0.4})`;
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.ellipse(px, py, ringAge * 40, ringAge * 15, 0, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
            }
          }
        }

        // Draw peak interactive orb marker
        const isHovered = hoveredMountain?.id === m.id;
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.08;
        const markerRadius = isHovered ? 9 : 6;

        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.shadowColor = m.color;
        
        ctx.fillStyle = isHovered ? '#ffffff' : m.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, markerRadius * (isHovered ? pulse : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow
        
        // Draw Mountain Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, px, py - 14);

        ctx.restore();
      });

      // --- 5. Draw Forescape (Front hills / Pines) ---
      // Low grass/trees ridge at bottom
      const foreGrad = ctx.createLinearGradient(0, h * 0.8, 0, h);
      foreGrad.addColorStop(0, '#0a0e16');
      foreGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = foreGrad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.85);
      
      // Gentle wavy landscape
      for (let x = 0; x <= w; x += 40) {
        const y = h * 0.85 + Math.sin(x * 0.01) * 12 + Math.cos(x * 0.005) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // --- 6. Draw Wave Ripples & Calculate Acoustic Collisions ---
      const activeRipples = ripplesRef.current;
      const updatedRipples: WaveRipple[] = [];
      let stateChanged = false;

      activeRipples.forEach((ripple) => {
        // Expand ripple radius
        const newRadius = ripple.currentRadius + ripple.speed;
        
        // Age the ripple (opacity fadeout)
        const radiusPercent = newRadius / ripple.maxRadius;
        const newOpacity = Math.max(0, 1 - radiusPercent) * ripple.opacity;

        if (radiusPercent < 1 && newOpacity > 0.01) {
          // Keep active
          const updatedRipple = {
            ...ripple,
            currentRadius: newRadius,
            opacity: newOpacity,
          };
          updatedRipples.push(updatedRipple);

          // Draw ripple outline (ellipse for perspective reflection)
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${newOpacity * 0.4})`;
          ctx.lineWidth = 2 + ripple.strength * 2 * (1 - radiusPercent);
          
          // Ethereal gradient ring
          const ringGlow = ctx.createRadialGradient(
            ripple.startX, ripple.startY, Math.max(0, newRadius - 8),
            ripple.startX, ripple.startY, newRadius + 4
          );
          ringGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
          ringGlow.addColorStop(0.5, `rgba(255, 255, 255, ${newOpacity * 0.5})`);
          ringGlow.addColorStop(0.7, `${ripple.color}${Math.floor(newOpacity * 99).toString(16).padStart(2, '0')}`);
          ringGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = ringGlow;

          ctx.beginPath();
          // Draw wave flatly to represent expansion through the valley floor
          ctx.ellipse(ripple.startX, ripple.startY, newRadius, newRadius * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Check collisions with all mountain peaks
          MOUNTAINS.forEach((m) => {
            const peakX = (m.xPercent / 100) * w;
            const peakY = (m.yPercent / 100) * h;

            // Simple distance mapping for collision detection
            // Convert coordinate distance into valley-flat distance
            // Since our ripple is drawn with 0.42 vertical compression, let's normalize y
            const dx = peakX - ripple.startX;
            const dy = (peakY - ripple.startY) / 0.42;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If the wave edge expands past the peak
            if (newRadius >= distance && (newRadius - ripple.speed) < distance) {
              // Ensure we only hit each mountain once per wave
              if (!hitMatrixRef.current[ripple.id]) {
                hitMatrixRef.current[ripple.id] = new Set<string>();
              }
              
              if (!hitMatrixRef.current[ripple.id].has(m.id)) {
                hitMatrixRef.current[ripple.id].add(m.id);
                
                // Trigger visual peak flash
                setActiveEchoes((prev) => ({
                  ...prev,
                  [m.id]: { intensity: ripple.strength, time: Date.now() },
                }));

                // Calculate strength of echo based on distance and rock density
                const distanceDamping = Math.max(0.1, 1 - (distance / w));
                const echoStrength = ripple.strength * distanceDamping * (0.3 + (rockDensity / 100) * 0.7);

                // Trigger Web Audio synthesis!
                if (isAudioActive) {
                  audioService.triggerMountainSound(m.type, m.frequency, m.xPercent, echoStrength);
                }

                // Create a floating text overlay
                const tunedNoteLabel = m.type === 'alphorn' ? 'COR DES ALPES' : m.name.toUpperCase();
                const textId = `${ripple.id}-${m.id}-${Date.now()}`;
                setFloatingTexts((prev) => [
                  ...prev,
                  {
                    id: textId,
                    text: tunedNoteLabel,
                    x: peakX,
                    y: peakY - 32,
                    opacity: 1,
                    color: m.color,
                  },
                ]);
                
                // Set timeout to remove floating text
                setTimeout(() => {
                  setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
                }, 1800);
              }
            }
          });
        } else {
          // Wave completed, clean up hit matrix registry for this wave
          delete hitMatrixRef.current[ripple.id];
          stateChanged = true;
        }
      });

      // Update ripples list if it has changed
      if (updatedRipples.length !== activeRipples.length || stateChanged) {
        setRipples(updatedRipples);
      }

      // --- 7. Draw Floating Echo Labels ---
      const activeTexts = floatingTextsRef.current;
      activeTexts.forEach((t) => {
        t.y -= 0.5; // drift up
        t.opacity -= 0.008; // fade out
        
        if (t.opacity > 0) {
          ctx.save();
          ctx.fillStyle = t.color;
          ctx.font = 'bold 9px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 4;
          ctx.shadowColor = t.color;
          ctx.fillText(`✦ ${t.text} ✦`, t.x, t.y);
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    // Start loop
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isAudioActive, rockDensity, hoveredMountain]);

  // Handle click on canvas to cast echo wave
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if clicked near a mountain peak to trigger it directly
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (!isAudioActive) {
      onActivateAudio();
      return;
    }

    // Determine if clicked directly on an interactive orb
    let clickedPeak = false;
    MOUNTAINS.forEach((m) => {
      const px = (m.xPercent / 100) * canvas.width;
      const py = (m.yPercent / 100) * canvas.height;
      const distance = Math.sqrt((clickX - px) ** 2 + (clickY - py) ** 2);
      
      if (distance < 20) {
        // Trigger peak directly with maximum strength
        clickedPeak = true;
        audioService.triggerMountainSound(m.type, m.frequency, m.xPercent, 1.0);
        
        setActiveEchoes((prev) => ({
          ...prev,
          [m.id]: { intensity: 1.0, time: Date.now() },
        }));

        // Spawn a local ripple centered on peak
        const waveId = `direct-${Date.now()}-${Math.random()}`;
        const newRipple: WaveRipple = {
          id: waveId,
          startX: px,
          startY: py,
          currentRadius: 5,
          maxRadius: canvas.width * 0.4,
          opacity: 1.0,
          speed: 2.2,
          color: m.color,
          strength: 0.9,
        };
        setRipples((prev) => [...prev, newRipple]);
      }
    });

    if (clickedPeak) return;

    // If click is on valley floor, emit an echo wave outwards!
    const waveId = `wave-${Date.now()}-${Math.random()}`;
    const newRipple: WaveRipple = {
      id: waveId,
      startX: clickX,
      startY: clickY,
      currentRadius: 2,
      maxRadius: canvas.width * 1.2, // wide coverage
      opacity: 0.95,
      speed: 3.2, // speed of sound wave expansion
      color: '#a7b7db', // quartz tint
      strength: 0.8,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Also trigger a deep ambient bass droplet sound at the starting point
    audioService.playPureBell(80 + (1 - clickY / canvas.height) * 150, (clickX / canvas.width) * 2 - 1, 0.4);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: Mountain | null = null;
    MOUNTAINS.forEach((m) => {
      const px = (m.xPercent / 100) * canvas.width;
      const py = (m.yPercent / 100) * canvas.height;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance < 24) {
        found = m;
      }
    });

    setHoveredMountain(found);
  };

  const handlePeakIconClick = (m: Mountain) => {
    if (!isAudioActive) {
      onActivateAudio();
      return;
    }
    setTooltipMountain(m);
  };

  return (
    <div id="promontory-stage" className="relative w-full h-[55vh] md:h-[60vh] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950 select-none">
      
      {/* Real-time Rendering Canvas */}
      <canvas
        id="acoustic-skyline"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />

      {/* Guide / Instructions Overlay */}
      {showGuide && (
        <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-xs p-4 rounded-xl glass-panel text-white/90 text-xs shadow-lg space-y-2 z-20 pointer-events-auto transition-opacity duration-300">
          <div className="flex justify-between items-center pb-1 border-b border-white/10">
            <span className="font-display font-medium text-alpine-300 text-sm tracking-wide">Échos du Belvédère</span>
            <button 
              onClick={() => setShowGuide(false)} 
              className="text-white/40 hover:text-white/80 transition-colors px-1"
              title="Fermer le guide"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-white/70">
            Cliquez n'importe où dans la <strong>vallée</strong> pour projeter une onde acoustique. Elle rebondira sur les cimes et déclenchera leurs échos uniques.
          </p>
          <p className="text-[11px] leading-relaxed text-white/70">
            Vous pouvez également survoler et cliquer directement sur un <strong>sommet orbitaire</strong> pour le faire vibrer de sa propre note pure.
          </p>
        </div>
      )}

      {/* Quick Audio Activation Button Overlay */}
      {!isAudioActive && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-30 pointer-events-auto">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-alpine-400/20 text-alpine-300 flex items-center justify-center animate-pulse mx-auto border border-alpine-400/30">
              <VolumeX size={32} />
            </div>
            <h3 className="font-display text-xl font-medium tracking-wide text-white">Activer la Résonance Alpine</h3>
            <p className="text-sm text-alpine-200/70 max-w-sm mx-auto leading-relaxed">
              Le sanctuaire audio nécessite une permission d'interaction pour initialiser le synthétiseur acoustique Web Audio.
            </p>
            <button
              id="btn-activate-audio"
              onClick={onActivateAudio}
              className="px-6 py-2.5 rounded-lg bg-alpine-300 hover:bg-white text-alpine-950 font-medium tracking-wide shadow-lg hover:shadow-white/10 transition-all duration-300 text-sm"
            >
              Démarrer l'Acoustique
            </button>
          </div>
        </div>
      )}

      {/* Peak Info / Tooltip overlay */}
      {hoveredMountain && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl glass-panel border-white/15 text-center max-w-sm pointer-events-none transition-all animate-fade-in z-10"
        >
          <h4 className="font-display font-medium text-white text-xs tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles size={11} className="text-alpine-300 animate-pulse" />
            {hoveredMountain.name}
          </h4>
          <p className="text-[10px] text-white/60 font-mono mt-0.5 tracking-wide">
            {hoveredMountain.type === 'alphorn' ? 'Cor des Alpes (Drone)' : hoveredMountain.type === 'noise-wind' ? 'Vent Glaciaire' : hoveredMountain.type === 'chime' ? 'Cloche d\'Airain' : hoveredMountain.type === 'crystal-bell' ? 'Carillon Quartz' : 'Flûte de Sine'}
            {' • '}
            {hoveredMountain.frequency} Hz
          </p>
          <p className="text-[10px] text-white/50 mt-1 italic leading-tight">
            "{hoveredMountain.description}"
          </p>
        </div>
      )}

      {/* Tiny Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 text-[10px] font-mono tracking-wider text-alpine-300 border border-white/5 z-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        VAL-ECHO SYSTEM ACTIVE
      </div>

    </div>
  );
};
