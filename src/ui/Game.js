/**
 * Game.js — Main Game Engine
 *
 * Owns the game state, the canvas render loop, and coordinates
 * all modules (algorithms, inventory, map, HUD).
 *
 * State machine phases:
 *   'warehouse' → player loads packages (Knapsack phase)
 *   'flying'    → drone follows TSP route automatically
 *   'done'      → round complete, waiting for "next day"
 */

import { tspExact }       from '../algorithms/tspExact.js';
import { tspHeuristic }   from '../algorithms/tspHeuristic.js';
import { greedyKnapsack } from '../algorithms/Knapsack.js';
import { Inventory }      from './Inventory.js';
import {
  computeNodes, generatePackages,
  RAW_NODES, EDGES, DAYS_OF_WEEK, WEDNESDAY_CYCLE,
} from './MapManager.js';
import {
  updateBattery, updateWeight, updateHUD, setPhaseUI,
  updateTSPPanel, log, renderPackages, renderInventory,
  renderUpgrades, showModal, setRouteLabel,
} from '../ui/Hud.js';

// ── Upgrade definitions ──────────────────────────────────────────────────────
const UPGRADES = [
  {
    id: 'bat',   name: '🔋 Bateria de Titânio Rosa',
    desc: 'Bateria máx. +30 pts', cost: 80, maxLv: 3,
    apply: G => { G.maxBat += 30; G.bat = Math.min(G.bat, G.maxBat); },
  },
  {
    id: 'trunk', name: '🧳 Porta-Malas Estendido',
    desc: 'Capacidade de peso +5 kg', cost: 60, maxLv: 3,
    apply: G => { G.maxWgt += 5; G.inventory.maxWeight = G.maxWgt; },
  },
  {
    id: 'turbo', name: '🚀 Propulsor Turbo Fúcsia',
    desc: 'Velocidade do drone ×1.4', cost: 100, maxLv: 3,
    apply: G => { G.speed *= 1.4; },
  },
];

// ── TSP threshold: use exact below this, heuristic above ────────────────────
const TSP_EXACT_THRESHOLD = 12;

// ── Battery consumption calibration ─────────────────────────────────────────
// Battery is 0–100 (percentage points).
// We convert TSP distance (pixels) to battery cost by normalising against
// the canvas diagonal, then scaling so a "typical" 3-stop route costs ~25%.
// CANVAS_DIAG_FACTOR is computed at delivery time from actual canvas size.
const BATTERY_SCALE = 0.55; // tune: fraction of diagonal = 100% battery

export class Game {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.images = images; // { map, drone, packages, pin }

    // ── Persistent state ───────────────────────────────────────────────────
    this.money    = 0;
    this.score    = 0;
    this.totDel   = 0;
    this.day      = 1;
    this.upgLv    = { bat: 0, trunk: 0, turbo: 0 };

    // ── Per-session upgradeable values ────────────────────────────────────
    this.maxBat  = 100;
    this.bat     = 100;
    this.maxWgt  = 10;
    this.speed   = 110; // relative units/sec (normalised to canvas diagonal)

    // ── Round state ───────────────────────────────────────────────────────
    this.phase     = 'warehouse';
    this.avail     = [];
    this.inventory = new Inventory(this.maxWgt);
    this.nodes     = [];   // populated on every render frame
    this.tspResult = null; // last TSP solve result

    // ── Drone animation ───────────────────────────────────────────────────
    this.droneRel  = { x: 0.500, y: 0.470 }; // relative [0..1] coords
    this.routeIdx  = 0;
    this.moving    = false;
    this._lastT    = 0;

