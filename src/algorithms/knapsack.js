/**
 * knapsack.js — Mochila Gulosa por Densidade de Valor
 *
 * Ordena itens por val/wgt decrescente e seleciona gananciosamente.
 * Complexidade: O(n log n)
 */
export function greedyKnapsack(items, capacity) {
  const sorted = [...items].sort((a, b) => (b.val / b.wgt) - (a.val / a.wgt));
  const selected = [];
  let tw = 0, tv = 0;
  for (const item of sorted) {
    if (tw + item.wgt <= capacity + 1e-9) {
      selected.push(item);
      tw += item.wgt;
      tv += item.val;
    }
  }
  return { selected, totalVal: tv, totalWgt: tw };
}
