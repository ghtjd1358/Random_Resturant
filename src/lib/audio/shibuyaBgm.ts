"use client";

/**
 * Synthesises a ~7-second cinematic "cursed domain" cue with Web Audio.
 * Everything is generated in-code — no audio files needed.
 *
 * Palette:
 *   • layered low sine drone (A1 + fifth + octave) → rumbling sustain
 *   • filtered sawtooth "curse" overtone → dissonance around the climax
 *   • three taiko-like noise bursts (low-passed, fast decay) → pacing hits
 *   • additive bell at climax → resonant tail
 *
 * Browsers may suspend the context unless a user gesture started it.
 * We try resume() but silently degrade to no audio if blocked.
 */

export interface BgmController {
  stop: () => void;
}

type WindowWithWebkit = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export function startShibuyaBgm(): BgmController | null {
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
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // ── Layered drone — A1 + E2 + A2 through a dark low-pass ───────────────
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 380;
  droneFilter.Q.value = 0.8;
  droneFilter.connect(master);

  const droneOscs: OscillatorNode[] = [];
  for (const freq of [55, 82.5, 110]) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = freq === 55 ? 0.55 : freq === 82.5 ? 0.32 : 0.22;
    osc.connect(g).connect(droneFilter);
    osc.start(now);
    droneOscs.push(osc);
  }

  // Subtle LFO on the drone filter — "breathing" cursed energy
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.3;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 60;
  lfo.connect(lfoGain).connect(droneFilter.frequency);
  lfo.start(now);

  // ── Dissonant overtone — builds into climax, retreats after ────────────
  const curse = ctx.createOscillator();
  curse.type = "sawtooth";
  curse.frequency.value = 220;
  const curseFilter = ctx.createBiquadFilter();
  curseFilter.type = "bandpass";
  curseFilter.frequency.value = 320;
  curseFilter.Q.value = 3.5;
  const curseGain = ctx.createGain();
  curseGain.gain.value = 0;
  curse.connect(curseFilter).connect(curseGain).connect(master);
  curseGain.gain.setValueAtTime(0, now + 2.5);
  curseGain.gain.linearRampToValueAtTime(0.12, now + 4.5);
  curseGain.gain.linearRampToValueAtTime(0, now + 5.8);
  curse.start(now);

  // ── Taiko drum hits at 1.5, 3.0, 4.5 ───────────────────────────────────
  scheduleTaiko(ctx, now + 1.5, 0.7);
  scheduleTaiko(ctx, now + 3.0, 0.85);
  scheduleTaiko(ctx, now + 4.5, 1.0);

  // ── Resonant bell at climax ────────────────────────────────────────────
  scheduleBell(ctx, now + 4.5);

  // ── Master envelope ────────────────────────────────────────────────────
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.32, now + 2);
  master.gain.setValueAtTime(0.32, now + 3);
  master.gain.linearRampToValueAtTime(0.55, now + 4.5);
  master.gain.setValueAtTime(0.55, now + 5.5);
  master.gain.linearRampToValueAtTime(0, now + 7);

  const endAt = now + 7.2;
  for (const osc of droneOscs) osc.stop(endAt);
  curse.stop(endAt);
  lfo.stop(endAt);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const t = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.25);
      } catch {
        // setValueAtTime can throw if context already closed — ignore.
      }
      window.setTimeout(() => {
        ctx.close().catch(() => undefined);
      }, 400);
    },
  };
}

function scheduleTaiko(ctx: AudioContext, at: number, intensity: number) {
  const duration = 0.4;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const decayRate = ctx.sampleRate * 0.08;
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decayRate);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 140;
  filter.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.value = intensity;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(at);
}

function scheduleBell(ctx: AudioContext, at: number) {
  const partials: { freq: number; gain: number; decay: number }[] = [
    { freq: 220, gain: 0.28, decay: 2.5 },
    { freq: 440, gain: 0.14, decay: 1.8 },
    { freq: 660, gain: 0.07, decay: 1.2 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = p.freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, at + p.decay);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.decay + 0.1);
  }
}
