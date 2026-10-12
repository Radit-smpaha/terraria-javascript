// ============================================================================
// sprite-animator.js -- delta-time frame playback for the Megalodon pack.
//
// There is deliberately NO rendering engine here: it does not draw to a canvas
// and it does not know about the game. It owns exactly one thing -- which
// frame of which spritesheet should be on screen right now -- and hands that
// frame (plus its cell rect and flip) to whatever renderer is already running.
// That keeps it drop-in compatible with this project's procedural renderer
// while still being usable by a plain `drawImage` loop.
//
//   const anim = new MegaSpriteAnimator(manifest);
//   await anim.load();                       // loads every PNG once
//   anim.play('bite', { once: true });       // one-shot attack
//   anim.update(dt);                          // delta-time, no setInterval
//   const f = anim.frame();                  // {image, sx, sy, sw, sh, flipped}
//
// Details that matter:
//   * `play()` only restarts when the clip actually changes, so switching
//     swim -> fast_swim -> swim does not reset the tail beat.
//   * one-shot clips latch on their last frame instead of looping.
//   * imageSmoothingEnabled is left to the caller, but `frame()` returns a
//     nearest-neighbour-safe rect, and `pixelPerfect()` is provided to set it.
//   * horizontal flip is applied as a flag, not a second sheet.
// ============================================================================
'use strict';

/** One spritesheet + its playback state. */
class MegaSpriteClip {
  constructor(spec, image) {
    this.name = spec.animation;
    this.file = spec.file;
    this.frames = spec.frames;
    this.cols = spec.columns || spec.frames;
    this.rows = spec.rows || 1;
    this.fw = spec.frameWidth;
    this.fh = spec.frameHeight;
    this.fps = spec.fps;
    this.loop = !!spec.loop;
    this.once = !!spec.once;
    this.originX = (spec.origin && spec.origin.x) || 0;
    this.originY = (spec.origin && spec.origin.y) || 0;
    this.image = image;
    // playback state
    this.t = 0;
    this.index = 0;
    this.playing = false;
    this.done = false;
    this.speedScale = 1;
  }

  /** Seconds one frame lasts. */
  get frameTime() { return this.fps > 0 ? 1 / this.fps : 0; }

  restart() {
    this.t = 0;
    this.index = 0;
    this.done = false;
    this.playing = true;
  }

  /** Advance by dt (seconds). Returns true when the clip just finished. */
  update(dt) {
    if (!this.playing || this.frameTime <= 0) return false;
    this.t += dt * this.speedScale;
    let guard = 0;
    while (this.t >= this.frameTime && guard++ < 64) {
      this.t -= this.frameTime;
      if (this.index < this.frames - 1) this.index++;
      else if (this.loop) this.index = 0;
      else { this.done = true; this.playing = false; return true; }
    }
    return false;
  }

  /** The source rect of the current frame inside the sheet. */
  rect() {
    return {
      sx: (this.index % this.cols) * this.fw,
      sy: Math.floor(this.index / this.cols) * this.fh,
      w: this.fw,
      h: this.fh
    };
  }
}

class MegaSpriteAnimator {
  /**
   * @param {object} manifest parsed assets/bosses/megalodon/manifest.json
   * @param {object} [opts] { basePath, loader }
   */
  constructor(manifest, opts = {}) {
    this.basePath = opts.basePath || 'assets/bosses/megalodon';
    this.loader = opts.loader || null;          // (url) => Promise<image>
    this.specs = {};
    this.clips = {};
    this.order = [];
    for (const spec of (manifest && manifest.assets) || []) {
      this.specs[spec.animation] = spec;
      this.order.push(spec.animation);
    }
    this.current = null;
    this.flipped = false;
    this.ready = false;
  }

  /** Names of every clip this animator can play. */
  names() { return this.order.slice(); }

