
  // ==========================================================================
  // MODEL UTILITIES — the spine sampler's shared plumbing.
  //
  // `_hullPath` is the single source of truth for the silhouette: the live
  // body draws through it, and every charge ghost redraws through it with the
  // swim phase it had at snapshot time, so an afterimage is the same animal a
  // frame ago instead of a blob. `_spineBend/_bodyHalf/_spineAt` mirror the
  // render-time sampler exactly; render keeps its own closure for speed and
  // these exist so anything OUTSIDE the render frame (ghosts, QA, probes) can
  // ask the same questions about the same model.
  // ==========================================================================
  _hash01(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }

  _quadAt(p0, p1, p2, f) {
    const u = 1 - f;
    return {
      x: u * u * p0.x + 2 * u * f * p1.x + f * f * p2.x,
      y: u * u * p0.y + 2 * u * f * p1.y + f * f * p2.y
    };
  }

  _mixColor(a, b, t) {
    const k = Math.max(0, Math.min(1, t));
    const pa = this._rgb(a), pb = this._rgb(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * k);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * k);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  _rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  _traceSmooth(c, pts) {
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) * 0.5;
      const my = (pts[i].y + pts[i + 1].y) * 0.5;
      c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last.x, last.y);
  }

  /** One triangular tooth sitting on a jaw line. (x,y) is the base centre,
   *  (nx,ny) the unit direction the point aims INTO the gape. */
  _toothTri(c, x, y, nx, ny, len, halfW, fill) {
    const px = -ny, py = nx;                     // perpendicular of the aim
    const jag = (this._hash01(x * 0.37 + y * 0.11) - 0.5) * 0.9;
    c.fillStyle = fill;
    c.strokeStyle = 'rgba(13, 20, 36, 0.55)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x + px * halfW, y + py * halfW);
    c.lineTo(x - px * halfW, y - py * halfW);
    c.lineTo(x + nx * len + px * jag, y + ny * len + py * jag);
    c.closePath();
    c.fill();
    c.stroke();
  }

  /** The rig state the render integrates, snapshot for the trail ghosts. */
  _spineState() {
    const swing = this.tailSwing || 0;
    const dashing = !!this.dash;
    const spinning = this.tornadoT > 0;
    const waveAmp = 0.10 + Math.min(0.16, Math.abs(swing) * 0.006)
      + (dashing ? -0.05 : 0) + (spinning ? 0.22 : 0);
    return {
      waveAmp,
      wavePhase: (this.swimPhase || 0) * 0.85,
      tailBend: this.tailBend || 0,
      pitch: this.pitch || 0
    };
  }

  _spineBendAt(u, st) {
    const tailGain = Math.pow(1 - u, 1.7);
    return Math.sin(st.wavePhase - u * 2.7) * st.waveAmp * tailGain
      + st.tailBend * tailGain * 1.6
      + st.pitch * (1 - u) * 4
      + Math.sin(st.wavePhase * 1.7 - u * 4.2) * st.waveAmp * 0.22 * tailGain;
  }

  _bodyHalfAt(u) {
    const HH = this.height * 0.5;
    const swell = Math.sin(Math.min(1, 0.12 + u * 0.80) * Math.PI);
    const prof = 0.10 + 0.86 * Math.pow(Math.max(0, swell), 0.62);
    const noseTaper = u > 0.96 ? Math.max(0.74, 1 - (u - 0.96) * 6.5) : 1;
    const peduncle = u < 0.14 ? Math.max(0.42, u / 0.14) : 1;
    return HH * prof * noseTaper * peduncle;
  }

  _spineAt(u, off, st) {
    const HW = this.width * 0.5;
    const sx = -HW + u * this.width;
    const bend = this._spineBendAt(u, st);
    const half = this._bodyHalfAt(u);
    const reach = off < 0 ? off * half : off * half * 0.82;
    return { x: sx, y: bend * (1 - u) * 5 + reach, half };
  }

  /** The full silhouette loop in the body's local frame (nose right). */
  _hullPath(c, st) {
    const STEPS = 34;
    const loop = [this._spineAt(1.0, -0.55, st)];
    for (let i = 0; i <= STEPS; i++) loop.push(this._spineAt(1 - i / STEPS, -1.0, st));
    loop.push(this._spineAt(0.0, -0.12, st));
    for (let i = 0; i <= STEPS; i++) loop.push(this._spineAt(1 - i / STEPS, 1.0, st));
    loop.push(this._spineAt(1.0, 0.5, st));
    c.beginPath();
    this._traceSmooth(c, loop);
    c.closePath();
  }
