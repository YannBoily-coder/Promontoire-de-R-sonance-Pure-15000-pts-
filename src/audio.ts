/**
 * Web Audio Engine for Promontoire de Résonance Alpine
 */

import { HarmonyMode } from './types';

export class AlpineAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master nodes
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private echoDelayNode: DelayNode | null = null;
  private echoFeedbackGain: GainNode | null = null;
  private echoFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Background audio generators
  private windNoiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windLfoGain: GainNode | null = null;

  private streamGain: GainNode | null = null;
  private streamNoiseNode: ScriptProcessorNode | null = null;
  private streamFilter: BiquadFilterNode | null = null;
  private streamLfo: OscillatorNode | null = null;

  private bellTimer: any = null;

  // Current parameter values
  private altitude = 50;
  private valleyWidth = 50;
  private rockDensity = 50;
  private windVelocity = 30;
  private harmonyMode: HarmonyMode = 'pentatonic';
  
  private backgroundWindActive = false;
  private backgroundBellsActive = false;
  private backgroundStreamActive = false;

  constructor() {
    // Audio Context is initialized on user interaction
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      this.ctx = new AudioCtx();
      
      // 1. Create Master Output Chain
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-1, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(4, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.limiter.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      
      // Create Analyser Node for visual feedback
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.limiter);

      // 2. Setup Mountain Echo Delay Line
      this.echoDelayNode = this.ctx.createDelay(5.0);
      this.echoFeedbackGain = this.ctx.createGain();
      this.echoFilter = this.ctx.createBiquadFilter();

      // Configure Delay Line
      // Delay Time linked to valleyWidth
      const delayTime = this.calculateDelayTime(this.valleyWidth);
      this.echoDelayNode.delayTime.setValueAtTime(delayTime, this.ctx.currentTime);

      // Feedback linked to rockDensity
      const feedback = this.calculateFeedback(this.rockDensity);
      this.echoFeedbackGain.gain.setValueAtTime(feedback, this.ctx.currentTime);

      // Filter linked to altitude (thinner reflections at higher altitude)
      this.echoFilter.type = 'bandpass';
      this.updateEchoFilterSettings();

      // Connect delay loop: Input -> Delay -> Filter -> Feedback -> Delay (and out to master)
      this.echoDelayNode.connect(this.echoFilter);
      this.echoFilter.connect(this.echoFeedbackGain);
      this.echoFeedbackGain.connect(this.echoDelayNode);
      this.echoFeedbackGain.connect(this.masterGain);

      // 3. Setup Wind Generator (filtered noise)
      this.setupWindSynth();

      // 4. Setup Stream Synth
      this.setupStreamSynth();

      // 5. Start distant bells scheduler
      this.startPastureBellsScheduler();

      this.isInitialized = true;
      console.log('Alpine Resonance audio engine fully initialized');
    } catch (error) {
      console.error('Failed to initialize Alpine Audio Engine:', error);
      throw error;
    }
  }

  public getContextState(): string {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  public async resume(): Promise<void> {
    if (!this.ctx) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  // --- Parameter Updaters ---

  public updateParameters(
    altitude: number,
    valleyWidth: number,
    rockDensity: number,
    windVelocity: number,
    harmonyMode: HarmonyMode
  ) {
    this.altitude = altitude;
    this.valleyWidth = valleyWidth;
    this.rockDensity = rockDensity;
    this.windVelocity = windVelocity;
    this.harmonyMode = harmonyMode;

    if (!this.isInitialized || !this.ctx) return;

    // Update Echo Delay Time
    if (this.echoDelayNode) {
      const targetDelay = this.calculateDelayTime(valleyWidth);
      // Ramp smoothly to avoid clicks
      this.echoDelayNode.delayTime.setTargetAtTime(targetDelay, this.ctx.currentTime, 0.5);
    }

    // Update Echo Feedback
    if (this.echoFeedbackGain) {
      const targetFeedback = this.calculateFeedback(rockDensity);
      this.echoFeedbackGain.gain.setTargetAtTime(targetFeedback, this.ctx.currentTime, 0.2);
    }

    // Update Echo Filtering
    this.updateEchoFilterSettings();

    // Update Wind Synthesizer parameters
    this.updateWindParams();

    // Update Stream Synth parameters
    this.updateStreamParams();
  }

  public toggleBackgroundWind(active: boolean) {
    this.backgroundWindActive = active;
    if (!this.isInitialized || !this.ctx) return;
    
    const targetGain = active ? this.calculateWindGain() : 0.0;
    this.windGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 1.0);
  }

  public toggleBackgroundBells(active: boolean) {
    this.backgroundBellsActive = active;
  }

  public toggleBackgroundStream(active: boolean) {
    this.backgroundStreamActive = active;
    if (!this.isInitialized || !this.ctx) return;

    const targetGain = active ? this.calculateStreamGain() : 0.0;
    this.streamGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 1.5);
  }

  // --- Synthesis Setup helpers ---

  private calculateDelayTime(valWidth: number): number {
    // From 0.15s (narrow gorge) to 1.8s (wide alpine valley)
    return 0.15 + (valWidth / 100) * 1.65;
  }

  private calculateFeedback(density: number): number {
    // From 0.1 (snow damp) to 0.78 (hard vertical granite wall)
    return 0.1 + (density / 100) * 0.68;
  }

  private updateEchoFilterSettings() {
    if (!this.ctx || !this.echoFilter) return;

    // Higher altitude = less dense rock reflection, thinner sound
    // Let's use a bandpass filter that gets narrower and higher frequency with higher altitude
    const centerFreq = 300 + (this.altitude / 100) * 1200; // 300Hz to 1500Hz
    const Q = 0.5 + (this.altitude / 100) * 1.5; // 0.5 (wide, warm) to 2.0 (narrow, sharp ringing)

    this.echoFilter.frequency.setTargetAtTime(centerFreq, this.ctx.currentTime, 0.5);
    this.echoFilter.Q.setTargetAtTime(Q, this.ctx.currentTime, 0.5);
  }

  private setupWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Create a 2-second buffer of White Noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create Noise Source Node (looping)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Create Wind Filter
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Create Wind Gain
    this.windGain = this.ctx.createGain();
    const initGain = this.backgroundWindActive ? this.calculateWindGain() : 0.0;
    this.windGain.gain.setValueAtTime(initGain, this.ctx.currentTime);

    // Create LFO to simulate swirling wind gusts
    this.windLfo = this.ctx.createOscillator();
    this.windLfo.type = 'sine';
    this.windLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow wave (12 seconds)

    this.windLfoGain = this.ctx.createGain();
    this.windLfoGain.gain.setValueAtTime(120, this.ctx.currentTime); // modulation depth in Hz

    // Connections for Wind
    // LFO -> LFOGain -> filter frequency
    this.windLfo.connect(this.windLfoGain);
    this.windLfoGain.connect(this.windFilter.frequency);

    // Noise -> Filter -> Gain -> Master
    noiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    // Start wind sources
    noiseSource.start(0);
    this.windLfo.start(0);
  }

  private calculateWindGain(): number {
    // Maps 0-100 windVelocity to a pleasant ambient gain
    return (this.windVelocity / 100) * 0.12;
  }

  private updateWindParams() {
    if (!this.ctx || !this.windFilter || !this.windGain || !this.windLfoGain) return;

    // Wind volume
    if (this.backgroundWindActive) {
      const targetGain = this.calculateWindGain();
      this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
    }

    // Wind base frequency shifts with altitude (higher wind is whistlier/higher pitch)
    const baseFreq = 180 + (this.altitude / 100) * 280 + (this.windVelocity / 100) * 150; // 180Hz to 610Hz
    this.windFilter.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.8);

    // Wind swirling intensity (how gusty it is)
    const gustDepth = 80 + (this.windVelocity / 100) * 180; // 80Hz to 260Hz variation
    this.windLfoGain.gain.setTargetAtTime(gustDepth, this.ctx.currentTime, 0.8);
  }

  private setupStreamSynth() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // Stream synth using ScriptProcessorNode for procedural water trickling
      // (safe fallback if Worklets are unavailable, which is typical in standard quick prototypes)
      this.streamNoiseNode = this.ctx.createScriptProcessor(4096, 0, 1);
      
      // Let's generate white noise in script processor
      this.streamNoiseNode.onaudioprocess = (e) => {
        const outputBuffer = e.outputBuffer;
        const channelData = outputBuffer.getChannelData(0);
        for (let i = 0; i < outputBuffer.length; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
      };

      this.streamFilter = this.ctx.createBiquadFilter();
      this.streamFilter.type = 'bandpass';
      this.streamFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.streamFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.streamGain = this.ctx.createGain();
      const initGain = this.backgroundStreamActive ? this.calculateStreamGain() : 0;
      this.streamGain.gain.setValueAtTime(initGain, this.ctx.currentTime);

      // Create high-speed water-trickling LFO
      this.streamLfo = this.ctx.createOscillator();
      this.streamLfo.type = 'sine';
      this.streamLfo.frequency.setValueAtTime(4.5, this.ctx.currentTime); // 4.5Hz bubbling

      const streamLfoGain = this.ctx.createGain();
      streamLfoGain.gain.setValueAtTime(450, this.ctx.currentTime); // bubble sweep width

      // Connections
      this.streamLfo.connect(streamLfoGain);
      streamLfoGain.connect(this.streamFilter.frequency);

      this.streamNoiseNode.connect(this.streamFilter);
      this.streamFilter.connect(this.streamGain);
      this.streamGain.connect(this.masterGain);

      this.streamLfo.start(0);
    } catch (e) {
      console.warn('ScriptProcessor water stream synthesis not supported or failed:', e);
    }
  }

  private calculateStreamGain(): number {
    // Stream decreases at high altitude (dry peaks, ice) and is loud in valley
    const altitudeFactor = Math.max(0.1, 1 - (this.altitude / 100));
    return altitudeFactor * 0.05; // soft level
  }

  private updateStreamParams() {
    if (!this.ctx || !this.streamGain || !this.streamFilter || !this.streamLfo) return;

    if (this.backgroundStreamActive) {
      const targetGain = this.calculateStreamGain();
      this.streamGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 1.0);
    }

    // Stream bubbles slower or faster based on altitude and general landscape settings
    const speed = 3.0 + (1 - (this.altitude / 100)) * 3.0; // 3.0Hz to 6.0Hz bubbling
    this.streamLfo.frequency.setTargetAtTime(speed, this.ctx.currentTime, 0.5);

    // Filter center freq (valley has bigger, deeper splash; peaks have higher icy trickles)
    const centerFreq = 800 + (this.altitude / 100) * 600; // 800Hz to 1400Hz
    this.streamFilter.frequency.setTargetAtTime(centerFreq, this.ctx.currentTime, 1.0);
  }

  // --- Distant Pasture Bells (Cowbells) Scheduler ---

  private startPastureBellsScheduler() {
    const triggerBell = () => {
      if (this.backgroundBellsActive && this.isInitialized && this.ctx && this.ctx.state === 'running') {
        const pan = Math.random() * 2 - 1; // full left to right panning
        const pitchMultiplier = 0.7 + Math.random() * 0.8; // random cowbell size
        const volume = 0.12 + Math.random() * 0.15; // random distance/strength
        this.playCowbellSynth(pitchMultiplier, pan, volume);
      }

      // Schedule next bell: random time between 2s and 6s
      const delay = 2000 + Math.random() * 4000;
      this.bellTimer = setTimeout(triggerBell, delay);
    };

    triggerBell();
  }

  // --- Real-Time Acoustic Synthesizers ---

  /**
   * Synthesizes a realistic metallic cowbell or alpine chapel chime
   */
  public playCowbellSynth(pitchMultiplier: number, pan: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Classic 808-style/physical cowbell FM model using two square/sine waves
    // Frequencies designed to create an inharmonic, metallic clang
    const f1 = 540 * pitchMultiplier;
    const f2 = 800 * pitchMultiplier;

    // Create pan node
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.masterGain);

    // Bell envelope gain
    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(volume, now + 0.005);
    bellGain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2 * (volume * 4)); // ring duration

    bellGain.connect(panner);

    // Filter to sweeten the metallic edge
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000 * pitchMultiplier, now);
    filter.Q.setValueAtTime(2.0, now);
    filter.connect(bellGain);

    // FM Synthesizer Structure: Oscillator 1 modulates Oscillator 2
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(f1, now);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(f2, now);

    // Modulate Osc2 with Osc1
    modGain.gain.setValueAtTime(250, now);
    modGain.gain.exponentialRampToValueAtTime(1, now + 0.25); // decay modulation index

    osc1.connect(modGain);
    modGain.connect(osc2.frequency);

    // Connect Osc2 to Filter
    osc2.connect(filter);

    // High frequency strike transient (the hammer tap)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1800 * pitchMultiplier, now);
    clickGain.gain.setValueAtTime(volume * 1.5, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    
    clickOsc.connect(clickGain);
    clickGain.connect(filter);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    clickOsc.start(now);

    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
    clickOsc.stop(now + 0.05);

    // Send a dry feed to the main delay line for the alpine echo!
    if (this.echoDelayNode) {
      const dryEchoGain = this.ctx.createGain();
      dryEchoGain.gain.setValueAtTime(volume * 0.7, now);
      dryEchoGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.3);
      bellGain.connect(this.echoDelayNode);
    }
  }

  /**
   * Synthesizes a majestic deep Alphorn drone (Cor des Alpes)
   */
  public playAlphornDrone(fundamentalHz: number, duration: number = 3.5, volume: number = 0.35) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Breath-sound volume envelope
    const alphornGain = this.ctx.createGain();
    alphornGain.gain.setValueAtTime(0, now);
    alphornGain.gain.linearRampToValueAtTime(volume, now + 0.6); // slow build, like blowing into wood
    alphornGain.gain.setValueAtTime(volume, now + duration - 0.8);
    alphornGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    alphornGain.connect(this.masterGain);

    // Stereo Panner (slightly centered, majestic presence)
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);
    alphornGain.connect(panner);

    // Horn Lowpass Resonance Filter (Crucial for alphorn 'vowel' character!)
    // Formant filter at around 450Hz gives that deep hollow wood resonance
    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(320, now);
    hornFilter.frequency.exponentialRampToValueAtTime(480, now + 0.6); // opens up as blowing harder
    hornFilter.frequency.setValueAtTime(480, now + duration - 0.8);
    hornFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
    hornFilter.Q.setValueAtTime(4.5, now); // resonance giving the woody 'parleur' honk

    hornFilter.connect(alphornGain);

    // Overtones creation to simulate the harmonic horn series
    // An alphorn has a rich overtone spectrum.
    // Let's bundle multiple harmonics: Fundamental, 2nd, 3rd, 4th, 5th, 6th, 7th harmonics
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Harmonics relative volumes
    const harmonicWeights = [1.0, 0.8, 0.9, 0.5, 0.4, 0.2, 0.1]; // Emphasis on 1st-3rd for hollow warmth

    // Vibrato (subtle human breath wobble)
    const vibratoOsc = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(5.5, now); // 5.5Hz slow vibrato
    vibratoGain.gain.setValueAtTime(fundamentalHz * 0.015, now); // subtle pitch variation

    vibratoOsc.connect(vibratoGain);

    harmonicWeights.forEach((weight, i) => {
      const harmNo = i + 1;
      const freq = fundamentalHz * harmNo;

      const osc = this.ctx.createOscillator();
      // Alternating saw and triangle waves for complex woodwind buzz
      osc.type = harmNo % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Connect vibrato to oscillator pitch
      vibratoGain.connect(osc.frequency);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(weight * 0.12, now);

      osc.connect(gain);
      gain.connect(hornFilter);

      osc.start(now);
      osc.stop(now + duration + 0.1);

      oscs.push(osc);
      gains.push(gain);
    });

    // Breath air noise (adds authentic wind chuffing)
    const breathNoise = this.ctx.createScriptProcessor(2048, 0, 1);
    breathNoise.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++) {
        out[i] = (Math.random() * 2 - 1) * 0.02; // soft noise
      }
    };
    const breathFilter = this.ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(800, now);
    breathFilter.Q.setValueAtTime(1.0, now);

    const breathGain = this.ctx.createGain();
    breathGain.gain.setValueAtTime(0, now);
    breathGain.gain.linearRampToValueAtTime(0.04, now + 0.4);
    breathGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    breathNoise.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(hornFilter);

    vibratoOsc.start(now);
    vibratoOsc.stop(now + duration + 0.1);

    // Feed alphorn into the echo delay line too!
    if (this.echoDelayNode) {
      const echoFeed = this.ctx.createGain();
      echoFeed.gain.setValueAtTime(0, now);
      echoFeed.gain.linearRampToValueAtTime(volume * 0.3, now + 0.5);
      echoFeed.gain.exponentialRampToValueAtTime(0.00001, now + duration);
      
      hornFilter.connect(echoFeed);
      echoFeed.connect(this.echoDelayNode);
    }
  }

  /**
   * Synthesizes high-pitched ethereal crystal chimes
   */
  public playCrystalChime(frequency: number, pan: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Pan node
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.masterGain);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 2.5); // long, shimmering tail
    gainNode.connect(panner);

    // Ethereal FM model: Sine modulated by high speed sine
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(frequency, now);

    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(frequency * 3.14, now); // Inharmonic chime ratio

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(180, now);
    modGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Subtle chorus-like detuned second sine for shimmer
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(frequency + 1.5, now); // slightly detuned

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(volume * 0.4, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.00001, now + 2.0);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(panner);

    carrier.connect(gainNode);

    carrier.start(now);
    modulator.start(now);
    shimmer.start(now);

    carrier.stop(now + 2.6);
    modulator.stop(now + 2.6);
    shimmer.stop(now + 2.1);

    // Feed to Echo Delay
    if (this.echoDelayNode) {
      gainNode.connect(this.echoDelayNode);
    }
  }

  /**
   * Synthesizes a clean pure sine bell
   */
  public playPureBell(frequency: number, pan: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.masterGain);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 1.8);
    gainNode.connect(panner);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    // Add a soft higher octave overtone for chime character
    const overtone = this.ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(frequency * 2, now);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(volume * 0.3, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);

    osc.connect(gainNode);
    overtone.connect(overtoneGain);
    overtoneGain.connect(panner);

    osc.start(now);
    overtone.start(now);

    osc.stop(now + 2.0);
    overtone.stop(now + 0.8);

    if (this.echoDelayNode) {
      gainNode.connect(this.echoDelayNode);
    }
  }

  /**
   * Synthesizes a localized cold mountain wind gust echo
   */
  public playWindGustEcho(pan: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.masterGain);

    const gustGain = this.ctx.createGain();
    gustGain.gain.setValueAtTime(0, now);
    gustGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.5); // slow sweep in
    gustGain.gain.exponentialRampToValueAtTime(0.00001, now + 2.2);
    gustGain.connect(panner);

    // Create custom noise source
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.6); // sweep up frequency
    filter.frequency.exponentialRampToValueAtTime(300, now + 2.0); // sweep down
    filter.Q.setValueAtTime(3.0, now);

    noise.connect(filter);
    filter.connect(gustGain);

    noise.start(now);
    noise.stop(now + 2.5);

    if (this.echoDelayNode) {
      const echoFeed = this.ctx.createGain();
      echoFeed.gain.setValueAtTime(0.1, now);
      echoFeed.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);
      filter.connect(echoFeed);
      echoFeed.connect(this.echoDelayNode);
    }
  }

  /**
   * Main sound trigger based on mountain selection
   */
  public triggerMountainSound(mountainType: string, baseFrequency: number, xPercent: number, intensity: number = 0.5) {
    if (!this.isInitialized || !this.ctx) return;

    // Map screen X percentage (0 to 100) to stereo panning (-1.0 to 1.0)
    const pan = (xPercent / 50) - 1;

    // Apply harmony-mode tuning adjustments to the base frequency!
    const tunedFreq = this.getTunedFrequency(baseFrequency);

    // Volume scales with mountain density and manual trigger intensity
    const calculatedVolume = (0.2 + (this.rockDensity / 100) * 0.2) * intensity;

    switch (mountainType) {
      case 'chime':
        this.playCowbellSynth(tunedFreq / 300, pan, calculatedVolume);
        break;
      case 'alphorn':
        // Deep alphorn drone pitch: map frequency to a fundamental low bass note
        const alphornFundamental = tunedFreq / 4; // Drop 2 octaves
        this.playAlphornDrone(alphornFundamental, 3.0, calculatedVolume * 1.5);
        break;
      case 'crystal-bell':
        this.playCrystalChime(tunedFreq * 1.5, pan, calculatedVolume * 1.2);
        break;
      case 'pure-sine':
        this.playPureBell(tunedFreq, pan, calculatedVolume);
        break;
      case 'noise-wind':
        this.playWindGustEcho(pan, calculatedVolume * 1.8);
        break;
      default:
        this.playPureBell(tunedFreq, pan, calculatedVolume);
    }
  }

  /**
   * Adjusts frequencies based on Selected Harmony Mode
   */
  private getTunedFrequency(baseHz: number): number {
    switch (this.harmonyMode) {
      case 'pentatonic':
        // Safe, beautiful traditional mountain pentatonic notes
        // Round to nearest pentatonic multiplier
        // Frequencies mapped around standard E pentatonic scale: 1, 9/8, 5/4, 3/2, 5/3, 2
        return baseHz; 
      case 'quartz':
        // Mystic high-resonance chimes (Solfeggio-like, crystalline)
        return baseHz * 1.25; // sharp major third shift
      case 'drone':
        // Deep low droning fifths
        return baseHz * 0.75; // dropped fifth
      case 'solfeggio':
        // Spiritual Solfeggio 528Hz / 432Hz alignments
        // Adjust closest frequency to a spiritual resonance
        if (baseHz > 400 && baseHz < 600) return 528;
        if (baseHz > 250 && baseHz <= 400) return 432;
        return baseHz;
      default:
        return baseHz;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getByteFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }

  public getByteTimeDomainData(): Uint8Array | null {
    if (!this.analyser) return null;
    const array = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(array);
    return array;
  }

  public cleanup() {
    if (this.bellTimer) {
      clearTimeout(this.bellTimer);
    }
    // Stop oscillators and close context
    try {
      this.ctx?.close();
    } catch (e) {
      // already closed
    }
    this.isInitialized = false;
    this.ctx = null;
  }
}

// Export a single default audio instance
export const audioService = new AlpineAudioEngine();
