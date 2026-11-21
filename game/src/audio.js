// All sound is synthesized with WebAudio — no audio files, no network.
// Footsteps tick as the thief walks (louder when a guard is close, so sound
// tells you where a guard is), a rising tone tracks suspicion, and short
// blips mark the coin, the gem, the alarm, and the win.
export function createAudio() {
  let ctx = null;
  let master = null;
  let suspicionOsc = null;
  let suspicionGain = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noiseTick(vol) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
  }

  return {
    ensure,
    // A soft tick every ~28px of walking; guard footsteps are the same tick,
    // louder the nearer the guard is — you hear patrols before you see them.
    footstep(nearGuardDist) {
      if (!ctx) return;
      const vol = nearGuardDist === undefined ? 0.05 : Math.max(0.02, 0.22 - nearGuardDist / 1600);
      noiseTick(vol);
    },
    // A quiet tone whose pitch climbs with the highest suspicion — the
    // "someone is noticing you" feeling, before the alarm ever sounds.
    suspicion(level) {
      if (!ctx) return;
      if (level <= 5) {
        if (suspicionOsc) {
          suspicionGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        }
        return;
      }
      if (!suspicionOsc) {
        suspicionOsc = ctx.createOscillator();
        suspicionGain = ctx.createGain();
        suspicionOsc.type = 'sine';
        suspicionGain.gain.value = 0;
        suspicionOsc.connect(suspicionGain);
        suspicionGain.connect(master);
        suspicionOsc.start();
      }
      const freq = 180 + level * 2.4;
      suspicionOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
      suspicionGain.gain.setTargetAtTime(0.015 + level * 0.00035, ctx.currentTime, 0.1);
    },
    alarm() {
      if (!ctx) return;
      blip(880, 0.12, 'square', 0.12);
      blip(660, 0.12, 'square', 0.12, 0.14);
      blip(880, 0.18, 'square', 0.12, 0.28);
    },
    coin() {
      if (!ctx) return;
      blip(2400, 0.08, 'sine', 0.15);
      blip(1800, 0.12, 'sine', 0.12, 0.07);
    },
    gem() {
      if (!ctx) return;
      blip(1320, 0.1, 'sine', 0.15);
      blip(1760, 0.16, 'sine', 0.15, 0.09);
    },
    caught() {
      if (!ctx) return;
      blip(220, 0.25, 'sawtooth', 0.14);
      blip(165, 0.35, 'sawtooth', 0.14, 0.2);
    },
    win() {
      if (!ctx) return;
      [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'sine', 0.16, i * 0.12));
    },
  };
}
