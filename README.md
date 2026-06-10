# 🛸 L-DRONE: Cyber Delivery ✦ Clique City

> **Gênero:** Estratégia / Puzzle de Entregas  
> **Plataforma:** Single-Page HTML5 — abre direto no browser, sem instalação  
> **Tema Visual:** Cyber Barbie / Meninas Malvadas Futurista  

---

## ▶ Como Rodar

```bash
# Opção 1 — Direto no browser (recomendado)
# Abra o arquivo index.html com duplo-clique no gerenciador de arquivos
# ou arraste-o para a janela do Chrome/Firefox/Edge/Safari.

# Opção 2 — Servidor local (para desenvolvedores)
npx serve .          # Node.js
python3 -m http.server 8080   # Python
```

Nenhuma instalação de dependências é necessária. Todos os assets (imagens)
estão embutidos no arquivo `index.html` como base64, tornando o jogo
completamente portável.

### Substituindo os assets visuais

Para usar seus próprios arquivos `.png`:

1. Coloque os arquivos na pasta `assets/`:
   - `assets/map.png` — mapa isométrico
   - `assets/drone.png` — drone C-01
   - `assets/packages.png` — sprite sheet dos pacotes
   - `assets/pin.png` — marcador de destino

2. No `index.html`, localize o bloco `<!-- ASSETS -->` e substitua:
   ```js
   window.ASSET_MAP      = 'assets/map.png';
   window.ASSET_DRONE    = 'assets/drone.png';
   window.ASSET_PACKAGES = 'assets/packages.png';
   window.ASSET_PIN      = 'assets/pin.png';
   ```

---

## 🎮 Gameplay

### Fase 1 — Galpão (Hub L)
O drone está no Hub Central "L". Pacotes aparecem com **peso** e **valor de gorjeta**.
- Selecione pacotes manualmente **ou** use **"✨ Otimizar Carga"** para acionar o algoritmo da Mochila
- O inventário respeita o limite de peso do drone
- Você pode também clicar diretamente nos nós do mapa para selecionar/remover o pacote daquele destino

### Fase 2 — Voo (TSP)
Clique em **"🚀 Entregar (TSP)"** para:
1. Calcular a **rota ótima** com o algoritmo Held-Karp
2. Ver a rota traçada em neon no mapa com setas numeradas
3. Assistir o drone se mover automaticamente de destino em destino
4. Receber créditos a cada entrega concluída

### Sistema de Bateria
A bateria consome proporcionalmente à **distância total da rota**.
Rota longa demais = game over antes de voltar ao Hub.

### Burn Book Upgrades
Acumule créditos e compre melhorias:
| Upgrade | Efeito |
|---|---|
| 🔋 Bateria de Titânio Rosa | +30 pts de bateria máxima |
| 🧳 Porta-Malas Estendido | +5 kg de capacidade |
| 🚀 Propulsor Turbo Fúcsia | ×1.4 de velocidade |

### 🌸 Quarta-Feira Rosa
A cada ciclo de 7 dias, o **Dia 3 (Quarta)** é especial:  
Pacotes valem **×2** créditos mas pesam **×1.9** — o Knapsack precisa escolher sabiamente.

---

## 🧮 Algoritmos Implementados

### 1. TSP — Held-Karp (Problema do Caixeiro Viajante — Exato)
**Arquivo:** `src/algorithms/tspExact.js`  
**Complexidade:** O(2^n × n²) tempo | O(2^n × n) espaço  

Resolve o TSP de forma **exata** usando Programação Dinâmica com Bitmask.
Para n ≤ 12 destinos, usa este algoritmo. O estado `dp[mask][i]` armazena
o custo mínimo de ter visitado o subconjunto `mask` terminando no nó `i`.

### 2. TSP — Vizinho Mais Próximo + 2-Opt (Heurística)
**Arquivo:** `src/algorithms/tspHeuristic.js`  
**Complexidade:** O(n²)  

Usado como fallback para n > 12. Constrói um tour inicial guloso (Nearest
Neighbour) e o melhora eliminando cruzamentos (2-Opt).

### 3. Mochila Gulosa — Knapsack por Densidade de Valor
**Arquivo:** `src/algorithms/knapsack.js`  
**Complexidade:** O(n log n)  

Ordena itens por `valor/peso` decrescente e os seleciona até atingir a
capacidade. Produz soluções de alta qualidade para o range de 4–7 itens do jogo.

### 4. Inventário — Estrutura de Dados com Ordenação
**Arquivo:** `src/core/Inventory.js`  
**Operações:** add O(1) · remove O(n) · has O(n) · sortBy O(n log n)  

TAD com método `sortBy()` que expõe **ordenação por comparação** (2º algoritmo
computacional) como feature de gameplay: organiza pacotes por valor, peso ou
densidade via TimSort nativo.

---

## 📁 Estrutura do Projeto

```
logicart-game/
├── .github/
│   └── ISSUE_TEMPLATE/        # Templates padronizados de issues
│       ├── algoritmo.md
│       ├── gameplay.md
│       └── bug.md
├── assets/                    # Sprites (substituíveis)
│   └── README.md
├── src/
│   ├── algorithms/            # Core algorítmico
│   │   ├── tspExact.js        # Held-Karp DP
│   │   ├── tspHeuristic.js    # Vizinho Mais Próximo + 2-Opt
│   │   └── knapsack.js        # Mochila Gulosa
│   ├── core/                  # Motor e dados
│   │   ├── Game.js            # Loop principal + máquina de estados
│   │   ├── Inventory.js       # TAD Inventário (coleta de itens)
│   │   └── MapManager.js      # Nós, arestas, geração de pacotes
│   ├── ui/                    # Interface
│   │   ├── Hud.js             # Atualização do DOM
│   │   └── Menu.js            # Telas de título/jogo
│   └── main.js                # Ponto de entrada
├── index.html                 # Jogo completo (standalone)
├── package.json               # Metadados do projeto
├── README.md                  # Este arquivo
└── ALGORITMOS.md              # Justificativas algorítmicas
```

---

## 🔗 Issues do Repositório

As issues foram organizadas por labels e vinculadas a cada requisito:

| # | Título | Label | Status |
|---|---|---|---|
| #1 | Implementar estrutura de dados Inventário | `inventário` `estrutura-de-dados` | ✅ Fechada |
| #2 | Implementar TSP — solução exata (Held-Karp) | `algoritmo` `tsp` | ✅ Fechada |
| #3 | Implementar TSP — heurística (NN + 2-Opt) | `algoritmo` `tsp` | ✅ Fechada |
| #4 | Implementar MapManager e grafo de nós | `mapa` | ✅ Fechada |
| #5 | Implementar Menu.js e telas de UI | `ui` | ✅ Fechada |
| #6 | Implementar Knapsack (2º algoritmo) | `algoritmo` `gameplay` | ✅ Fechada |
| #7 | Sistema de bateria como limitador do TSP | `gameplay` | ✅ Fechada |
| #8 | Burn Book Upgrades e loop de progressão | `gameplay` | ✅ Fechada |
