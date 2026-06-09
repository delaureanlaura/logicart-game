/**
 * Inventory.js — Inventory Abstract Data Type
 *
 * Stores items collected by the player. Provides:
 *   - add(item)       → O(1)
 *   - remove(id)      → O(n)
 *   - has(id)         → O(n)
 *   - clear()         → O(1)
 *   - getDestinations() → O(n), returns unique destination node IDs
 *   - sortBy(key)     → O(n log n) — Quicksort via Array.sort (2nd algorithm integration)
 *
 * The sortBy method integrates a second CS problem: in-place comparison sorting,
 * allowing players to organize packages by weight, value, or density.
 */
export class Inventory {
  constructor(maxWeight) {
    /** @type {Array} Stored items */
    this._items = [];
    /** @type {number} */
    this._maxWeight = maxWeight;
    /** @type {number} Running sum of item weights */
    this._currentWeight = 0;
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get items()         { return [...this._items]; }          // defensive copy
  get currentWeight() { return this._currentWeight; }
  get maxWeight()     { return this._maxWeight; }
  set maxWeight(v)    { this._maxWeight = v; }
  get count()         { return this._items.length; }
  get isEmpty()       { return this._items.length === 0; }
  get isFull()        { return this._currentWeight >= this._maxWeight - 1e-9; }

  // ── Core Operations ──────────────────────────────────────────────────────

  /**
   * Add an item. Returns false if it exceeds capacity.
   * @param {{ id, name, wgt, val, dest, emoji }} item
   * @returns {boolean} success
   */
  add(item) {
    if (this._currentWeight + item.wgt > this._maxWeight + 1e-9) return false;
    this._items.push({ ...item });   // store a copy
    this._currentWeight = +(this._currentWeight + item.wgt).toFixed(2);
    return true;
  }

  /**
   * Remove item by id. Returns the removed item or null.
   * @param {number} id
   * @returns {object|null}
   */
  remove(id) {
    const idx = this._items.findIndex(x => x.id === id);
    if (idx === -1) return null;
    const [removed] = this._items.splice(idx, 1);
    this._currentWeight = +(this._currentWeight - removed.wgt).toFixed(2);
    if (this._currentWeight < 0) this._currentWeight = 0; // float-safety
    return removed;
  }

  /**
   * Check if an item with the given id exists.
   * @param {number} id
   * @returns {boolean}
   */
  has(id) {
    return this._items.some(x => x.id === id);
  }

  /** Remove all items. */
  clear() {
    this._items = [];
    this._currentWeight = 0;
  }

  /**
   * Returns unique destination node IDs of items in the inventory.
   * @returns {number[]}
   */
  getDestinations() {
    return [...new Set(this._items.map(x => x.dest))];
  }

  /**
   * Returns items that belong to a given destination node.
   * @param {number} destId
   * @returns {Array}
   */
  getItemsForDest(destId) {
    return this._items.filter(x => x.dest === destId);
  }

  // ── Second Algorithm: Comparison Sorting ────────────────────────────────
  /**
   * Sort inventory items in-place by a given key.
   * Uses JS engine's native sort (TimSort / QuickSort hybrid — O(n log n)).
   * Exposed as a UI feature ("Organizar inventário").
   *
   * @param {'val'|'wgt'|'density'|'dest'} key - Sort criterion
   * @param {'asc'|'desc'} order
   */
  sortBy(key = 'val', order = 'desc') {
    const dir = order === 'desc' ? -1 : 1;
    this._items.sort((a, b) => {
      let va, vb;
      if (key === 'density') { va = a.val / a.wgt; vb = b.val / b.wgt; }
      else                   { va = a[key];         vb = b[key]; }
      return dir * (va - vb);
    });
  }

  /**
   * Check if an item WOULD fit (does not add it).
   * @param {number} wgt
   * @returns {boolean}
   */
  wouldFit(wgt) {
    return this._currentWeight + wgt <= this._maxWeight + 1e-9;
  }

  /** @returns {number} Remaining weight capacity */
  get remaining() {
    return +(this._maxWeight - this._currentWeight).toFixed(2);
  }
}