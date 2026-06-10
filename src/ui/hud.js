/**
 * hud.js — Funções de atualização do HUD e painéis laterais
 * Todas as funções recebem dados e atualizam apenas o DOM.
 */
import { DAYS_OF_WEEK, WEDNESDAY_CYCLE } from '../Core/MapData.js';

// ── HUD superior ──────────────────────────────────────────────────────────────
export function updateHUD({ money, totDel, score, day, bat, maxBat }) {
  document.getElementById('s-money').textContent = '✦' + money;
  document.getElementById('s-del').textContent   = totDel;
  document.getElementById('s-score').textContent = score;

  const dn    = DAYS_OF_WEEK[(day - 1) % 7];
  const badge = document.getElementById('day-pill');
  badge.textContent = `DIA ${day} — ${dn}`;
  badge.className   = (day % 7 === WEDNESDAY_CYCLE) ? 'wednesday' : '';
  badge.id          = 'day-pill';

  updateBattery(bat, maxBat);
}

// ── Bateria ───────────────────────────────────────────────────────────────────
export function updateBattery(cur, max) {
  const pct  = Math.max(0, Math.min(100, (cur / max) * 100));
  const fill = document.getElementById('bat-fill');
  fill.style.width = pct + '%';
  document.getElementById('bat-txt').textContent = Math.round(cur) + '%';
  fill.className = 'bar-fill ' + (pct < 25 ? 'bar-danger' : 'bar-battery');
}

// ── Peso ──────────────────────────────────────────────────────────────────────
export function updateWeight(curW, maxW) {
  document.getElementById('wgt-cur').textContent = curW.toFixed(1) + ' kg';
  document.getElementById('wgt-max').textContent = maxW + ' kg';
  const pct  = Math.min(100, (curW / maxW) * 100);
  const fill = document.getElementById('wgt-fill');
  fill.style.width = pct + '%';
  fill.className   = 'bar-fill ' + (pct > 88 ? 'bar-danger' : 'bar-weight');
}

// ── Fase ──────────────────────────────────────────────────────────────────────
export function setPhaseUI(phase, invEmpty = false) {
  const el     = document.getElementById('phase-pill');
  const labels = { warehouse: '🏭 GALPÃO', flying: '🛸 VOANDO', done: '✅ ENTREGUE' };
  el.textContent = labels[phase] || phase;
  el.className   = phase;

  document.getElementById('btn-knap').disabled = phase !== 'warehouse';
  document.getElementById('btn-fly').disabled  = phase !== 'warehouse' || invEmpty;
  document.getElementById('btn-next').style.display = phase === 'done' ? 'inline-block' : 'none';
}

// ── Painel TSP ────────────────────────────────────────────────────────────────
export function updateTSPPanel(r) {
  document.getElementById('t-algo').textContent  = r?.algo  ?? '—';
  document.getElementById('t-comp').textContent  = r?.comp  ?? '—';
  document.getElementById('t-nodes').textContent = r?.route ? r.route.length - 1 : '—';
  document.getElementById('t-dist').textContent  = r?.dist  ? Math.round(r.dist) + 'px' : '—';
  document.getElementById('t-eff').textContent   = '—';
}

// ── Painel MST ────────────────────────────────────────────────────────────────
export function updateMSTPanel(mstResult) {
  document.getElementById('mst-edges').textContent = mstResult ? mstResult.mst.length : '—';
  document.getElementById('mst-cost').textContent  = mstResult ? Math.round(mstResult.totalW) + 'px' : '—';
  document.getElementById('mst-disc').textContent  = mstResult ? '−15% bat' : '—';
}

// ── Rota label ────────────────────────────────────────────────────────────────
export function setRouteLabel(text) {
  document.getElementById('route-lbl').textContent = text || '—';
}

// ── Log de missão ─────────────────────────────────────────────────────────────
const MAX_LOG = 40;
export function logMsg(msg, cls = '') {
  const el = document.getElementById('log-box');
  const d  = document.createElement('div');
  d.className   = 'le ' + cls;
  d.textContent = '▸ ' + msg;
  el.prepend(d);
  if (el.children.length > MAX_LOG) el.lastChild.remove();
}

// ── Lista de pacotes disponíveis ──────────────────────────────────────────────
export function renderPackages(avail, inventory, onToggle) {
  const el = document.getElementById('pkg-list');
  el.innerHTML = '';
  if (!avail.length) { el.innerHTML = '<div class="empty-note">Nenhum pacote</div>'; return; }

  avail.forEach(pkg => {
    const inInv = inventory.has(pkg.id);
    const over  = !inInv && !inventory.wouldFit(pkg.wgt);
    const card  = document.createElement('div');
    card.className = 'pkg-card' + (inInv ? ' sel' : '') + (over ? ' dis' : '');
    card.innerHTML = `
      <div class="pk-icon" style="background:${pkg.bg};border:1px solid ${pkg.color}">${pkg.emoji}</div>
      <div class="pk-info">
        <div class="pk-name">${pkg.name} → P${pkg.dest}</div>
        <div class="pk-meta"><span>⚖️${pkg.wgt}kg</span><span>💰✦${pkg.val}</span></div>
        <div class="pk-den">dens: ${(pkg.val / pkg.wgt).toFixed(1)}</div>
      </div>`;
    if (!over || inInv) card.onclick = () => onToggle(pkg);
    el.appendChild(card);
  });
}

// ── Inventário ────────────────────────────────────────────────────────────────
export function renderInventory(inventory) {
  const el = document.getElementById('inv-list');
  if (inventory.isEmpty) { el.innerHTML = '<div class="empty-note">Vazio</div>'; return; }
  el.innerHTML = '';
  inventory.items.forEach(p => {
    const d = document.createElement('div');
    d.className = 'inv-row';
    d.innerHTML = `<span>${p.emoji}</span><span style="flex:1;font-size:.65rem">${p.name}</span><span class="inv-dest">P${p.dest}</span>`;
    el.appendChild(d);
  });
}

// ── Upgrades ──────────────────────────────────────────────────────────────────
export function renderUpgrades(upgrades, levels, money, onBuy) {
  const el = document.getElementById('upg-list');
  el.innerHTML = '';
  upgrades.forEach(u => {
    const lv    = levels[u.id] || 0;
    const maxed = lv >= u.maxLv;
    const cost  = u.cost * (lv + 1);
    const div   = document.createElement('div');
    div.className = 'upg-item';
    div.innerHTML = `
      <div class="upg-name">${u.name}<span class="upg-lv">Nv${lv}/${u.maxLv}</span></div>
      <div class="upg-desc">${u.desc}</div>
      <div class="upg-row">
        <span class="upg-cost">${maxed ? 'MAX' : '✦' + cost}</span>
        <button class="btn btn-gold btn-xs" data-id="${u.id}" ${maxed || money < cost ? 'disabled' : ''}>${maxed ? '✓ MAX' : 'Comprar'}</button>
      </div>`;
    div.querySelector('[data-id]')?.addEventListener('click', () => onBuy(u.id));
    el.appendChild(div);
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function showModal(title, body, btns) {
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-body').textContent  = body;
  const bc = document.getElementById('m-btns');
  bc.innerHTML = '';
  btns.forEach(b => {
    const el = document.createElement('button');
    el.className   = 'btn ' + (b.cls || 'btn-primary');
    el.textContent = b.lbl;
    el.onclick = () => { document.getElementById('modal').classList.remove('open'); b.cb?.(); };
    bc.appendChild(el);
  });
  document.getElementById('modal').classList.add('open');
}
