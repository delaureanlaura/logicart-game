/**
 * tspHeuristic.js — Vizinho Mais Próximo + 2-Opt
 *
 * Heurística TSP usada para n > 12 destinos.
 * Fase 1 — Vizinho Mais Próximo: O(n²)
 * Fase 2 — 2-Opt: O(n²) por passagem
 */
export function tspHeuristic(startId, visitIds, nodes) {
  if (visitIds.length === 0) return { route: [startId, startId], dist: 0, algo: 'N/A', comp: 'O(1)' };

  if (visitIds.length === 1) {
    const d = euclidean(nodes[startId], nodes[visitIds[0]])
            + euclidean(nodes[visitIds[0]], nodes[startId]);
    return { route: [startId, visitIds[0], startId], dist: d, algo: 'Vizinho Mais Próximo', comp: 'O(n²)' };
  }

  // Fase 1: Vizinho Mais Próximo
  const unvisited = [...visitIds];
  const tour      = [startId];
  let   current   = startId;

  while (unvisited.length > 0) {
    let ni = 0, nd = euclidean(nodes[current], nodes[unvisited[0]]);
    for (let i = 1; i < unvisited.length; i++) {
      const d = euclidean(nodes[current], nodes[unvisited[i]]);
      if (d < nd) { nd = d; ni = i; }
    }
    current = unvisited.splice(ni, 1)[0];
    tour.push(current);
  }
  tour.push(startId);

  // Fase 2: 2-Opt
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < tour.length - 2; i++) {
      for (let j = i + 1; j < tour.length - 1; j++) {
        const before = euclidean(nodes[tour[i - 1]], nodes[tour[i]])
                     + euclidean(nodes[tour[j]],     nodes[tour[j + 1]]);
        const after  = euclidean(nodes[tour[i - 1]], nodes[tour[j]])
                     + euclidean(nodes[tour[i]],     nodes[tour[j + 1]]);
        if (after < before - 1e-10) {
          let lo = i, hi = j;
          while (lo < hi) { [tour[lo], tour[hi]] = [tour[hi], tour[lo]]; lo++; hi--; }
          improved = true;
        }
      }
    }
  }

  const dist = tour.reduce((s, id, i) => i > 0 ? s + euclidean(nodes[tour[i - 1]], nodes[id]) : 0, 0);
  return { route: tour, dist, algo: 'Vizinho Mais Próximo + 2-Opt', comp: 'O(n²)' };
}

function euclidean(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
