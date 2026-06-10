/**
 * MapManager.js — Map Graph: Nodes, Edges, Package Generation
 *
 * Defines the 9-vertex graph overlaid on the isometric city map.
 * Vertex 0 is always the Hub "L". Vertices 1–8 are delivery platforms.
 *
 * Coordinates are stored as relative values [0..1] so they scale
 * automatically to any canvas size.
 */

export const DAYS_OF_WEEK = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
export const WEDNESDAY_CYCLE = 3; // day index (1-based) within a 7-day cycle

/** Raw relative node positions, calibrated to the isometric map image */
export const RAW_NODES = [
  { id: 0, label: 'L',  relX: 0.500, relY: 0.470 }, // Hub Central
  { id: 1, label: 'P1', relX: 0.210, relY: 0.220 }, // Nord-Oeste
  { id: 2, label: 'P2', relX: 0.500, relY: 0.140 }, // Norte
  { id: 3, label: 'P3', relX: 0.790, relY: 0.220 }, // Nord-Este
  { id: 4, label: 'P4', relX: 0.108, relY: 0.470 }, // Oeste
  { id: 5, label: 'P5', relX: 0.892, relY: 0.470 }, // Leste
  { id: 6, label: 'P6', relX: 0.210, relY: 0.730 }, // Sud-Oeste
  { id: 7, label: 'P7', relX: 0.500, relY: 0.820 }, // Sul
  { id: 8, label: 'P8', relX: 0.790, relY: 0.730 }, // Sud-Este
];

/** Adjacency list — edges shown visually on the map */
export const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
  [1,2],[2,3],[1,4],[3,5],[4,6],[5,8],[6,7],[7,8],
  [1,6],[3,8],[2,7],
];

/** Visual styles for the 4 package types */
export const PKG_TYPES = [
  { emoji: '📦', color: '#C2185B', name: 'Caixa Luxo M',    bg: 'rgba(194,24,91,0.22)'   },
  { emoji: '🔷', color: '#00F5FF', name: 'Núcleo Neon',     bg: 'rgba(0,245,255,0.14)'   },
  { emoji: '🎁', color: '#FF6EB4', name: 'Pilha Pastel',    bg: 'rgba(255,110,180,0.18)' },
  { emoji: '💎', color: '#BF5FFF', name: 'Cápsula Magenta', bg: 'rgba(191,95,255,0.18)'  },
];

let _pkgIdCounter = 0;

/**
 * Compute pixel positions for all nodes from relative coords + canvas size.
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 * @returns {Array<{id,label,relX,relY,x,y}>}
 */
export function computeNodes(W, H) {
  return RAW_NODES.map(n => ({ ...n, x: n.relX * W, y: n.relY * H }));
}

/**
 * Generate a fresh set of packages for a given day.
 * Wednesday rule: packages weight ×1.9 and value ×2.
 *
 * @param {number} day       - Current day (1-based)
 * @param {number} maxNodes  - Number of non-hub nodes (8)
 * @returns {Array} packages
 */
export function generatePackages(day, maxNodes = 8) {
  const isWednesday = day % 7 === WEDNESDAY_CYCLE;
  const count = 4 + Math.floor(Math.random() * 4); // 4–7 packages
  const usedDests = new Set([0]);
  const packages = [];

  for (let i = 0; i < count; i++) {
    const type = PKG_TYPES[Math.floor(Math.random() * PKG_TYPES.length)];
    let dest;
    do { dest = 1 + Math.floor(Math.random() * maxNodes); }
    while (usedDests.has(dest));
    usedDests.add(dest);

    let wgt = +(1 + Math.random() * 3.5).toFixed(1);
    let val = Math.floor(12 + Math.random() * 38);

    if (isWednesday) {
      wgt = +(wgt * 1.9).toFixed(1);
      val = Math.floor(val * 2);
    }

    packages.push({
      id:    ++_pkgIdCounter,
      name:  type.name,
      emoji: type.emoji,
      color: type.color,
      bg:    type.bg,
      wgt,
      val,
      dest,
    });
  }

  return packages;
}