class SpaceAudio {
  private ctx: AudioContext | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private humGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playPortalClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // An ascending sweeping chirp
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn("PortalClick sound failed:", e);
    }
  }

  public playHum() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Avoid double hum
      if (this.humOsc1) return;

      const now = this.ctx.currentTime;
      this.humOsc1 = this.ctx.createOscillator();
      this.humOsc2 = this.ctx.createOscillator();
      this.humFilter = this.ctx.createBiquadFilter();
      this.humGain = this.ctx.createGain();
      this.lfo = this.ctx.createOscillator();
      this.lfoGain = this.ctx.createGain();

      // Deep space frequencies
      this.humOsc1.type = "triangle";
      this.humOsc1.frequency.setValueAtTime(55, now); // A1

      this.humOsc2.type = "sawtooth";
      this.humOsc2.frequency.setValueAtTime(55.5, now); // slightly detuned

      this.humFilter.type = "lowpass";
      this.humFilter.frequency.setValueAtTime(120, now);
      this.humFilter.Q.setValueAtTime(3, now);

      // LFO to make it breathe
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.2, now); // very slow 0.2Hz (5s cycle)
      this.lfoGain.gain.setValueAtTime(40, now); // modulate by 40Hz

      this.humGain.gain.setValueAtTime(0.001, now);
      this.humGain.gain.linearRampToValueAtTime(0.25, now + 2.0); // smooth fade in

      // Connect LFO
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.humFilter.frequency);

      // Connect oscs
      this.humOsc1.connect(this.humFilter);
      this.humOsc2.connect(this.humFilter);
      this.humFilter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      // Start all
      this.lfo.start(now);
      this.humOsc1.start(now);
      this.humOsc2.start(now);
    } catch (e) {
      console.warn("SpaceHum sound failed:", e);
    }
  }

  public stopHum() {
    try {
      if (!this.ctx || !this.humGain) return;
      const now = this.ctx.currentTime;
      const currentGain = this.humGain.gain.value;

      this.humGain.gain.cancelScheduledValues(now);
      this.humGain.gain.setValueAtTime(currentGain, now);
      this.humGain.gain.linearRampToValueAtTime(0.001, now + 1.0); // fade out over 1s

      const osc1 = this.humOsc1;
      const osc2 = this.humOsc2;
      const lfoOsc = this.lfo;

      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          lfoOsc?.stop();
        } catch {}
      }, 1100);

      this.humOsc1 = null;
      this.humOsc2 = null;
      this.humFilter = null;
      this.humGain = null;
      this.lfo = null;
      this.lfoGain = null;
    } catch (e) {
      console.warn("StopHum failed:", e);
    }
  }

  public playClick(pitch: number = 440) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, now);
      
      // Short blip
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // ignore
    }
  }

  public playDisperse() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

      // Lowpass sweeps
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 1.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      // ignore
    }
  }

  public playWhoosh() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      // ignore
    }
  }
}

export const spaceAudio = new SpaceAudio();
