/**
 * Diegetic one-shot cues (GDD §9 MVP). No music beds.
 * Web Audio oscillators — no asset pack.
 */
export class Sfx {
  private ctx: AudioContext | null = null;

  resume(): void {
    try {
      const ctx = this.ensure();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
    } catch {
      // Audio is optional in M1.
    }
  }

  dodge(): void {
    this.blip(140, 320, 0.07, 0.09);
  }

  hit(): void {
    this.noise(0.09, 0.12);
  }

  death(): void {
    this.sweep(320, 70, 0.35);
  }

  recovered(): void {
    this.blip(440, 660, 0.08, 0.12);
    this.blip(660, 880, 0.08, 0.16, 0.08);
  }

  dry(): void {
    this.blip(90, 70, 0.04, 0.05);
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        throw new Error('Web Audio is unavailable.');
      }
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  private blip(fromHz: number, toHz: number, gain: number, duration: number, delay = 0): void {
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(fromHz, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + duration);
      amp.gain.setValueAtTime(gain, now);
      amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Audio is optional in M1.
    }
  }

  private sweep(fromHz: number, toHz: number, duration: number): void {
    this.blip(fromHz, toHz, 0.1, duration);
  }

  private noise(gain: number, duration: number): void {
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime;
      const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = ctx.createBufferSource();
      const amp = ctx.createGain();
      src.buffer = buffer;
      amp.gain.setValueAtTime(gain, now);
      amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
      src.connect(amp);
      amp.connect(ctx.destination);
      src.start(now);
    } catch {
      // Audio is optional in M1.
    }
  }
}
