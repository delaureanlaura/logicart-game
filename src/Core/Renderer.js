/**
 * Renderer.js — Motor de Renderização Canvas
 *
 * Responsável por desenhar o mapa, MST, rota TSP, nós e o drone.
 * Desacoplado da lógica de jogo — recebe apenas dados para renderizar.
 */
export class Renderer {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.images = images;
  }

  resize() {
    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) return;
    if (this.canvas.width  !== wrap.clientWidth ||
        this.canvas.height !== wrap.clientHeight) {
      this.canvas.width  = wrap.clientWidth;
      this.canvas.height = wrap.clientHeight;
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ── Map background ─────────────────────────────────────────────────────
  drawMap() {
    const { ctx, canvas, images } = this;
    const img = images.map;
    if (img?.complete && img.naturalWidth > 0) {
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * 0.97;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    } else {
      // Fallback gradient
      const g = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 40,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      g.addColorStop(0, '#1A0040');
      g.addColorStop(1, '#050010');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── MST edges (highlighted) ─────────────────────────────────────────────
  drawMST(nodes, mstEdges) {
    if (!mstEdges?.length || !nodes?.length) return;
    const { ctx } = this;
    ctx.save();
    ctx.setLineDash([4, 12]);
    ctx.lineWidth    = 1.5;
    ctx.strokeStyle  = 'rgba(191,95,255,0.45)';
    mstEdges.forEach(e => {
      const a = nodes[e.a], b = nodes[e.b];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── All graph edges (faint) ─────────────────────────────────────────────
  drawEdges(nodes, edgeList) {
    if (!nodes?.length) return;
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(191,95,255,0.10)';
    ctx.lineWidth   = 1.2;
    ctx.setLineDash([4, 8]);
    edgeList.forEach(([a, b]) => {
      if (!nodes[a] || !nodes[b]) return;
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── TSP route ──────────────────────────────────────────────────────────
  drawRoute(nodes, route) {
    if (!route || route.length < 2 || !nodes?.length) return;
    const { ctx } = this;
    ctx.save();

    // Glow layer
    ctx.lineWidth = 10;
    for (let i = 0; i < route.length - 1; i++) {
      const a = nodes[route[i]], b = nodes[route[i + 1]];
      if (!a || !b) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(0,245,255,0.14)';
      ctx.stroke();
    }

    // Core line + arrows + step numbers
    ctx.lineWidth = 2.5;
    for (let i = 0; i < route.length - 1; i++) {
      const a = nodes[route[i]], b = nodes[route[i + 1]];
      if (!a || !b) continue;

      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0,   '#FF1F8E');
      grad.addColorStop(0.5, '#00F5FF');
      grad.addColorStop(1,   '#FF1F8E');
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grad;
      ctx.stroke();

      // Midpoint arrow
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(ang);
      ctx.fillStyle = '#00F5FF';
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Step label
      const perp = ang + Math.PI / 2;
      ctx.fillStyle = 'rgba(0,245,255,0.85)';
      ctx.font = 'bold 10px Orbitron,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, mx + 13 * Math.cos(perp), my + 13 * Math.sin(perp));
    }
    ctx.restore();
  }

  // ── Graph nodes ─────────────────────────────────────────────────────────
  drawNodes(nodes, { route = [], invDests = [], images } = {}) {
    if (!nodes?.length) return;
    const { ctx } = this;

    nodes.forEach((n, id) => {
      const isHub  = id === 0;
      const isDest = route.includes(id) && id !== 0;
      const inInv  = invDests.includes(id);
      const r      = isHub ? 20 : 13;

      ctx.save();
      ctx.shadowBlur  = isHub ? 28 : 14;
      ctx.shadowColor = isHub ? '#FFD700' : isDest ? '#00F5FF' : '#FF1F8E';

      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

      const fillGrad = (c1, c2) => {
        const g = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, r);
        g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
      };

      if      (isHub)  ctx.fillStyle = fillGrad('#FF1F8E', '#6A0080');
      else if (isDest) ctx.fillStyle = fillGrad('#00F5FF', '#003B44');
      else if (inInv)  ctx.fillStyle = fillGrad('#BF5FFF', '#2D0050');
      else             ctx.fillStyle = 'rgba(45,0,80,0.65)';

      ctx.fill();

      ctx.strokeStyle = isHub ? '#FFD700' : isDest ? '#00F5FF' : inInv ? '#BF5FFF' : 'rgba(255,31,142,0.4)';
      ctx.lineWidth   = isHub ? 2.5 : 1.8;
      ctx.stroke();
      ctx.restore();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font      = `bold ${isHub ? 13 : 10}px Orbitron,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.x, n.y);

      // Pin icon above destination
      if (isDest) {
        const pin = images?.pin;
        if (pin?.complete && pin.naturalWidth > 0) {
          const ps = 24;
          ctx.drawImage(pin, n.x - ps / 2, n.y - r - ps - 2, ps, ps);
        } else {
          ctx.font = '14px sans-serif';
          ctx.fillText('📍', n.x, n.y - r - 10);
        }
      }

      if (!isHub) {
        ctx.fillStyle = 'rgba(255,179,217,0.6)';
        ctx.font      = '8px Rajdhani,sans-serif';
        ctx.fillText('P' + id, n.x, n.y + r + 9);
      }
    });
  }

  // ── Drone ──────────────────────────────────────────────────────────────
  drawDrone(droneRel, ts, isMoving) {
    const { ctx, canvas, images } = this;
    const px  = droneRel.x * canvas.width;
    const py  = droneRel.y * canvas.height;
    const bob = Math.sin(ts / 380) * 3;
    const ds  = 50;

    ctx.save();
    ctx.shadowBlur  = 22;
    ctx.shadowColor = '#FF1F8E';

    // Propulsor rings when moving
    if (isMoving) {
      [[-14, -8], [14, -8], [-14, 8], [14, 8]].forEach(([ox, oy]) => {
        ctx.beginPath(); ctx.arc(px + ox, py + oy + bob, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,31,142,0.35)'; ctx.fill();
      });
    }

    const img = images?.drone;
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, px - ds / 2, py - ds / 2 + bob, ds, ds);
    } else {
      // Fallback hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        i === 0 ? ctx.moveTo(px + 16 * Math.cos(a), py + bob + 16 * Math.sin(a))
                : ctx.lineTo(px + 16 * Math.cos(a), py + bob + 16 * Math.sin(a));
      }
      ctx.closePath(); ctx.fillStyle = '#FF1F8E'; ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Orbitron';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('G', px, py + bob);
    }

    // Motion trail
    if (isMoving) {
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(px, py + bob, i * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,31,142,${0.07 / i})`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
    ctx.restore();
  }
}
