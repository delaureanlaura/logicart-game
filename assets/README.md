# 🛸 LOGICART — Episódio I: O Turno da Manhã
# grupo (solo): Laura Costa Rocha

> **Gênero:** Estratégia / Puzzle de Entregas com Algoritmos Clássicos de CS  
> **Tecnologia:** HTML5 + JavaScript Vanilla (ES Modules) + Canvas API  
> **Sem dependências externas — abre direto no browser**

---

## ▶ Como Rodar

```bash
# OBRIGATÓRIO: servir via HTTP (ES Modules não funcionam em file://)
npx serve .
# ou
python3 -m http.server 8080
# ou
npx http-server .
```

Acesse: `http://localhost:3000` (ou a porta indicada)

O jogo começa em `index.html` → redireciona para `screens/intro.html`.

---

## 📁 Estrutura do Projeto

```
logicart-v2/
│
├── index.html                  ← Entrada principal (redireciona para intro)
│
├── screens/                    ← Uma página HTML por tela
│   ├── intro.html              ← Intro Star Wars crawl
│   ├── menu.html               ← Menu principal
│   ├── codex.html              ← Tutorial / Como Jogar
│   ├── map.html                ← Mapa de campanha (7 missões)
│   ├── briefing.html           ← Briefing pré-missão
│   ├── game.html               ← Gameplay principal (canvas + painéis)
│   ├── results.html            ← Resultados pós-missão
│   └── gameover.html           ← Tela de Game Over
│
├── css/                        ← Um CSS por tela (+ global)
│   ├── global.css              ← Design system: tokens, botões, painéis, modal
│   ├── intro.css               ← Star Wars crawl styles
│   ├── menu.css                ← Menu principal
│   ├── map.css                 ← Cards de missão
│   ├── briefing.css            ← Painéis de briefing
│   ├── game.css                ← Grid do jogo, HUD, canvas, pacotes
│   ├── results.css             ← Tela de resultados animada
│   ├── codex.css               ← Cards do tutorial
│   └── gameover.css            ← Game over screen
│
├── src/
│   ├── algorithms/             ← Algoritmos computacionais
│   │   ├── tspExact.js         ← Held-Karp DP O(2^n × n²)
│   │   ├── tspHeuristic.js     ← Vizinho Mais Próximo + 2-Opt O(n²)
│   │   ├── knapsack.js         ← Mochila Gulosa O(n log n)
│   │   └── kruskal.js          ← Kruskal MST O(E log E) + Union-Find
│   │
│   ├── core/                   ← Motor e dados
│   │   ├── Inventory.js        ← TAD Inventário + sortBy (TimSort)
│   │   ├── MapData.js          ← Grafo, missões, geração de pacotes
│   │   ├── GameState.js        ← Save/load via sessionStorage
│   │   └── Renderer.js         ← Motor de renderização Canvas 2D
│   │
│   └── ui/
│       ├── hud.js              ← Atualização do DOM (HUD, painéis, modais)
│       └── starfield.js        ← Canvas de estrelas animadas (reutilizável)
│
├── assets/                     ← Sprites PNG (substituíveis)
│   └── README.md
│
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── algoritmo.md
│       ├── gameplay.md
│       └── bug.md
│
├── docs/
│   ├── ISSUES.md               ← Histórico de issues do projeto
│   └── ALGORITMOS.md           ← Justificativas algorítmicas
│
└── package.json
```

---

## 🎮 Fluxo de Telas

```
index.html
    └── screens/intro.html       (Star Wars crawl)
            └── screens/menu.html
                    ├── screens/codex.html     (tutorial)
                    └── screens/map.html       (7 missões)
                            └── screens/briefing.html
                                    └── screens/game.html
                                            ├── screens/results.html
                                            └── screens/gameover.html
```

---

## 🧮 Algoritmos Implementados

| Arquivo | Algoritmo | Complexidade | Integração |
|---|---|---|---|
| `tspExact.js` | Held-Karp DP + Bitmask | O(2^n × n²) | Calcula rota ótima de entrega |
| `tspHeuristic.js` | Vizinho Mais Próximo + 2-Opt | O(n²) | Fallback para n > 12 |
| `knapsack.js` | Greedy por Value Density | O(n log n) | Botão "Otimizar Carga" |
| `kruskal.js` | Kruskal MST + Union-Find | O(E log E) | Desconto de −15% de bateria em arestas MST |
| `Inventory.sortBy()` | TimSort (JS nativo) | O(n log n) | Ordenação do inventário por val/wgt/density |

---

## 💾 Persistência

O estado da campanha (créditos, upgrades, estrelas por missão) é salvo
em **sessionStorage** durante a sessão, passado entre as páginas HTML
via `src/core/GameState.js`.

---

## 🔧 Substituindo os Assets Visuais

Os assets em `screens/game.html` são injetados como base64. Para usar
arquivos PNG externos:

1. Coloque os arquivos em `assets/`: `map.png`, `drone.png`, `packages.png`, `pin.png`
2. Em `screens/game.html`, localize o bloco `ASSET INJECTION` e substitua:

```js
window.ASSET_MAP      = 'assets/map.png';
window.ASSET_DRONE    = 'assets/drone.png';
window.ASSET_PACKAGES = 'assets/packages.png';
window.ASSET_PIN      = 'assets/pin.png';
```

**Atenção:** com caminhos externos o servidor HTTP é obrigatório.
