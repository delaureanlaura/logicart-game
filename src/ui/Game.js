/**
 * ui/Game.js — HUD rendering & modal helpers
 *
 * Pure DOM functions that render game state to the HTML interface.
 * Exported so src/engine/Game.js can import them as a clean dependency.
 */

import { DAYS_OF_WEEK, WEDNESDAY_CYCLE } from '../engine/MapManager.js';

// ── Battery ──────────────────────────────────────────────────────────────────
export function updateBattery(cur, max) {
  const pct  = Math.max(0, Math.min(100, (cur / max) * 100));
  const fill = document.getElementById('bat-fill');
  fill.style.width = pct + '%';
  document.getElementById('bat-txt').textContent = Math.round(cur) + '%';
  fill.style.background = pct < 25
    ? 'linear-gradient(90deg,#FF6B6B,#FF1F8E)'
    : pct < 50
    ? 'linear-gradient(90deg,#FF8C00,#FFD700)'
    : 'linear-gradient(90deg,#FF1F8E,#FFD700)';
}

// ── Weight ───────────────────────────────────────────────────────────────────
export function updateWeight(cur, max) {
  document.getElementById('wgt-cur').textContent = cur.toFixed(1) + ' kg';
  document.getElementById('wgt-max').textContent = max + ' kg';
  const pct  = Math.min(100, (cur / max) * 100);
  const fill = document.getElementById('wgt-fill');
  fill.style.width = pct + '%';
  fill.style.background = pct > 88
    ? 'linear-gradient(90deg,#FF6B6B,#FF1F8E)'
    : 'linear-gradient(90deg,#BF5FFF,#00F5FF)';
}

// ── Top HUD (money / deliveries / score / day badge) ─────────────────────────
export function updateHUD(G) {
  document.getElementById('s-money').textContent = '✦' + G.money;
  document.getElementById('s-del').textContent   = G.totDel;
  document.getElementById('s-score').textContent = G.score;
  const dn    = DAYS_OF_WEEK[(G.day - 1) % 7];
  const badge = document.getElementById('day-badge');
  badge.textContent = `DIA ${G.day} — ${dn}`;
  badge.className   = G.day % 7 === WEDNESDAY_CYCLE ? 'wednesday' : '';
  badge.id          = 'day-badge';
  updateBattery(G.bat, G.maxBat);
}

// ── Phase pill + button states ────────────────────────────────────────────────
export function setPhaseUI(phase) {
  const el     = document.getElementById('phase-pill');
  const labels = { warehouse: '🏭 GALPÃO', flying: '🛸 VOANDO', done: '✅ ENTREGUE' };
  el.textContent = labels[phase] || phase;
  el.className   = phase;
  document.getElementById('btn-knap').disabled        = phase !== 'warehouse';
  document.getElementById('btn-fly').disabled         = phase !== 'warehouse';
  document.getElementById('btn-next').style.display   = phase === 'done' ? 'inline-block' : 'none';
}

// ── TSP info panel ───────────────────────────────────────────────────────────
export function updateTSPPanel(r) {
  document.getElementById('t-algo').textContent  = r?.algo  ?? '—';
  document.getElementById('t-comp').textContent  = r?.comp  ?? '—';
  document.getElementById('t-nodes').textContent = r?.route ? r.route.length - 1 : '—';
  document.getElementById('t-dist').textContent  = r?.dist  ? Math.round(r.dist) + 'px' : '—';
  document.getElementById('t-eff').textContent   = '—';
}

// ── Activity log ─────────────────────────────────────────────────────────────
const MAX_LOG = 40;
export function log(msg, cls = '') {
  const el = document.getElementById('log-box');
  const d  = document.createElement('div');
  d.className   = 'le ' + cls;
  d.textContent = '▸ ' + msg;
  el.prepend(d);
  if (el.children.length > MAX_LOG) el.lastChild.remove();
}

// ── Package list ─────────────────────────────────────────────────────────────
export function renderPackages(packages, inventory, onToggle) {
  const el = document.getElementById('pkg-list');
  el.innerHTML = '';
  if (!packages.length) {
    el.innerHTML = '<div class="empty-note">Nenhum pacote</div>';
    return;
  }
  packages.forEach(pkg => {
    const inInv = inventory.has(pkg.id);
    const over  = !inInv && !inventory.wouldFit(pkg.wgt);
    const card  = document.createElement('div');
    card.className = 'pkg-card' + (inInv ? ' selected' : '') + (over ? ' disabled' : '');
    card.innerHTML = `
      <div class="pkg-icon" style="background:${pkg.bg};border:1px solid ${pkg.color}">${pkg.emoji}</div>
      <div class="pkg-info">
        <div class="pkg-name">${pkg.name} → P${pkg.dest}</div>
        <div class="pkg-meta"><span>⚖️${pkg.wgt}kg</span><span>💰✦${pkg.val}</span></div>
        <div class="pkg-dens">dens: ${(pkg.val / pkg.wgt).toFixed(1)}</div>
      </div>`;
    if (!over || inInv) card.onclick = () => onToggle(pkg);
    el.appendChild(card);
  });
}

// ── Inventory list ───────────────────────────────────────────────────────────
export function renderInventory(inventory) {
  const el = document.getElementById('inv-list');
  if (inventory.isEmpty) {
    el.innerHTML = '<div class="empty-note">Vazio</div>';
    return;
  }
  el.innerHTML = '';
  inventory.items.forEach(p => {
    const d = document.createElement('div');
    d.className = 'inv-row';
    d.innerHTML = `<span>${p.emoji}</span><span style="flex:1;font-size:.67rem">${p.name}</span><span class="inv-dest">P${p.dest}</span>`;
    el.appendChild(d);
  });
}

// ── Upgrades panel ───────────────────────────────────────────────────────────
export function renderUpgrades(upgrades, levels, money, onBuy) {
  const el = document.getElementById('upg-list');
  el.innerHTML = '';
  upgrades.forEach(u => {
    const lv    = levels[u.id] || 0;
    const maxed = lv >= u.maxLv;
    const cost  = u.cost * (lv + 1);
    const div   = document.createElement('div');
    div.className = 'upg';
    div.innerHTML = `
      <div class="upg-name">${u.name} <span style="font-size:.58rem;color:var(--pink-mid)">Nv${lv}/${u.maxLv}</span></div>
      <div class="upg-desc">${u.desc}</div>
      <div class="upg-row">
        <span class="upg-cost">${maxed ? 'MAX' : '✦' + cost}</span>
        <button class="btn btn-g btn-sm" data-upg="${u.id}" ${maxed || money < cost ? 'disabled' : ''}>${maxed ? '✓ MAX' : 'Comprar'}</button>
      </div>`;
    div.querySelector('[data-upg]')?.addEventListener('click', () => onBuy(u.id));
    el.appendChild(div);
  });
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function showModal(title, body, buttons) {
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-body').textContent  = body;
  const bc = document.getElementById('modal-btns');
  bc.innerHTML = '';
  buttons.forEach(b => {
    const el       = document.createElement('button');
    el.className   = 'btn ' + (b.cls || 'btn-p');
    el.textContent = b.lbl;
    el.onclick     = () => {
      document.getElementById('modal').classList.remove('on');
      b.cb?.();
    };
    bc.appendChild(el);
  });
  document.getElementById('modal').classList.add('on');
}

// ── Route label ──────────────────────────────────────────────────────────────
export function setRouteLabel(t) {
  document.getElementById('route-lbl').textContent = t || '—';
}
