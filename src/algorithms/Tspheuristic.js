/**
 * tspHeuristic.js — Nearest Neighbour + 2-Opt Improvement
 *
 * Used as fallback when n > 12 (not needed in current game,
 * but included to fulfill the assignment requirement and for scalability).
 *
 * Nearest Neighbour: O(n²)
 * 2-Opt improvement: O(n²) per pass, typically a few passes
 * Combined: O(n²) practical runtime, good quality approximation
 *
 * @param {number}   startId   - Hub node index
 * @param {number[]} visitIds  - Nodes to visit
 * @param {Array}    nodes     - Array of {x, y} positions
 * @returns {{ route: number[], dist: number, algo: string, comp: string }}
 */
export function tspHeuristic(startId, visitIds, nodes) {
  if (visitIds.length === 0) return { route: [startId, startId], dist: 0, algo: 'N/A', comp: 'O(1)' };
  if (visitIds.length === 1) {
    const d = euclidean(nodes[startId], nodes[visitIds[0]])
            + euclidean(nodes[visitIds[0]], nodes[startId]);
    return { route: [startId, visitIds[0], startId], dist: d, algo: 'Nearest Neighbour', comp: 'O(n²)' };
  }

  // ── Phase 1: Nearest Neighbour greedy construction ───────────────────────
  const unvisited = [...visitIds];
  const tour = [startId];
  let current = startId;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = euclidean(nodes[current], nodes[unvisited[0]]);
    for (let i = 1; i < unvisited.length; i++) {
      const d = euclidean(nodes[current], nodes[unvisited[i]]);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    current = unvisited.splice(nearestIdx, 1)[0];
    tour.push(current);
  }
  tour.push(startId); // return to hub

  // ── Phase 2: 2-Opt improvement ───────────────────────────────────────────
  // Only improve the inner segment (exclude hub at positions 0 and last)
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < tour.length - 2; i++) {
      for (let j = i + 1; j < tour.length - 1; j++) {
        const before =
          euclidean(nodes[tour[i - 1]], nodes[tour[i]]) +
          euclidean(nodes[tour[j]],     nodes[tour[j + 1]]);
        const after =
          euclidean(nodes[tour[i - 1]], nodes[tour[j]]) +
          euclidean(nodes[tour[i]],     nodes[tour[j + 1]]);
        if (after < before - 1e-10) {
          // Reverse the segment between i and j
          let lo = i, hi = j;
          while (lo < hi) {
            [tour[lo], tour[hi]] = [tour[hi], tour[lo]];
            lo++; hi--;
          }
          improved = true;
        }
      }
    }
  }

  const dist = tourLength(tour, nodes);
  return {
    route: tour,
    dist,
    algo: 'Nearest Neighbour + 2-Opt',
    comp: 'O(n²)',
  };
}

/** Total tour distance */
function tourLength(tour, nodes) {
  let d = 0;
  for (let i = 0; i < tour.length - 1; i++) d += euclidean(nodes[tour[i]], nodes[tour[i + 1]]);
  return d;
}

function euclidean(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}