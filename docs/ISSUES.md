# 📋 Issues do Projeto — LOGICART

---

## Issue #1 — Implementar TAD Inventário com operações e sortBy
**Labels:** `inventário` `estrutura-de-dados`  **Status:** ✅ Fechada  
**Arquivo:** `src/core/Inventory.js`

**Critérios de aceitação:**
- [x] `add(item)` → O(1), respeita capacidade de peso
- [x] `remove(id)` → O(n), retorna item removido ou null
- [x] `has(id)` → O(n)
- [x] `clear()` → O(1)
- [x] `getDestinations()` → Set de IDs únicos
- [x] `getItemsForDest(id)` → filtra por destino
- [x] `wouldFit(wgt)` → teste sem inserção
- [x] `sortBy(key, order)` → TimSort O(n log n)
- [x] Tolerância float (1e-9) para pesos fracionários

---

## Issue #2 — Implementar TSP Exato (Held-Karp DP + Bitmask)
**Labels:** `algoritmo` `tsp`  **Status:** ✅ Fechada  
**Arquivo:** `src/algorithms/tspExact.js`

**Critérios de aceitação:**
- [x] Recebe startId, visitIds[], nodes[]
- [x] Constrói matriz de distâncias euclidianas
- [x] dp[mask][i] = custo mínimo com subconjunto mask terminando em i
- [x] par[mask][i] para reconstrução do caminho
- [x] Retorna { route, dist, algo, comp }
- [x] Casos degenerados n=0 e n=1 tratados
- [x] Complexidade O(2^n × n²) documentada

---

## Issue #3 — Implementar TSP Heurístico (Vizinho Mais Próximo + 2-Opt)
**Labels:** `algoritmo` `tsp`  **Status:** ✅ Fechada  
**Arquivo:** `src/algorithms/tspHeuristic.js`

**Critérios de aceitação:**
- [x] Fase 1: Nearest Neighbour greedy O(n²)
- [x] Fase 2: 2-Opt com reversão de segmentos
- [x] Fallback automático para n > TSP_THRESHOLD (12)

---

## Issue #4 — Implementar Knapsack Greedy (2º Algoritmo)
**Labels:** `algoritmo` `gameplay`  **Status:** ✅ Fechada  
**Arquivo:** `src/algorithms/knapsack.js`

**Critérios de aceitação:**
- [x] Ordena por val/wgt decrescente
- [x] Seleciona itens gananciosamente até capacidade
- [x] Tolerância float (1e-9)
- [x] Retorna { selected, totalVal, totalWgt }
- [x] Botão "Otimizar Carga" acionado em `screens/game.html`

---

## Issue #5 — Implementar Kruskal MST com Union-Find
**Labels:** `algoritmo` `gameplay`  **Status:** ✅ Fechada  
**Arquivo:** `src/algorithms/kruskal.js`

**Critérios de aceitação:**
- [x] Union-Find com path compression e union by rank
- [x] Ordena arestas por peso euclidiano
- [x] Constrói MST com n-1 arestas
- [x] Retorna { mst, totalW, edgeSet } para lookup O(1)
- [x] Integração: segmentos coincidentes com MST custam −15% bateria
- [x] Painel lateral exibe arestas MST, custo e desconto

---

## Issue #6 — Implementar MapData e Grafo de 9 Nós
**Labels:** `mapa`  **Status:** ✅ Fechada  
**Arquivo:** `src/core/MapData.js`

**Critérios de aceitação:**
- [x] 9 vértices com coordenadas relativas [0..1]
- [x] 19 arestas do grafo
- [x] Vértice 0 = Hub L (origem/destino obrigatório)
- [x] `computeNodes(W, H)` escala para qualquer canvas
- [x] `generatePackages(day, count)` com regra Quarta-Feira Rosa
- [x] Definição das 7 missões com parâmetros de dificuldade

---

## Issue #7 — Implementar Motor de Renderização (Renderer.js)
**Labels:** `mapa` `ui`  **Status:** ✅ Fechada  
**Arquivo:** `src/core/Renderer.js`

**Critérios de aceitação:**
- [x] drawMap() — imagem de fundo com fallback gradient
- [x] drawMST() — arestas MST em roxo pontilhado
- [x] drawEdges() — todas as arestas do grafo (faint)
- [x] drawRoute() — rota TSP em neon com setas e numeração
- [x] drawNodes() — Hub, destinos, itens no inventário com estados visuais
- [x] drawDrone() — sprite do drone com bob animation e propulsores
- [x] resize() — adapta canvas ao wrapper

---

## Issue #8 — Implementar GameState com sessionStorage
**Labels:** `core`  **Status:** ✅ Fechada  
**Arquivo:** `src/core/GameState.js`

**Critérios de aceitação:**
- [x] `loadState()` — carrega de sessionStorage ou retorna defaults
- [x] `saveState(state)` — persiste o estado
- [x] `resetState()` — limpa progresso
- [x] `completeMission(state, idx, stars)` — atualiza estrelas e desbloqueia próxima
- [x] Estado passado entre as 8 páginas HTML sem backend

---

## Issue #9 — Criar 8 páginas HTML com CSS separados
**Labels:** `ui`  **Status:** ✅ Fechada

**Critérios de aceitação:**
- [x] `screens/intro.html` + `css/intro.css`
- [x] `screens/menu.html`  + `css/menu.css`
- [x] `screens/codex.html` + `css/codex.css`
- [x] `screens/map.html`   + `css/map.css`
- [x] `screens/briefing.html` + `css/briefing.css`
- [x] `screens/game.html`  + `css/game.css`
- [x] `screens/results.html` + `css/results.css`
- [x] `screens/gameover.html` + `css/gameover.css`
- [x] `css/global.css` — design system compartilhado

---

## Issue #10 — Implementar sistema de estrelas e progressão de campanha
**Labels:** `gameplay`  **Status:** ✅ Fechada

**Critérios de aceitação:**
- [x] 1–3 estrelas por missão baseadas em ratio earned/possible
- [x] ≥85% → 3 estrelas | ≥55% → 2 | >0 → 1
- [x] Completar missão com ≥1 estrela desbloqueia a próxima
- [x] Cards do mapa exibem estrelas e status visual
- [x] Barra de progresso da campanha

---

## Issue #11 — Documentação e organização do repositório
**Labels:** `documentação`  **Status:** ✅ Fechada

**Critérios de aceitação:**
- [x] README.md com instrução de como rodar, estrutura e tabela de algoritmos
- [x] docs/ALGORITMOS.md com justificativas detalhadas
- [x] docs/ISSUES.md (este arquivo)
- [x] .github/ISSUE_TEMPLATE/ com templates de algoritmo, gameplay e bug
- [x] package.json com metadados do projeto
