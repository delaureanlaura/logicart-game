/**
 * Inventory.js — Gerenciamento da mochila do drone
 */
export class Inventory {
  constructor(maxWeight) {
    this.maxWeight = maxWeight;
    this._items    = [];
  }

  get items()         { return this._items; }
  get currentWeight() { return this._items.reduce((s, p) => s + p.wgt, 0); }
  get isEmpty()       { return this._items.length === 0; }

  has(id)          { return this._items.some(p => p.id === id); }
  wouldFit(wgt)    { return this.currentWeight + wgt <= this.maxWeight + 1e-9; }

  add(pkg) {
    if (!this.has(pkg.id)) this._items.push(pkg);
  }

  remove(id) {
    this._items = this._items.filter(p => p.id !== id);
  }

  clear() {
    this._items = [];
  }

  getDestinations() {
    return [...new Set(this._items.map(p => p.dest))];
  }

  getItemsForDest(destId) {
    return this._items.filter(p => p.dest === destId);
  }

  sortBy(key, dir = 'desc') {
    const sign = dir === 'asc' ? 1 : -1;
    this._items.sort((a, b) => {
      const va = key === 'density' ? a.val / a.wgt : a[key];
      const vb = key === 'density' ? b.val / b.wgt : b[key];
      return sign * (va - vb);
    });
  }
}
