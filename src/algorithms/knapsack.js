/**
 * knapsack.js — Greedy Knapsack Heuristic (Value-Density Sorting)
 *
 * Solves the 0-1 Knapsack Problem approximately using a greedy approach:
 * sorts items by value/weight density descending, then picks items greedily.
 *
 * Why greedy instead of exact DP?
 *   - Items have fractional weights → exact DP requires scaling to integers
 *   - For the game's item counts (4–7 items) the greedy produces near-optimal results
 *   - O(n log n) vs O(n × W) — fast enough to run on every button press
 *   - The density metric is intuitive and teachable: "best value per kg wins"
 *
 * Complexity: O(n log n) — dominated by the sort step
 *
 * @param {{ id, wgt, val }[]} items   - Available items
 * @param {number}             capacity - Maximum weight allowed
 * @returns {{ selected: items[], totalVal: number, totalWgt: number }}
 */
export function greedyKnapsack(items, capacity) {
  // Sort by value density (value per unit weight) — descending
  const sorted = [...items].sort((a, b) => (b.val / b.wgt) - (a.val / a.wgt));

  const selected = [];
  let totalWgt = 0;
  let totalVal = 0;

  for (const item of sorted) {
    if (totalWgt + item.wgt <= capacity + 1e-9) {  // 1e-9 tolerance for float rounding
      selected.push(item);
      totalWgt += item.wgt;
      totalVal += item.val;
    }
  }

  return { selected, totalVal, totalWgt };
}