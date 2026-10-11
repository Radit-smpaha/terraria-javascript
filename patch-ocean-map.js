// Patch 3: enlarge the abyssal ocean -- more mainland islands, far more small
// islets scattered across the whole sea (not just the big gaps), so the world
// reads as a big archipelago instead of five lonely blobs.
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'ocean.js');
let src = fs.readFileSync(FILE, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');

function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) throw new Error('PATCH FAILED (not found): ' + label);
  src = src.replace(oldText, newText);
  console.log('  ok  ' + label);
}

// ---- A. mainland islands: more of them, spread tighter -------------------
apply('island count',
  `  const islandCount = 5 + Math.floor(Math.random() * 3);
  const islands = [];
  const minGap = 34;
  const margin = 24;
  const usable = Math.max(1, this.width - margin * 2);
  for (let i = 0; i < islandCount; i++) {
    // Evenly spaced with jitter, so no two islands ever merge into one blob.
    const base = margin + (usable * (i + 0.5)) / islandCount;
    const jitter = (Math.random() - 0.5) * (usable / islandCount) * 0.5;
    const cx = Math.max(margin, Math.min(this.width - margin - 1,
      Math.round(base + jitter)));
    if (islands.some(other => Math.abs(other.cx - cx) < minGap)) continue;
    const halfWidth = 9 + Math.floor(Math.random() * 9);
    const height = 6 + Math.floor(Math.random() * 9);
    islands.push({ cx, halfWidth, height });
  }`,
  `  // A bigger archipelago: more mainland islands, spread across the whole sea so
  // the planet feels like an ocean world, not a tank with five rocks in it.
  const islandCount = 9 + Math.floor(Math.random() * 4);
  const islands = [];
  const minGap = 26;
  const margin = 20;
  const usable = Math.max(1, this.width - margin * 2);
  for (let i = 0; i < islandCount; i++) {
    // Evenly spaced with jitter, so no two islands ever merge into one blob.
    const base = margin + (usable * (i + 0.5)) / islandCount;
    const jitter = (Math.random() - 0.5) * (usable / islandCount) * 0.6;
    const cx = Math.max(margin, Math.min(this.width - margin - 1,
      Math.round(base + jitter)));
    if (islands.some(other => Math.abs(other.cx - cx) < minGap)) continue;
    const halfWidth = 8 + Math.floor(Math.random() * 9);
    const height = 6 + Math.floor(Math.random() * 9);
    islands.push({ cx, halfWidth, height });
  }`);

// ---- B. islets: scatter small islands across the WHOLE sea ----------------
apply('islet scatter',
  `  // ---- Small stepping-stone islets -------------------------------------
  // The big islands sit far apart; a swimmer needs somewhere to surface and
  // stand mid-channel instead of drowning between them. These short, dry sand
  // bumps rise just above the waterline so you can hop across the sea. They
  // are terrain only \u2014 never the spawn, the boss, or a wreck.
  const islets = [];
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 44) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 96 ? [mid - gap * 0.16, mid + gap * 0.16] : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 18)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < 12)) continue;
      islets.push({ cx, halfWidth: 2 + Math.floor(Math.random() * 3),
        height: 3 + Math.floor(Math.random() * 3), islet: true });
    }
  }`,
  `  // ---- Small islands: a whole scattered archipelago --------------------
  // The big islands sit far apart; a swimmer needs somewhere to surface and
  // stand mid-channel instead of drowning between them. These short, low sand
  // bumps rise just above the waterline so you can hop across the sea. They
  // are terrain only \u2014 never the spawn, the boss, or a wreck. A dense scatter
  // runs across the WHOLE map (not just the big gaps), so the ocean reads as a
  // living archipelago full of little landmarks to dive between.
  const islets = [];
  const isletSpacing = 11;   // min tiles between any two small islands
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 30) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 70 ? [mid - gap * 0.22, mid - gap * 0.08, mid + gap * 0.08, mid + gap * 0.22]
      : gap > 44 ? [mid - gap * 0.15, mid + gap * 0.15]
        : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
      islets.push({ cx, halfWidth: 2 + Math.floor(Math.random() * 4),
        height: 2 + Math.floor(Math.random() * 4), islet: true });
    }
  }
  // A generous independent scatter fills the open water between the rows above
  // so no stretch of sea is ever featureless.
  for (let attempt = 0; attempt < this.width; attempt++) {
    const cx = margin + Math.floor(Math.random() * usable);
    if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
    if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
    islets.push({ cx, halfWidth: 1 + Math.floor(Math.random() * 3),
      height: 2 + Math.floor(Math.random() * 3), islet: true });
    if (islets.length >= 90) break;
  }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nOCEAN-MAP PATCH APPLIED to ' + FILE);