    this._bindButtons();
  }

  // ── Public: start a new game ─────────────────────────────────────────────
  start() {
    this.bat = this.maxBat;
    this._newRound();
    requestAnimationFrame(ts => this._renderLoop(ts));
  }

  // ── Internal: begin a new round ─────────────────────────────────────────
  _newRound() {
    this.avail     = generatePackages(this.day);
    this.inventory.clear();
    this.tspResult = null;
    this.droneRel  = { x: RAW_NODES[0].relX, y: RAW_NODES[0].relY };
    this.moving    = false;
    this.routeIdx  = 0;

    this._refreshAll();
    setPhaseUI('warehouse');
    document.getElementById('btn-fly').disabled = true;
    setRouteLabel('—');
    updateTSPPanel(null);

    const isWed = this.day % 7 === WEDNESDAY_CYCLE;
    if (isWed) {
      log('🌸 ÀS QUARTAS USAMOS ROSA! Pacotes ×2 valor e peso!', 'warn');
      showModal(
        '🌸 QUARTA-FEIRA ROSA',
        'Às quartas usamos rosa! Os pacotes valem o DOBRO — mas são muito mais pesados. O algoritmo da mochila vai trabalhar no limite!',
        [{ lbl: '💪 BORA!', cls: 'btn-p' }]
      );
    } else {
      log(`📅 Dia ${this.day} — ${DAYS_OF_WEEK[(this.day - 1) % 7]}`);
    }
  }

  // ── Action: toggle package in/out of inventory ───────────────────────────
  togglePackage(pkg) {
    if (this.phase !== 'warehouse') return;

    if (this.inventory.has(pkg.id)) {
      this.inventory.remove(pkg.id);
      log(`Removido: ${pkg.name}`);
    } else {
      if (!this.inventory.wouldFit(pkg.wgt)) {
        log('⚠️ Peso máximo atingido!', 'warn');
        return;
      }
      this.inventory.add(pkg);
      log(`Adicionado: ${pkg.name} → P${pkg.dest}`);
    }

    this._refreshInventoryAndPkgs();
    document.getElementById('btn-fly').disabled = this.inventory.isEmpty;
  }

  // ── Action: run Knapsack optimisation ────────────────────────────────────
  runKnapsack() {
    if (this.phase !== 'warehouse') return;

    const { selected, totalVal } = greedyKnapsack(this.avail, this.maxWgt);
    this.inventory.clear();
    selected.forEach(p => this.inventory.add(p));

    log(
      `🧮 Knapsack: ${selected.length} pacotes | lucro=✦${totalVal} | peso=${this.inventory.currentWeight.toFixed(1)}kg`,
      'ok'
    );

    this._refreshInventoryAndPkgs();
    document.getElementById('btn-fly').disabled = this.inventory.isEmpty;
  }

  // ── Action: run TSP and start delivery ───────────────────────────────────
  startDelivery() {
    if (this.inventory.isEmpty) return;

    const dests = this.inventory.getDestinations();

    // Choose algorithm based on destination count
    const result = dests.length <= TSP_EXACT_THRESHOLD
      ? tspExact(0, dests, this.nodes)
      : tspHeuristic(0, dests, this.nodes);

    this.tspResult = result;
    updateTSPPanel(result);

    // ── Battery cost calculation (FIXED) ─────────────────────────────────
    // Normalise pixel distance against the canvas diagonal so the result
    // is always a meaningful percentage regardless of window size.
    const diag    = Math.hypot(this.canvas.width, this.canvas.height);
    const consume = (result.dist / diag) * 100 * BATTERY_SCALE;

    if (consume > this.bat) {
      showModal(
        '⚠️ BATERIA INSUFICIENTE',
        `A rota exige ~${Math.round(consume)}% de bateria. Você tem ${Math.round(this.bat)}%. Remova alguns pacotes ou compre upgrades de bateria!`,
        [{ lbl: 'OK', cls: 'btn-s' }]
      );
      return;
    }

    const routeStr = result.route.map(id => id === 0 ? 'L' : 'P' + id).join(' → ');
    setRouteLabel('🛸 ' + routeStr);
    log(`🗺️ TSP (${result.algo}): ${routeStr}`, 'ok');
    log(`📏 ${Math.round(result.dist)}px | bateria: -${Math.round(consume)}%`);

    setPhaseUI('flying');
    this.phase    = 'flying';
    this.routeIdx = 0;
    this.moving   = true;
    this._lastT   = performance.now();

    // Store per-segment battery drain for the fly loop
    this._diag    = diag;
    this._batScale = BATTERY_SCALE;

    requestAnimationFrame(ts => this._flyLoop(ts));
  }

  // ── Action: buy upgrade ──────────────────────────────────────────────────
  buyUpgrade(id) {
    const u  = UPGRADES.find(x => x.id === id);
    if (!u) return;
    const lv   = this.upgLv[id] || 0;
    if (lv >= u.maxLv) return;
    const cost = u.cost * (lv + 1);
    if (this.money < cost) { log('💸 Créditos insuficientes!', 'err'); return; }

    this.money -= cost;
    this.upgLv[id] = lv + 1;
    u.apply(this);

    log(`💅 Upgrade: ${u.name} Nv${lv + 1}`, 'ok');
    updateHUD(this);
    renderUpgrades(UPGRADES, this.upgLv, this.money, id => this.buyUpgrade(id));
  }

  // ── Action: advance to next day ──────────────────────────────────────────
  nextDay() {
    this.day++;
    this.bat = this.maxBat; // recharge
    this._newRound();
    setPhaseUI('warehouse');
    document.getElementById('btn-fly').disabled = true;
  }

  // ── Drone flight animation loop ──────────────────────────────────────────
  _flyLoop(ts) {
    if (!this.moving) return;

    const dt    = Math.min(0.06, (ts - this._lastT) / 1000);
    this._lastT = ts;

    const route = this.tspResult.route;
    if (this.routeIdx >= route.length - 1) {
      this._finishRoute();
      return;
    }

    const nextId  = route[this.routeIdx + 1];
    const tgtNode = this.nodes[nextId];
    if (!tgtNode) { this.moving = false; return; }

    const W = this.canvas.width, H = this.canvas.height;
    const tRelX = tgtNode.x / W, tRelY = tgtNode.y / H;
    const dx = tRelX - this.droneRel.x;
    const dy = tRelY - this.droneRel.y;
    const d  = Math.sqrt(dx * dx + dy * dy);

    // speed is in "canvas-diagonal-units / second"
    const step = (this.speed / 100) * dt * 0.55;

    if (d <= step) {
      // Arrived at next node
      this.droneRel.x = tRelX;
      this.droneRel.y = tRelY;
      const arrivedId = route[++this.routeIdx];

      // Deliver packages for this node
      if (arrivedId !== 0) {
        const toDeliver = this.inventory.getItemsForDest(arrivedId);
        toDeliver.forEach(p => {
          this.money  += p.val;
          this.score  += p.val;
          this.totDel += 1;
          this.inventory.remove(p.id);
          log(`✅ P${arrivedId}: ${p.name} +✦${p.val}`, 'ok');
        });
        renderInventory(this.inventory);
        updateHUD(this);
      }

      // Drain battery proportional to THIS segment's pixel distance
      const prevNode = this.nodes[route[this.routeIdx - 1]];
      const curNode  = this.nodes[arrivedId] || prevNode;
      const segPx    = Math.hypot(curNode.x - prevNode.x, curNode.y - prevNode.y);
      const segCost  = (segPx / this._diag) * 100 * this._batScale;
      this.bat = Math.max(0, this.bat - segCost);
      updateBattery(this.bat, this.maxBat);

      // Battery dead mid-route?
      if (this.bat <= 0 && this.routeIdx < route.length - 1) {
        this.moving = false;
        this.phase  = 'done';
        setPhaseUI('done');
        showModal(
          '💀 BATERIA ESGOTADA!',
          'O drone caiu antes de terminar a rota! Pacotes não entregues foram perdidos. Invista em upgrades de bateria!',
          [{ lbl: '😭 Próximo Dia', cls: 'btn-p', cb: () => this.nextDay() }]
        );
        return;
      }
    } else {
      this.droneRel.x += (dx / d) * step;
      this.droneRel.y += (dy / d) * step;
    }

    requestAnimationFrame(ts => this._flyLoop(ts));
  }

  _finishRoute() {
    this.moving = false;
    this.phase  = 'done';
    setPhaseUI('done');
    log('🏁 Missão concluída! Retornou ao Hub L.', 'ok');
    showModal(
      '✨ ENTREGA COMPLETA!',
      `Todas as entregas realizadas! Créditos acumulados: ✦${this.money}. Prepare-se para o próximo dia!`,
      [
        { lbl: '📅 Próximo Dia',  cls: 'btn-p', cb: () => this.nextDay() },
        { lbl: '🛍️ Ver Upgrades', cls: 'btn-s' },
      ]
    );
  }

  // ── Main render loop ─────────────────────────────────────────────────────
  _renderLoop(ts) {
    this._resize();
    this.nodes = computeNodes(this.canvas.width, this.canvas.height);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this._drawMap();
    this._drawEdges();
    this._drawRoute();
    this._drawNodes();
    this._drawDrone(ts);

    requestAnimationFrame(ts => this._renderLoop(ts));
  }

  // ── Rendering helpers ────────────────────────────────────────────────────
  _resize() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (this.canvas.width  !== wrapper.clientWidth ||
        this.canvas.height !== wrapper.clientHeight) {
      this.canvas.width  = wrapper.clientWidth;
      this.canvas.height = wrapper.clientHeight;
    }
  }

  _drawMap() {
    const { ctx, canvas, images } = this;
    const img = images.map;
    if (img?.complete && img.naturalWidth > 0) {
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * 0.97;
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    } else {
      // Fallback gradient
      const g = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 40, canvas.width/2, canvas.height/2, canvas.width * 0.7);
      g.addColorStop(0, '#2D0050'); g.addColorStop(1, '#0D0018');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  _drawEdges() {
    const { ctx, nodes } = this;
    ctx.save();
    ctx.strokeStyle  = 'rgba(191,95,255,0.14)';
    ctx.lineWidth    = 1.5;
    ctx.setLineDash([5, 8]);
    EDGES.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawRoute() {
    const route = this.tspResult?.route;
    if (!route || route.length < 2) return;
    const { ctx, nodes } = this;

    // Glow pass
    ctx.save();
    ctx.lineWidth = 10;
    for (let i = 0; i < route.length - 1; i++) {
      const a = nodes[route[i]], b = nodes[route[i + 1]];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(0,245,255,0.16)';
      ctx.stroke();
    }

    // Core line + arrows
    ctx.lineWidth = 2.5;
    for (let i = 0; i < route.length - 1; i++) {
      const a = nodes[route[i]], b = nodes[route[i + 1]];
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, '#FF1F8E'); grad.addColorStop(0.5, '#00F5FF'); grad.addColorStop(1, '#FF1F8E');
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grad; ctx.stroke();

      // Arrow at midpoint
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(ang);
      ctx.fillStyle = '#00F5FF';
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Step number
      const perp = ang + Math.PI / 2;
      ctx.fillStyle = 'rgba(0,245,255,0.85)';
      ctx.font = 'bold 10px Orbitron,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, mx + 13 * Math.cos(perp), my + 13 * Math.sin(perp));
    }
    ctx.restore();
  }

  _drawNodes() {
    const { ctx, nodes, images, tspResult, inventory } = this;
    const route    = tspResult?.route ?? [];
    const invDests = inventory.getDestinations();

    nodes.forEach((n, id) => {
      const isHub  = id === 0;
      const isDest = route.includes(id) && id !== 0;
      const inInv  = invDests.includes(id);
      const r      = isHub ? 20 : 13;

      ctx.save();
      ctx.shadowBlur  = isHub ? 28 : 14;
      ctx.shadowColor = isHub ? '#FFD700' : isDest ? '#00F5FF' : '#FF1F8E';
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

      if (isHub) {
        const g = ctx.createRadialGradient(n.x,n.y,2,n.x,n.y,r);
        g.addColorStop(0,'#FF1F8E'); g.addColorStop(1,'#6A0080'); ctx.fillStyle=g;
      } else if (isDest) {
        const g = ctx.createRadialGradient(n.x,n.y,2,n.x,n.y,r);
        g.addColorStop(0,'#00F5FF'); g.addColorStop(1,'#003B44'); ctx.fillStyle=g;
      } else if (inInv) {
        const g = ctx.createRadialGradient(n.x,n.y,2,n.x,n.y,r);
        g.addColorStop(0,'#BF5FFF'); g.addColorStop(1,'#2D0050'); ctx.fillStyle=g;
      } else {
        ctx.fillStyle = 'rgba(45,0,80,0.65)';
      }
      ctx.fill();
      ctx.strokeStyle = isHub ? '#FFD700' : isDest ? '#00F5FF' : inInv ? '#BF5FFF' : 'rgba(255,31,142,0.4)';
      ctx.lineWidth = isHub ? 2.5 : 1.8;
      ctx.stroke();
      ctx.restore();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isHub ? 13 : 10}px Orbitron,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.x, n.y);

      // Pin icon above destination nodes
      if (isDest) {
        const pin = images.pin;
        if (pin?.complete && pin.naturalWidth > 0) {
          const ps = 24; ctx.drawImage(pin, n.x - ps/2, n.y - r - ps - 2, ps, ps);
        } else {
          ctx.font = '14px sans-serif'; ctx.fillText('📍', n.x, n.y - r - 10);
        }
      }
      if (!isHub) {
        ctx.fillStyle = 'rgba(255,179,217,0.6)';
        ctx.font = '8px Rajdhani,sans-serif';
        ctx.fillText('P' + id, n.x, n.y + r + 9);
      }
    });
  }

  _drawDrone(ts) {
    const { ctx, canvas, images } = this;
    const W = canvas.width, H = canvas.height;
    const px = this.droneRel.x * W;
    const py = this.droneRel.y * H;
    const bob = Math.sin(ts / 380) * 3;
    const ds  = 50;

    ctx.save();
    ctx.shadowBlur = 22; ctx.shadowColor = '#FF1F8E';

    if (this.moving) {
      [[-14,-8],[14,-8],[-14,8],[14,8]].forEach(([ox,oy]) => {
        ctx.beginPath(); ctx.arc(px+ox, py+oy+bob, 4.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,31,142,0.35)'; ctx.fill();
      });
    }

    const img = images.drone;
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, px - ds/2, py - ds/2 + bob, ds, ds);
    } else {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI/3 - Math.PI/6;
        i === 0 ? ctx.moveTo(px+16*Math.cos(a), py+bob+16*Math.sin(a))
                : ctx.lineTo(px+16*Math.cos(a), py+bob+16*Math.sin(a));
      }
      ctx.closePath(); ctx.fillStyle='#FF1F8E'; ctx.fill();
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 8px Orbitron'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('C01', px, py+bob);
    }

    if (this.moving) {
      for (let i=1; i<=3; i++) {
        ctx.beginPath(); ctx.arc(px, py+bob, i*5, 0, Math.PI*2);
        ctx.strokeStyle=`rgba(255,31,142,${0.07/i})`; ctx.lineWidth=1; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Canvas click → toggle package by clicking a node ────────────────────
  handleCanvasClick(mx, my) {
    if (this.phase !== 'warehouse') return;
    this.nodes.forEach((n, id) => {
      if (id === 0) return;
      if (Math.hypot(mx - n.x, my - n.y) < 20) {
        const pkg = this.avail.find(x => x.dest === id);
        if (pkg) this.togglePackage(pkg);
      }
    });
  }

  // ── Internal helpers ─────────────────────────────────────────────────────
  _refreshAll() {
    updateHUD(this);
    updateBattery(this.bat, this.maxBat);
    updateWeight(this.inventory.currentWeight, this.maxWgt);
    renderPackages(this.avail, this.inventory, pkg => this.togglePackage(pkg));
    renderInventory(this.inventory);
    renderUpgrades(UPGRADES, this.upgLv, this.money, id => this.buyUpgrade(id));
  }

  _refreshInventoryAndPkgs() {
    updateWeight(this.inventory.currentWeight, this.maxWgt);
    renderPackages(this.avail, this.inventory, pkg => this.togglePackage(pkg));
    renderInventory(this.inventory);
  }

  _bindButtons() {
    // Buttons call back into this Game instance via window.game (set in main.js)
    // We use data attributes so no inline handlers are needed
  }
}