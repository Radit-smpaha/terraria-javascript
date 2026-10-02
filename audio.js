// Procedural Web Audio API sound synthesizer for Terraria-like game
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.isNight = false;
    this.isBoss = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.stepTimer = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Simple feedback delay gives the soundtrack a soft, Minecraft-like echo.
      try {
        const delay = this.ctx.createDelay(1.0);
        delay.delayTime.value = 0.38;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.35;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.22;
        this.ambientGain.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(this.masterGain);
      } catch (e) { /* delay is optional */ }

      this.startAmbientMusic();
    } catch (e) {
      console.warn("Web Audio not supported or blocked:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.9 : 0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // Jump sound: cheerful retro frequency sweep
  playJump() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Double jump / Hermes dash: gust of wind whoosh
  playDoubleJump() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Dodge roll swoosh
  playDodge() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Sword slash whoosh
  playSwing() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // THE BAN HAMMER — a three-layer "system ban" impact, built from the same
  // oscillator+gain idiom as every other sound here:
  //   1. a detuned square-wave "ERROR" dyad two octaves down (the sting),
  //   2. a fast downward sawtooth sweep (the denial),
  //   3. a burst of white noise gated hard (the CRT power-cut).
  // The noise is generated into an AudioBuffer rather than a looping node, so
  // one swing makes exactly one burst and cannot leave a hiss running.
  playBanHammer() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.value = 0.85;
    out.connect(this.masterGain);

    // 1. ERROR dyad — a minor second, deliberately dissonant.
    for (const [freq, delay, vol] of [[196, 0, 0.26], [207.65, 0, 0.22]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.55);
      osc.connect(gain); gain.connect(out);
      osc.start(now + delay); osc.stop(now + delay + 0.6);
    }

    // 2. Denial sweep — 1200Hz down to 90Hz across 0.4s.
    const saw = ctx.createOscillator();
    const sawGain = ctx.createGain();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(1200, now);
    saw.frequency.exponentialRampToValueAtTime(90, now + 0.4);
    sawGain.gain.setValueAtTime(0.22, now);
    sawGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    saw.connect(sawGain); sawGain.connect(out);
    saw.start(now); saw.stop(now + 0.42);

    // 3. Noise burst — a short filtered hit layered over the tonal sting.
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Decaying white noise: full volume at the first sample, silent by the end.
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;
    noise.connect(bp); bp.connect(noiseGain); noiseGain.connect(out);
    noise.start(now);
  }

  // Bow arrow release
  playBow() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Magic staff spellcast
  playMagic() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.08);
    osc.frequency.linearRampToValueAtTime(1040, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Hit sound (enemy flesh / hurt)
  playHit() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Player hurt sound (punchy groan impact)
  playPlayerHurt() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Tile mining / digging sound
  playDig(isStone = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = isStone ? 'triangle' : 'sine';
    const baseFreq = isStone ? 180 + Math.random() * 60 : 110 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Tile placement "clack"
  playPlace() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Boss roar / summon cry
  playBossRoar() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'sawtooth' : 'square';
      const f = 80 + i * 25;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 2.2, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    }
  }

  // Boss laser/projectile attack
  playBossLaser() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Explosion / boss death crumble
  playExplosion() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    // Low frequency rumble + noise simulation
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120 - i * 20, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  // Item pickup chime
  playPickup() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.05); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Crafting anvil clang
  playCraft() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Minecraft-style soundtrack: slow arpeggios over fixed chord progressions,
  // long signature silences between pieces, and a hard-driving fixed boss loop.
  startAmbientMusic() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;

    // Chord tables: [root, 3rd, 5th, octave] as frequencies.
    const C = [261.63, 329.63, 392.00, 523.25];
    const G = [196.00, 246.94, 293.66, 392.00];
    const Am = [220.00, 261.63, 329.63, 440.00];
    const F = [174.61, 220.00, 261.63, 349.23];
    const Em = [164.81, 196.00, 246.94, 329.63];
    const Dm = [146.83, 174.61, 220.00, 293.66];
    const DAY_PROGS = [
      [C, G, Am, F],     // I - V - vi - IV
      [Am, F, C, G],     // vi - IV - I - V
      [C, Em, Dm, G]     // I - iii - ii - V
    ];
    const NIGHT_PROGS = [
      [Am, Em, F, C],    // i - v - VI - III
      [Dm, Am, Em, F]    // iv - i - v - VI
    ];
    const ARP = [0, 1, 2, 3, 2, 1];  // gentle up-down arpeggio through the chord
    const BOSS_RIFF = [130.81, 130.81, 155.56, 130.81, 174.61, 164.81, 155.56, 146.83];
    const BOSS_BASS = [65.41, 65.41, 73.42, 61.74];

    const seq = { prog: 0, chord: 0, pat: 0, gap: false, step: 0, lastMode: null };

    const voice = (freq, when, dur, type, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(vol, when + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    };

    const kick = (when) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, when);
      osc.frequency.exponentialRampToValueAtTime(40, when + 0.12);
      gain.gain.setValueAtTime(0.55, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(when);
      osc.stop(when + 0.16);
    };

    const hat = (when) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, when);
      gain.gain.setValueAtTime(0.05, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(when);
      osc.stop(when + 0.05);
    };

    const playNextNote = () => {
      if (!this.bgmPlaying || !this.ctx || !this.enabled) {
        setTimeout(playNextNote, 250);
        return;
      }
      this.resume();
      const now = this.ctx.currentTime;
      const mode = this.isBoss ? 'boss' : (this.isNight ? 'night' : 'day');
      if (mode !== seq.lastMode) {
        seq.lastMode = mode;
        seq.prog = 0; seq.chord = 0; seq.pat = 0; seq.gap = false; seq.step = 0;
      }

      // ---- Boss: fixed minor riff + stomping bass, constant tempo ----
      if (mode === 'boss') {
        const f = BOSS_RIFF[seq.step % BOSS_RIFF.length];
        voice(f, now, 0.16, 'sawtooth', 0.10);
        voice(f * 2, now, 0.12, 'square', 0.03);
        if (seq.step % 2 === 0) voice(BOSS_BASS[((seq.step / 2) | 0) % BOSS_BASS.length], now, 0.22, 'triangle', 0.18);
        if (seq.step % 4 === 2) kick(now);
        if (seq.step % 2 === 1) hat(now);
        seq.step++;
        setTimeout(playNextNote, 170);
        return;
      }

      const night = mode === 'night';
      const progs = night ? NIGHT_PROGS : DAY_PROGS;

      // Minecraft's signature silence between pieces.
      if (seq.gap) {
        seq.gap = false;
        seq.prog = (seq.prog + 1) % progs.length;
        seq.chord = 0;
        seq.pat = 0;
        setTimeout(playNextNote, night ? 8000 + Math.random() * 5000 : 5500 + Math.random() * 3500);
        return;
      }

      // ---- Day / Night: arpeggiate the current chord of the progression ----
      const chord = progs[seq.prog][seq.chord];
      const lead = night ? chord[ARP[seq.pat]] / 2 : chord[ARP[seq.pat]];
      const tempo = (night ? 980 : 760) + Math.floor(Math.random() * 140);

      if (seq.pat === 0) {
        // When a chord lands: soft sustained pad + slow bass root underneath.
        for (let i = 0; i < 3; i++) voice(chord[i], now, night ? 4.2 : 3.4, 'sine', night ? 0.035 : 0.045);
        voice(chord[0] / 2, now, night ? 4.5 : 3.8, 'sine', 0.09);
      }

      voice(lead, now, night ? 3.2 : 2.6, night ? 'triangle' : 'sine', night ? 0.11 : 0.13);
      if (!night) voice(lead * 2, now, 1.2, 'triangle', 0.035); // gentle sparkle, day only

      // Advance: note -> next note ... end of progression -> silence -> next.
      seq.pat++;
      if (seq.pat >= ARP.length) {
        seq.pat = 0;
        seq.chord++;
        if (seq.chord >= progs[seq.prog].length) {
          seq.chord = 0;
          seq.gap = true;
        }
      }
      setTimeout(playNextNote, tempo);
    };

    playNextNote();
  }
}

window.soundSystem = new SoundSystem();

window.SoundSystem = SoundSystem;
