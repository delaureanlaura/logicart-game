/**
 * kruskal.js — Algoritmo de Kruskal (Árvore Geradora Mínima)
 *
 * Usa Union-Find com path compression e union by rank.
 * Complexidade: O(E log E) — dominado pela ordenação das arestas.
 *
 * Aplicação no jogo:
 *   Calcula a rede de energia mínima do mapa.
 *   Segmentos de rota TSP que coincidem com arestas da MST
 *   recebem desconto de 15% no consumo de bateria.
 */

// ── Union-Find ──────────────────────────────────────
function makeUF(n) {
  return {
    parent: Array.from({ length: n }, (_, i) => i),
    rank:   new Int32Array(n),
  };
}

function find(uf, x) {
  while (uf.parent[x] !== x) {
    uf.parent[x] = uf.parent[uf.parent[x]]; // path compression
    x = uf.parent[x];
  }
  return x;
}

function union(uf, a, b) {
  const ra = find(uf, a), rb = find(uf, b);
  if (ra === rb) return false;
  if (uf.rank[ra] < uf.rank[rb])       uf.parent[ra] = rb;
  else if (uf.rank[ra] > uf.rank[rb])  uf.parent[rb] = ra;
  else { uf.parent[rb] = ra; uf.rank[ra]++; }
  return true;
}

// ── Kruskal ─────────────────────────────────────────
/**
 * @param {number}   nodeCount - total de nós
 * @param {{ a: number, b: number, w: number }[]} edges - arestas com peso
 * @returns {{ mst: Edge[], totalW: number, edgeSet: Set<string> }}
 */
export function kruskalMST(nodeCount, edges) {
  const sorted = [...edges].sort((x, y) => x.w - y.w);
  const uf  = makeUF(nodeCount);
  const mst = [];
  let totalW = 0;

  for (const e of sorted) {
    if (union(uf, e.a, e.b)) {
      mst.push(e);
      totalW += e.w;
      if (mst.length === nodeCount - 1) break;
    }
  }

  // Pre-build edge key set for O(1) lookup during TSP route evaluation
  const edgeSet = new Set(
    mst.map(e => `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`)
  );

  return { mst, totalW, edgeSet };
}

/**
 * Build edge list from RAW_NODES + EDGE_LIST using euclidean distances.
 * @param {Array} nodes  - computed nodes with {x, y}
 * @param {number[][]} edgeList - pairs [a, b]
 * @returns {{ a, b, w }[]}
 */
export function buildEdgesFromNodes(nodes, edgeList) {
  return edgeList.map(([a, b]) => {
    const na = nodes[a], nb = nodes[b];
    const dx = na.x - nb.x, dy = na.y - nb.y;
    const w  = Math.sqrt(dx * dx + dy * dy);
    return { a, b, w };
  });
}