  /** Load every sheet exactly once. Resolves to this. */
  async load(onProgress) {
    const load = this.loader || defaultLoader;
    const todo = this.order.filter((n) => !this.clips[n]);
    for (let i = 0; i < todo.length; i++) {
      const name = todo[i];
      const spec = this.specs[name];
      const image = await load(this.basePath + '/' + spec.file);
      this.clips[name] = new MegaSpriteClip(spec, image);
      if (onProgress) onProgress(name, i + 1, todo.length);
    }
    this.ready = true;
    return this;
  }

  /**
   * Start a clip. Switching to the clip that is already running does nothing
   * (no restart), which is what stops the swim cycle stuttering when the boss
   * changes speed. `opts.once` forces a one-shot even for a looping clip.
   */
  play(name, opts = {}) {
    const clip = this.clips[name];
    if (!clip) return null;
    if (opts.once !== undefined) clip.once = !!opts.once;
    if (opts.fps !== undefined) clip.fps = opts.fps;
    if (opts.speed !== undefined) clip.speedScale = opts.speed;
    if (this.current === clip && !opts.restart) return clip;
    // leaving a one-shot early: rewind it so the next entry starts clean
    if (this.current && this.current !== clip && this.current.once) this.current.restart();
    this.current = clip;
    clip.restart();
    return clip;
  }

  /** Delta-time advance. Returns the name of the clip that just finished. */
  update(dt) {
    if (!this.current) return null;
    return this.current.update(dt) ? this.current.name : null;
  }

  /** Current frame for a `drawImage`-style renderer. */
  frame() {
    if (!this.current) return null;
    const r = this.current.rect();
    return {
      image: this.current.image,
      sx: r.sx, sy: r.sy, sw: r.w, sh: r.h,
      dw: r.w, dh: r.h,
      flipped: this.flipped,
      // draw anchor: the animal/effect centre, in cell pixels
      originX: this.current.originX,
      originY: this.current.originY,
      clip: this.current.name,
      index: this.current.index,
      done: this.current.done
    };
  }

  /** True while a one-shot clip is still playing. */
  busy() { return !!(this.current && !this.current.done && !this.current.loop); }

  setFlipped(v) { this.flipped = !!v; return this; }
  clip(name) { return this.clips[name] || null; }
}

/** Nearest-neighbour crispness, applied once per context. */
function pixelPerfect(ctx) {
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    if ('webkitImageSmoothingEnabled' in ctx) ctx.webkitImageSmoothingEnabled = false;
    if ('mozImageSmoothingEnabled' in ctx) ctx.mozImageSmoothingEnabled = false;
  }
}

/**
 * Browser default loader: a per-URL promise cache so two animators asking for
 * the same sheet share one decode.
 */
const _imgCache = new Map();
function defaultLoader(url) {
  if (_imgCache.has(url)) return _imgCache.get(url);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Megalodon pack: failed to load ' + url));
    img.decoding = 'sync';
    img.src = url;
  });
  _imgCache.set(url, p);
  return p;
}

/**
 * Draw one frame with the anchor at (x, y) and an optional uniform scale.
 * This is a convenience helper, not an engine: it is three ctx calls and can
 * be inlined into any existing renderer that prefers to do its own transform.
 */
function drawFrame(ctx, f, x, y, scale = 1) {
  if (!f || !f.image) return;
  const w = f.sw * scale, h = f.sh * scale;
  const left = x - f.originX * scale;
  const top = y - f.originY * scale;
  pixelPerfect(ctx);
  if (f.flipped) {
    ctx.save();
    ctx.translate(left + w, top);
    ctx.scale(-1, 1);
    ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, left, top, w, h);
  }
}

// Work in a browser or in the game's module-less script tags.
if (typeof window !== 'undefined') {
  window.MegaSpriteClip = MegaSpriteClip;
  window.MegaSpriteAnimator = MegaSpriteAnimator;
  window.megaPixelPerfect = pixelPerfect;
  window.megaDrawFrame = drawFrame;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MegaSpriteClip, MegaSpriteAnimator, pixelPerfect, drawFrame };
}
