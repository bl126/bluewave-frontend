"use client";

class SpaceAudio {
  private ctx: AudioContext | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private activePianoInterval: any = null;
  private chordIndex = 0;
  private isMusicPlaying = false;

  // Chord notes mapping (A2=110Hz, C3=130.81Hz, etc.)
  // Let's create gorgeous, open-voiced ambient chord layers
  private chords = [
    // Am9: A2 (110), E3 (164.81), C4 (261.63), G4 (392.00), B4 (493.88)
    [110.00, 164.81, 261.63, 392.00, 493.88],
    // Fmaj9: F2 (87.31), C3 (130.81), A3 (220.00), E4 (329.63), G4 (392.00)
    [87.31, 130.81, 220.00, 329.63, 392.00],
    // Cmaj9: C2 (65.41), G2 (98.00), E3 (164.81), B3 (246.94), D4 (293.66), G4 (392.00)
    [65.41, 98.00, 164.81, 246.94, 293.66, 392.00],
    // G6/11: G2 (98.00), D3 (146.83), B3 (246.94), E4 (329.63), F#4 (369.99)
    [98.00, 146.83, 246.94, 329.63, 369.99]
  ];

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Create a massive space-reverb/delay network
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayFeedback = this.ctx.createGain();

      // Delay parameters for high-depth echo
      this.delayNode.delayTime.value = 0.65; // slow echoing delay
      this.delayFeedback.gain.value = 0.45; // lingering trails

      // Connect delay into a beautiful ambient feedback loop
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);

      // Connect delay output to destination
      this.delayNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public stopAll() {
    if (this.activePianoInterval) {
      clearInterval(this.activePianoInterval);
      this.activePianoInterval = null;
    }
    this.isMusicPlaying = false;
  }

  // ──── START PIANO MUSIC ────
  // Plays slow, beautiful, echoing ambient piano notes
  public startAmbientMusic() {
    this.initCtx();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    let step = 0;

    const playLoop = () => {
      if (!this.ctx || !this.isMusicPlaying) return;

      const chord = this.chords[this.chordIndex];
      const now = this.ctx.currentTime;

      // Every 8 beats, change the chord index
      if (step % 8 === 0) {
        this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      }

      // Root note (played extremely soft in the bass on beat 0)
      if (step % 8 === 0) {
        this.playPianoNote(chord[0], 0.05, true); // low bass root
      }

      // Mid chord voice (every 2-4 seconds)
      if (step % 2 === 0 && Math.random() > 0.2) {
        // Pick a mid-register note
        const note = chord[1 + Math.floor(Math.random() * 2)];
        this.playPianoNote(note, 0.04);
      }

      // High sparkling note (representing sparkling stars, highly random and airy)
      if (Math.random() > 0.45) {
        const noteIndex = Math.min(chord.length - 1, 3 + Math.floor(Math.random() * 3));
        const note = chord[noteIndex] * (Math.random() > 0.7 ? 2.0 : 1.0); // occasionally octaved higher
        setTimeout(() => {
          this.playPianoNote(note, 0.035);
        }, Math.random() * 1500); // randomize when it strikes to sound delicate and organic
      }

      step++;
    };

    // Run ambient piano sequencer loop
    playLoop();
    this.activePianoInterval = setInterval(playLoop, 3200); // slow, breathy pace
  }

  // Synthesizes a soft, organic piano note
  public playPianoNote(frequency: number, volume: number = 0.05, isBass: boolean = false) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filterNode = this.ctx.createBiquadFilter();

      // Soft hammer strike: low-pass filtered triangle + sine mix
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(frequency, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(frequency * 1.002, now); // subtle detune for warmth

      // Subtractive filter simulation: key strike has high harmonics, then decays rapidly
      filterNode.type = "lowpass";
      const startCutoff = isBass ? 350 : 900;
      const endCutoff = isBass ? 90 : 180;
      filterNode.frequency.setValueAtTime(startCutoff, now);
      filterNode.frequency.exponentialRampToValueAtTime(endCutoff, now + (isBass ? 1.5 : 0.8));
      filterNode.Q.setValueAtTime(1.0, now);

      // Amplitude envelope (ADSR)
      // Fast attack, slow natural piano string decay
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.015); // soft hammer attack
      
      const decayTime = isBass ? 4.5 : 2.5;
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      // Routing
      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);

      // Connect directly to output AND to our gorgeous space reverb/delay network
      gainNode.connect(this.ctx.destination);
      if (this.delayNode) {
        gainNode.connect(this.delayNode);
      }

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + decayTime + 0.1);
      osc2.stop(now + decayTime + 0.1);
    } catch (e) {
      console.warn("Piano synthesis blocked or failed:", e);
    }
  }

  // ──── PORTAL RING MUSIC AND TRANSITIONS ────

  public startPortalRingAudio() {
    this.stopAll();
    this.startAmbientMusic();
  }

  public startBlockRainAudio() {
    // Keep ambient music playing softly, rain ticks will overlay
    this.initCtx();
  }

  public startSpaceAudio() {
    // Keep the beautiful emotional ambient music floating in the void
    this.initCtx();
  }

  // Synthesizes a delicate crystalline particle tick
  public playClick(pitch: number = 2000) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, now);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(pitch, now);
      filter.Q.setValueAtTime(4, now);

      // Microcrystalline pop envelope
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Connect slightly to delay to give ticks a faint crystalline echo
      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  // Matrix click — delicate glass chime impact
  public playMatrixClick() {
    if (Math.random() > 0.85) {
      // Occasional crystalline bell pop
      const pitches = [1800, 2200, 2600, 3100, 3800];
      const pitch = pitches[Math.floor(Math.random() * pitches.length)];
      this.playClick(pitch);
    } else {
      // Soft digital tick
      try {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2200 + Math.random() * 400, now);

        gain.gain.setValueAtTime(0.004, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.01);
      } catch {}
    }
  }

  // Soft cinematic chime for portal click
  public playPortalClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High delicate chime notes descending (representing magical portal action)
      const notes = [880, 1320, 1760];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.03, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.delayNode) {
          gain.connect(this.delayNode);
        }

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch {}
  }

  // Dissolving/dispersing puzzle block whoosh
  public playDisperse() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Soft breathy noise sweep representing elements drifting to infinity
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // white noise
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 1.4);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 1.5);
    } catch {}
  }

  // Soft weightless zoom whoosh
  public playWhoosh() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }
}

export const spaceAudio = new SpaceAudio();
