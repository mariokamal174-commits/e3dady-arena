/** Tiny WebAudio synth so the game ships with sound effects and no assets. */

let ctx: AudioContext | null = null;
let enabled = true;
let volume = 1;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

/** Master volume multiplier, 0 (mute) .. 1 (full). */
export function setVolume(value: number) {
  volume = Math.min(1, Math.max(0, value));
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Browsers block audio until a gesture — call this from the first click. */
export function unlockAudio() {
  getCtx();
}

interface ToneOptions {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
  sweepTo?: number;
}

function tone({ freq, duration = 0.18, type = "sine", delay = 0, gain = 0.18, sweepTo }: ToneOptions) {
  const audio = getCtx();
  if (!audio || !enabled || volume <= 0) return;
  const level = gain * volume;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + duration);
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t0 + 0.015);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(vol).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export type SoundName =
  | "tick"
  | "urgent"
  | "timeup"
  | "correct"
  | "wrong"
  | "steal"
  | "speed"
  | "buzz"
  | "winner"
  | "click";

export function playSound(name: SoundName) {
  if (!enabled) return;
  switch (name) {
    case "tick":
      tone({ freq: 880, duration: 0.06, type: "triangle", gain: 0.06 });
      break;
    case "urgent":
      tone({ freq: 1200, duration: 0.09, type: "square", gain: 0.09 });
      break;
    case "timeup":
      tone({ freq: 320, duration: 0.6, type: "sawtooth", gain: 0.16, sweepTo: 90 });
      tone({ freq: 160, duration: 0.7, type: "square", gain: 0.1, sweepTo: 60, delay: 0.05 });
      break;
    case "correct":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone({ freq: f, duration: 0.22, type: "triangle", delay: i * 0.08, gain: 0.16 }),
      );
      break;
    case "wrong":
      tone({ freq: 220, duration: 0.28, type: "sawtooth", gain: 0.15 });
      tone({ freq: 170, duration: 0.34, type: "square", gain: 0.13, delay: 0.12 });
      break;
    case "steal":
      [440, 620, 440, 620].forEach((f, i) =>
        tone({ freq: f, duration: 0.12, type: "square", delay: i * 0.13, gain: 0.11 }),
      );
      break;
    case "speed":
      tone({ freq: 400, duration: 0.35, type: "sawtooth", gain: 0.14, sweepTo: 1400 });
      break;
    case "buzz":
      tone({ freq: 900, duration: 0.14, type: "square", gain: 0.14, sweepTo: 1500 });
      break;
    case "winner":
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ freq: f, duration: 0.5, type: "triangle", delay: i * 0.14, gain: 0.17 }),
      );
      break;
    case "click":
      tone({ freq: 620, duration: 0.05, type: "triangle", gain: 0.07 });
      break;
  }
}
