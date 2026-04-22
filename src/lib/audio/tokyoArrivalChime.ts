"use client";

/**
 * A short celebratory chime for the 도쿄 도착 intro.
 * A single major triad (C5 + E5 + G5) played as an additive bell —
 * bright, warm, traveller-arrival energy. ~1.8s of ringing decay.
 *
 * Browsers may block audio when no user gesture occurred. We try resume()
 * and silently degrade to no sound if blocked.
 */

export interface ChimeController {
  stop: () => void;
}

type WindowWithWebkit = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export function startTokyoArrivalChime(): ChimeController | null {
  if (typeof window === "undefined") return null;
  const win = window as WindowWithWebkit;
  const Ctor = win.AudioContext ?? win.webkitAudioContext;
  if (!Ctor) return null;

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  const now = ctx.currentTime;

  // Bell strike lines up with the stamp impact at ~1.2s into the intro.
  const strikeAt = now + 1.2;

  // C-major triad — bright, airy
  scheduleBell(ctx, strikeAt, 523.25, 0.22, 1.8); // C5
  scheduleBell(ctx, strikeAt + 0.02, 659.25, 0.18, 1.6); // E5
  scheduleBell(ctx, strikeAt + 0.04, 783.99, 0.14, 1.4); // G5

  // A tiny "stamp thud" — fleeting low-freq bump so the impact feels physical
  scheduleThud(ctx, strikeAt);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      window.setTimeout(() => {
        ctx.close().catch(() => undefined);
      }, 2400);
    },
  };
}

function scheduleBell(
  ctx: AudioContext,
  at: number,
  freq: number,
  gain: number,
  decay: number,
) {
  const partials: { mult: number; ratio: number }[] = [
    { mult: 1, ratio: 1 },
    { mult: 2, ratio: 0.45 },
    { mult: 3, ratio: 0.2 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * p.mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain * p.ratio, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, at + decay);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + decay + 0.1);
  }
}

function scheduleThud(ctx: AudioContext, at: number) {
  const duration = 0.18;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const decayRate = ctx.sampleRate * 0.04;
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decayRate);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 180;
  const g = ctx.createGain();
  g.gain.value = 0.45;
  noise.connect(filter).connect(g).connect(ctx.destination);
  noise.start(at);
}
