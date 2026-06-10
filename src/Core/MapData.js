/**
 * MapData.js — Dados do Mapa, Missões e Geração de Pacotes
 */

export const DAYS_OF_WEEK    = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
export const WEDNESDAY_CYCLE = 3;
export const TSP_THRESHOLD   = 12; // usa exato abaixo, heurístico acima
export const BATTERY_SCALE   = 0.55;
export const MST_DISCOUNT    = 0.15; // 15% desconto em arestas da MST

/** Coordenadas relativas [0..1] — escalam para qualquer canvas */
export const RAW_NODES = [
  { id: 0, label: 'L',  relX: 0.500, relY: 0.470 }, // Hub Central
  { id: 1, label: 'P1', relX: 0.210, relY: 0.220 }, // Nord-Oeste
  { id: 2, label: 'P2', relX: 0.500, relY: 0.140 }, // Norte
  { id: 3, label: 'P3', relX: 0.790, relY: 0.220 }, // Nord-Este
  { id: 4, label: 'P4', relX: 0.108, relY: 0.470 }, // Oeste
  { id: 5, label: 'P5', relX: 0.892, relY: 0.470 }, // Leste
  { id: 6, label: 'P6', relX: 0.210, relY: 0.730 }, // Sud-Oeste
  { id: 7, label: 'P7', relX: 0.500, relY: 0.820 }, // Sul
  { id: 8, label: 'P8', relX: 0.790, relY: 0.730 }, // Sud-Este
];

/** Arestas do grafo — trilhos de energia */
export const EDGE_LIST = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
  [1,2],[2,3],[1,4],[3,5],[4,6],[5,8],[6,7],[7,8],
  [1,6],[3,8],[2,7],
];

/** Tipos visuais dos pacotes */
export const PKG_TYPES = [
  { emoji: '📦', color: '#C2185B', name: 'Caixa Luxo M',    bg: 'rgba(194,24,91,0.22)'   },
  { emoji: '🔷', color: '#00F5FF', name: 'Núcleo Neon',     bg: 'rgba(0,245,255,0.14)'   },
  { emoji: '🎁', color: '#FF6EB4', name: 'Pilha Pastel',    bg: 'rgba(255,110,180,0.18)' },
  { emoji: '💎', color: '#BF5FFF', name: 'Cápsula Magenta', bg: 'rgba(191,95,255,0.18)'  },
];

/** Definição das 7 missões da campanha */
export const MISSIONS = [
  { day:1, name:'Manhã de Segunda',      desc:'Primeira decolagem do Gambi.',               pkgRange:[3,4], batMult:1.00 },
  { day:2, name:'Terça Caótica',         desc:'Pedidos duplicaram da noite para o dia.',     pkgRange:[4,5], batMult:0.95 },
  { day:3, name:'Quarta Rosa 🌸',        desc:'Às quartas usamos rosa — e pesamos mais!',   pkgRange:[4,6], batMult:0.90, wednesday:true },
  { day:4, name:'Quinta do Prazo',       desc:'Todo pedido tem urgência hoje.',              pkgRange:[5,6], batMult:0.88 },
  { day:5, name:'Sexta Fúcsia',          desc:'Último turno da semana. Faça valer!',         pkgRange:[5,7], batMult:0.85 },
  { day:6, name:'Sábado Extra',          desc:'Hora extra bem paga. Mochila no limite.',    pkgRange:[5,7], batMult:0.82 },
  { day:7, name:'Domingo Intenso',       desc:'A cidade nunca para. Prove que você também não.', pkgRange:[6,7], batMult:0.78 },
];

let _pkgId = 0;

/** Calcula posições em pixels a partir das coordenadas relativas */
export function computeNodes(W, H) {
  return RAW_NODES.map(n => ({ ...n, x: n.relX * W, y: n.relY * H }));
}

/** Gera pacotes aleatórios para o dia */
export function generatePackages(day, count) {
  const isWed = day % 7 === WEDNESDAY_CYCLE;
  const n     = count ?? (4 + Math.floor(Math.random() * 4));
  const used  = new Set([0]);
  const pkgs  = [];

  for (let i = 0; i < n; i++) {
    const t = PKG_TYPES[Math.floor(Math.random() * PKG_TYPES.length)];
    let dest;
    do { dest = 1 + Math.floor(Math.random() * 8); } while (used.has(dest));
    used.add(dest);

    let wgt = +(1 + Math.random() * 3.5).toFixed(1);
    let val = Math.floor(12 + Math.random() * 38);

    if (isWed) { wgt = +(wgt * 1.9).toFixed(1); val = Math.floor(val * 2); }

    pkgs.push({
      id: ++_pkgId,
      name: t.name, emoji: t.emoji, color: t.color, bg: t.bg,
      wgt, val, dest,
    });
  }

  return pkgs;
}
