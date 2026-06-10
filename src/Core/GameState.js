/**
 * GameState.js — Estado Global Persistente (via sessionStorage)
 *
 * Compartilhado entre todas as páginas HTML da campanha.
 * Usa sessionStorage para manter o estado durante a sessão.
 */

const KEY = 'logicart_save';

const DEFAULT_STATE = {
  money:   0,
  score:   0,
  totDel:  0,
  upgLv:   { bat: 0, trunk: 0, turbo: 0 },
  maxBat:  100,
  maxWgt:  10,
  speed:   110,
  missions: [
    { starCount: 0, unlocked: true  },
    { starCount: 0, unlocked: false },
    { starCount: 0, unlocked: false },
    { starCount: 0, unlocked: false },
    { starCount: 0, unlocked: false },
    { starCount: 0, unlocked: false },
    { starCount: 0, unlocked: false },
  ],
  // round context (set when entering a mission)
  currentMission: 0,
  roundEarned: 0,
  roundDels:   0,
  roundDist:   0,
  roundBatStart: 100,
  tspAlgo: '—',
  tspComp: '—',
};

/** Load state from sessionStorage, or return defaults */
export function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return structuredClone(DEFAULT_STATE);
}

/** Save state to sessionStorage */
export function saveState(state) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/** Reset all progress */
export function resetState() {
  sessionStorage.removeItem(KEY);
  return structuredClone(DEFAULT_STATE);
}

/** Update a specific mission's star count and unlock the next */
export function completeMission(state, missionIdx, stars) {
  const m = state.missions[missionIdx];
  m.starCount = Math.max(m.starCount, stars);

  // Unlock next mission if at least 1 star
  if (stars >= 1 && missionIdx + 1 < state.missions.length) {
    state.missions[missionIdx + 1].unlocked = true;
  }

  saveState(state);
  return state;
}
