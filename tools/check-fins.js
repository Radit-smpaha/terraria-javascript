// Quick geometry probe for the Megalodon's dorsal + pectoral fin polygons.
// Mirrors the exact math in new-megalodon.js render() so we can SEE whether the
// points describe a fin or a blob, without booting the whole game.
const W = 420, H = 200;
const HW = W * 0.5, HH = H * 0.5;

const bodyHalf = (u) => {
  const g = u < 0.60
    ? (0.56 + 0.44 * Math.sin((u / 0.60) * Math.PI * 0.5))
    : (1.0 - 0.16 * ((u - 0.60) / 0.40));
  const prof = 0.09 + 0.94 * Math.pow(g, 0.55);
  const noseTaper = u > 0.80
    ? Math.max(0.30, Math.sqrt(1 - Math.pow((u - 0.80) / 0.20, 1.35)))
    : 1;
  const peduncle = u < 0.15 ? Math.max(0.34, u / 0.15) : 1;
  return HH * prof * noseTaper * peduncle;
};
const spineBend = (u) => 0;
const spineAt = (u, off = 0) => {
  const sx = -HW + u * W;
  const bend = spineBend(u);
  const half = bodyHalf(u);
  const reach = off < 0 ? off * half : off * half * 0.82;
  return { x: sx, y: bend * (1 - u) * 5 + reach, half };
};

const report = (name, pts) => {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  console.log('\n' + name + ': ' + pts.length + ' pts');
  console.log('  x range ' + Math.min(...xs).toFixed(1) + ' .. ' + Math.max(...xs).toFixed(1) +
    '  (span ' + (Math.max(...xs) - Math.min(...xs)).toFixed(1) + ')');
  console.log('  y range ' + Math.min(...ys).toFixed(1) + ' .. ' + Math.max(...ys).toFixed(1) +
    '  (span ' + (Math.max(...ys) - Math.min(...ys)).toFixed(1) + ')');
};

// --- DORSAL (as currently written) ---
{
  const rootFront = spineAt(0.60, -0.92);
  const rootBack = spineAt(0.26, -0.96);
  const base = spineAt(0.43, 0);
  const bH = bodyHalf(0.43);
  const finH = bH * 1.95;
  const tipX = rootFront.x - 44;
  const tipY = base.y - finH;
  const notchX = base.x - 70;
  const notchY = base.y - bH * 0.30;
  const pts = [
    { x: rootFront.x + 4, y: rootFront.y + 3 },
    { x: rootFront.x - 16, y: rootFront.y - finH * 0.34 },
    { x: tipX, y: tipY },
    { x: tipX + 12, y: tipY + 12 },
    { x: notchX, y: notchY },
    { x: notchX + 10, y: notchY + bH * 0.10 },
    { x: rootBack.x, y: rootBack.y + 3 }
  ];
  console.log('bodyHalf(0.43) =', bH.toFixed(1), ' finH =', finH.toFixed(1));
  report('DORSAL outline', pts);
  // A fin should be: tall (y span large) AND the apex should be the topmost
  // point, and the leading edge should be monotonic rise from root to apex.
  console.log('  leading-edge rise/run:', ((tipY - (rootFront.y + 3)) / (tipX - (rootFront.x + 4))).toFixed(2));
  console.log('  apex is min y?', tipY === Math.min(...pts.map(p => p.y)));
}

// --- NEAR PECTORAL ---
{
  const rootA = spineAt(0.70, 0.90);
  const rootB = spineAt(0.58, 0.92);
  const mid = spineAt(0.635, 0);
  const wing = bodyHalf(0.635) * 1.5;
  const lead = { x: mid.x - 44, y: mid.y + wing * 0.34 };
  const wTip = { x: mid.x - 152, y: mid.y + wing * 1.18 };
  const pts = [rootB, lead, wTip, { x: mid.x - 66, y: mid.y + wing * 0.72 }, rootA];
  console.log('\nwing =', wing.toFixed(1));
  report('PECTORAL outline', pts);
}
