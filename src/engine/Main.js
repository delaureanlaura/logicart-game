/**
 * main.js — Entry Point
 *
 * 1. Loads all image assets
 * 2. Waits for DOM ready
 * 3. Instantiates Game
 * 4. Wires up button click handlers
 * 5. Wires up canvas click
 */

import { Game }      from './core/Game.js';
import { hideTitle } from './ui/Menu.js';

// ── Asset paths ──────────────────────────────────────────────────────────────
// To use local files: change each src to a relative path, e.g. '../assets/1.png'
// The base64 data URIs are injected by the build script into index.html as
// window.ASSET_MAP, window.ASSET_DRONE, window.ASSET_PACKAGES, window.ASSET_PIN
function loadImages() {
  return new Promise(resolve => {
    const srcs = {
      map:      window.ASSET_MAP,
      drone:    window.ASSET_DRONE,
      packages: window.ASSET_PACKAGES,
      pin:      window.ASSET_PIN,
    };
    const images  = {};
    let   pending = Object.keys(srcs).length;

    Object.entries(srcs).forEach(([key, src]) => {
      const img = new Image();
      img.onload  = () => { images[key] = img; if (--pending === 0) resolve(images); };
      img.onerror = () => { images[key] = null; if (--pending === 0) resolve(images); };
      img.src = src;
    });
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const images = await loadImages();
  const canvas  = document.getElementById('gameCanvas');
  const game    = new Game(canvas, images);
  window.game   = game; // exposed for HTML button onclick handlers

  // ── Button: Start game (title screen) ──────────────────────────────────
  document.getElementById('btn-start-game').addEventListener('click', () => {
    hideTitle();
    game.start();
  });

  // ── Button: Optimise load (Knapsack) ───────────────────────────────────
  document.getElementById('btn-knap').addEventListener('click', () => {
    game.runKnapsack();
  });

  // ── Button: Start delivery (TSP) ───────────────────────────────────────
  document.getElementById('btn-fly').addEventListener('click', () => {
    game.startDelivery();
  });

  // ── Button: Next day ───────────────────────────────────────────────────
  document.getElementById('btn-next').addEventListener('click', () => {
    game.nextDay();
  });

  // ── Canvas click: select package node ──────────────────────────────────
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left)  * (canvas.width  / rect.width);
    const my   = (e.clientY - rect.top)   * (canvas.height / rect.height);
    game.handleCanvasClick(mx, my);
  });
});