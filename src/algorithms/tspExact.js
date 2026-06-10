/**
 * tspExact.js — Held-Karp (TSP Exato via Programação Dinâmica + Bitmask)
 *
 * Resolve o Travelling Salesman Problem de forma EXATA.
 * Complexidade: O(2^n × n²) tempo | O(2^n × n) espaço
 * Adequado para n ≤ 15; o jogo usa no máximo n = 8 destinos.
 *
 * Estado: dp[mask][i] = custo mínimo de visitar o subconjunto
 * codificado por `mask`, terminando no nó i.
 */
export function tspExact(startId, visitIds, nodes) {
  const n = visitIds.length;

  if (n === 0) return { route: [startId, startId], dist: 0, algo: 'N/A', comp: 'O(1)' };

  if (n === 1) {
    const d = euclidean(nodes[startId], nodes[visitIds[0]])
            + euclidean(nodes[visitIds[0]], nodes[startId]);
    return { route: [startId, visitIds[0], startId], dist: d, algo: 'Held-Karp DP', comp: 'O(2¹×1²)' };
  }

  // Matriz de distâncias — índice 0 = hub, 1..n = visitIds
  const all = [startId, ...visitIds];
  const N   = all.length;
  const D   = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => euclidean(nodes[all[i]], nodes[all[j]]))
  );

  const INF  = Infinity;
  const FULL = (1 << n) - 1;
  const dp   = Array.from({ length: 1 << n }, () => new Float64Array(n).fill(INF));
  const par  = Array.from({ length: 1 << n }, () => new Int8Array(n).fill(-1));

  // Base: hub → cada nó individual
  for (let i = 0; i < n; i++) dp[1 << i][i] = D[0][i + 1];

  // Preenchimento de todos os subconjuntos
  for (let mask = 1; mask <= FULL; mask++) {
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last)) || dp[mask][last] === INF) continue;
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nm   = mask | (1 << next);
        const cost = dp[mask][last] + D[last + 1][next + 1];
        if (cost < dp[nm][next]) { dp[nm][next] = cost; par[nm][next] = last; }
      }
    }
  }

  // Melhor retorno ao hub
  let best = INF, bestL = 0;
  for (let i = 0; i < n; i++) {
    const t = dp[FULL][i] + D[i + 1][0];
    if (t < best) { best = t; bestL = i; }
  }

  // Reconstrução do caminho
  const path = [];
  let mask = FULL, cur = bestL;
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

function euclidean(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
