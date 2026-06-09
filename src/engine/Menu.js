/**
 * Menu.js — Title, Game Over and Victory screen helpers
 */

/**
 * Show the title screen, hide the game container.
 */
export function showTitle() {
  document.getElementById('title-screen').style.display = 'flex';
  document.getElementById('game-container').style.display = 'none';
}

/**
 * Hide the title screen, show the game container.
 */
export function hideTitle() {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'grid';
}