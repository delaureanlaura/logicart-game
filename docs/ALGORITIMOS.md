# 📐 Justificativas Algorítmicas — LOGICART

## 1. TSP: Held-Karp vs Força Bruta vs Heurísticas

| Abordagem | Complexidade | Qualidade | Usado quando |
|---|---|---|---|
| Força bruta | O(n!) | Ótima | — descartada |
| **Held-Karp DP** | **O(2^n × n²)** | **Ótima** | **n ≤ 12** |
| Vizinho Mais Próximo + 2-Opt | O(n²) | Boa aprox. | n > 12 |

**Por que Held-Karp?**
Para n ≤ 8 destinos (range do jogo), 2^8 × 64 = 16.384 operações — imperceptível.
A tabela `dp[mask][i]` evita recomputar subproblemas já resolvidos,
tornando-o exponencialmente mais eficiente que força bruta (8! = 40.320).
É também pedagogicamente superior: demonstra DP com bitmask, um tema central em CS.

**Por que a heurística existe?**
Demonstrar o trade-off entre exatidão e velocidade — tema central do enunciado.
O threshold em n=12 é configurável em `MapData.js`.

---

## 2. Knapsack: Greedy vs DP Exata

O Problema da Mochila 0-1 tem solução exata via DP em O(n × W).
**Problema:** os pesos são fracionários (ex: 2.3 kg, 1.7 kg).

DP exata com pesos fracionários exigiria escalonamento inteiro
(multiplicar por 10), introduzindo imprecisões e elevando W artificialmente.

**A heurística gulosa por valor/peso:**
- É O(n log n) — roda instantaneamente a cada rodada
- Para 4–7 itens produz resultado igual ou próximo do ótimo
- A métrica "densidade" é intuitiva: o jogador entende a lógica
- Cria tensão real na Quarta-Feira Rosa: pacotes pesados e valiosos
  disputam espaço, tornando as escolhas genuinamente desafiadoras

---

## 3. Kruskal MST: Por que é o 2º algoritmo principal?

Kruskal é aplicado como mecânica real de gameplay, não apenas exibição:
**Rotas TSP que seguem arestas da MST custam −15% de bateria.**

Isso cria um loop de estratégia genuíno:
1. Sistema calcula MST do mapa (exibida em roxo no canvas)
2. Jogador pode inspecionar quais arestas foram incluídas
3. TSP ótimo pode ou não coincidir com a MST
4. O desconto recompensa quem planeja a carga considerando a rede

**Por que Kruskal e não Prim?**
Kruskal com Union-Find (path compression + union by rank) é O(E log E) e
mais natural para grafos esparsos. O Union-Find implementado no módulo
é reutilizável e bem documentado.

---

## 4. Inventário: Array + TimSort

Para máximo de ~7 itens, um array simples é a estrutura ideal:
- `add`: O(1) amortizado
- `remove`: O(n) busca linear — aceitável para n ≤ 7
- `sortBy`: O(n log n) via TimSort nativo do JS engine

O método `sortBy()` integra **ordenação por comparação** como feature real
de gameplay: 3 botões (💰 ⚖️ 📈) organizam o inventário por valor,
peso ou densidade para ajudar na tomada de decisão.

---

## 5. Sistema de Bateria: Normalização pela Diagonal

```
consume% = (distância_px / diagonal_canvas) × 100 × 0.55
```

**Por que normalizar pela diagonal?**
A distância TSP retorna pixels absolutos que variam com o tamanho da janela.
Dividir pela diagonal garante que o consumo seja sempre um percentual coerente
independente da resolução. Com escala 0.55, atravessar a diagonal completa
(pior caso) gasta 55% — uma rota típica de 3 paradas custa 22–33%.

**Desconto MST:**
Reduz o custo em 15% por segmento que coincide com aresta MST,
tornando o Kruskal mecanicamente relevante.

---

## 6. GameState: sessionStorage como camada de persistência

O estado é passado entre as 8 páginas HTML via sessionStorage,
simulando um sistema de save simples sem necessidade de backend.
`GameState.js` fornece uma API limpa: `loadState()`, `saveState()`,
`resetState()` e `completeMission()`.
