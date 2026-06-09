/**
 * tspExact.js — Held-Karp Algorithm (Exact TSP via Dynamic Programming + Bitmask)
 *
 * Solves the Travelling Salesman Problem exactly.
 * Complexity: O(2^n × n²) time  |  O(2^n × n) space
 * Suitable for n ≤ 15 destinations (game uses ≤ 8).
 *
 * @param {number}   startId   - Index of the start/hub node (always 0)
 * @param {number[]} visitIds  - Array of node IDs to visit
 * @param {Array}    nodes     - Array of {x, y} node positions (pixels)
 * @returns {{ route: number[], dist: number, algo: string, comp: string }}
 */
export function tspExact(startId, visitIds, nodes) {
  const n = visitIds.length;

  // ── Edge cases ──────────────────────────────────────────────────────────
  if (n === 0) {
    return { route: [startId, startId], dist: 0, algo: 'N/A', comp: 'O(1)' };
  }
  if (n === 1) {
    const d = euclidean(nodes[startId], nodes[visitIds[0]])
            + euclidean(nodes[visitIds[0]], nodes[startId]);
    return {
      route: [startId, visitIds[0], startId],
      dist: d,
      algo: 'Held-Karp DP',
      comp: 'O(2¹×1²)',
    };
  }

  // ── Build distance matrix ────────────────────────────────────────────────
  // Index 0 = hub (startId), indices 1..n = visitIds
  const all = [startId, ...visitIds];
  const N   = all.length;
  const D   = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => euclidean(nodes[all[i]], nodes[all[j]]))
  );

  // ── DP tables ────────────────────────────────────────────────────────────
  const INF  = Infinity;
  const FULL = (1 << n) - 1;

  // dp[mask][i]  = minimum cost to visit the subset encoded by `mask`, ending at visit-node i
  // par[mask][i] = predecessor visit-node index (for path reconstruction)
  const dp  = Array.from({ length: 1 << n }, () => new Float64Array(n).fill(INF));
  const par = Array.from({ length: 1 << n }, () => new Int8Array(n).fill(-1));

  // Base: travel from hub (index 0 in D) to each single visit node
  for (let i = 0; i < n; i++) {
    dp[1 << i][i] = D[0][i + 1];
  }

  // Fill DP — iterate over all subsets
  for (let mask = 1; mask <= FULL; mask++) {
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last))) continue;   // last not in subset
      if (dp[mask][last] === INF) continue;  // unreachable

      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;    // next already visited
        const newMask = mask | (1 << next);
        const cost    = dp[mask][last] + D[last + 1][next + 1];
        if (cost < dp[newMask][next]) {
          dp[newMask][next] = cost;
          par[newMask][next] = last;
        }
      }
    }
  }

  // ── Find best final node (add return-to-hub cost) ────────────────────────
  let best = INF, bestLast = 0;
  for (let i = 0; i < n; i++) {
    const total = dp[FULL][i] + D[i + 1][0];
    if (total < best) { best = total; bestLast = i; }
  }

  // ── Reconstruct path ─────────────────────────────────────────────────────
  const path = [];
  let mask = FULL, cur = bestLast;
  while (cur !== -1) {
    path.unshift(visitIds[cur]);
    const prev = par[mask][cur];
    mask ^= (1 << cur);
    cur = prev;
  }

  return {
    route: [startId, ...path, startId],
    dist:  best,
    algo:  'Held-Karp DP',
    comp:  `O(2^${n}×${n}²)`,
  };
}

/** Euclidean distance between two {x,y} points */
function euclidean(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}