class SpaceAudio {
  private ctx: AudioContext | null = null;
  private currentSource: any = null;
  
  // Drone & Hum Nodes
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Sound generator timers
  private crackleInterval: any = null;
  private rainClickInterval: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public stopAll() {
    // Clear intervals
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    if (this.rainClickInterval) {
      clearInterval(this.rainClickInterval);
      this.rainClickInterval = null;
    }

    // Stop Oscillators
    this.droneOscs.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.droneOscs = [];

    if (this.lfo) {
      try { this.lfo.stop(); } catch {}
      this.lfo = null;
    }

    // Fade out main gain if exists
    if (this.droneGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.droneGain.gain.cancelScheduledValues(now);
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
        this.droneGain.gain.linearRampToValueAtTime(0, now + 0.8);
      } catch {}
    }
    this.droneGain = null;
    this.filterNode = null;
    this.lfoGain = null;
  }

  // 1. Portal Ring Audio: Deep Cinema Hum + Crackling Sparks
  public startPortalRingAudio() {
    this.stopAll();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();
    
    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.linearRampToValueAtTime(0.3, now + 1.5); // smooth fade in

    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(80, now);
    this.filterNode.Q.setValueAtTime(4, now);

    // Deep heavy drone (detuned triangle oscillators)
    const freqs = [55, 55.4, 110, 110.8]; // Detuned A1 and A2
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(this.filterNode!);
      osc.start(now);
      this.droneOscs.push(osc);
    });

    // LFO to modulate filter (creates the spatial vibration/resonance)
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0.25, now); // slow breathing
    this.lfoGain.gain.setValueAtTime(30, now);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filterNode.frequency);
    this.lfo.start(now);

    this.filterNode.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);

    // Crackling Sparks (subtle fire distortion)
    this.crackleInterval = setInterval(() => {
      this.playCrackleSpark();
    }, 150);
  }

  private playCrackleSpark() {
    if (!this.ctx || Math.random() > 0.4) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800 + Math.random() * 1200, now);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2000, now);

    gain.gain.setValueAtTime(0.005 + Math.random() * 0.008, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Block Rain Audio: Digital assembly, matrix pop glitch arpeggios
  public startBlockRainAudio() {
    this.stopAll();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();

    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.linearRampToValueAtTime(0.15, now + 0.8);

    // High pass filter for glitchy/digital feeling
    this.filterNode.type = "highpass";
    this.filterNode.frequency.setValueAtTime(150, now);

    // Deep tech pad
    const freqs = [146.83, 220, 329.63]; // D3, A3, E4
    freqs.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(this.filterNode!);
      osc.start(now);
      this.droneOscs.push(osc);
    });

    this.filterNode.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);

    // Fast arpeggiated data click rain
    this.rainClickInterval = setInterval(() => {
      this.playMatrixClick();
    }, 45);
  }

  private playMatrixClick() {
    if (!this.ctx || Math.random() > 0.8) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Holographic digital pitches
    const pitches = [600, 800, 1200, 1500, 2000, 2400];
    const pitch = pitches[Math.floor(Math.random() * pitches.length)];
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 3. Space Audio: Deep ambient space drone + floating echoes
  public startSpaceAudio() {
    this.stopAll();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();

    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.linearRampToValueAtTime(0.2, now + 3.0); // very slow fade in

    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(150, now);
    this.filterNode.Q.setValueAtTime(1.5, now);

    // Tri-oscillator atmospheric pad (Fmaj7 chord: F2, C3, A3, E4)
    const freqs = [87.31, 130.81, 220.00, 329.63];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now);
      
      // Add very slow detune sweeps
      const detuneOsc = this.ctx.createOscillator();
      const detuneGain = this.ctx.createGain();
      detuneOsc.frequency.setValueAtTime(0.05 + idx * 0.02, now);
      detuneGain.gain.setValueAtTime(4, now);
      detuneOsc.connect(detuneGain);
      detuneGain.connect(osc.frequency);
      detuneOsc.start(now);
      
      osc.connect(this.filterNode!);
      osc.start(now);
      this.droneOscs.push(osc);
      this.droneOscs.push(detuneOsc); // keep track to stop
    });

    // Slow filter sweep (cosmic wind)
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0.08, now); // ultra slow (12.5s cycle)
    this.lfoGain.gain.setValueAtTime(70, now);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filterNode.frequency);
    this.lfo.start(now);

    this.filterNode.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);
  }

  // Trigger sound effect for portal button click
  public playPortalClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  // Micro beep clicks when blocks snap into place
  public playClick(pitch: number = 440) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // Shockwave sweep sound
  public playDisperse() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 1.5);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch {}
  }

  // Soft zoom whoosh — plays on scroll/pinch zoom gestures
  public playWhoosh() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }
}

export const spaceAudio = new SpaceAudio();
