# 📐 Justificativas Algorítmicas — L-DRONE

## 1. TSP: Por que Held-Karp em vez de força bruta?

O Travelling Salesman Problem é NP-difícil. As abordagens para resolvê-lo incluem:

| Abordagem | Complexidade | Qualidade |
|---|---|---|
| Força bruta (permutações) | O(n!) | Ótima |
| **Held-Karp (DP + bitmask)** | **O(2^n × n²)** | **Ótima** |
| Vizinho Mais Próximo | O(n²) | Boa aprox. |
| 2-Opt | O(n²) por pass | Boa aprox. |

**Por que Held-Karp?**  
Para n ≤ 8 destinos (range do jogo): 2^8 × 64 = 16.384 operações — imperceptível.  
Ao contrário de força bruta (8! = 40.320), Held-Karp evita recalcular subproblemas
já resolvidos usando a tabela `dp[mask][i]`. Além disso, é pedagogicamente superior:
demonstra Programação Dinâmica com bitmask — um tema central em CS.

A **heurística Vizinho Mais Próximo + 2-Opt** fica disponível como fallback para
n > 12, mostrando o trade-off entre exatidão e velocidade que o enunciado pede.

---

## 2. Knapsack: Por que heurística gulosa em vez de DP exata?

O Problema da Mochila 0-1 tem solução exata via Programação Dinâmica: O(n × W).  
O problema: **os pesos são fracionários** (ex: 2.3kg, 1.7kg).  

Para usar PD exata com pesos fracionários seria necessário escalonar para inteiros
(multiplicar por 10 e arredondar), o que introduz imprecisões e eleva W artificialmente.

A **heurística gulosa por densidade de valor** (val/wgt):
- É O(n log n) — dominado pela ordenação, roda instantaneamente
- Para 4–7 itens, produz resultados na prática iguais ou muito próximos do ótimo
- A métrica "densidade" é **intuitiva e ensinável**: o jogador entende que "mais valor por kg ganha"
- Cria uma mecânica de gameplay transparente: o jogador pode prever o resultado

A Quarta-Feira Rosa força o algoritmo a trabalhar no limite: pacotes pesados e valiosos
disputam a mesma capacidade, tornando as escolhas da mochila genuinamente desafiadoras.

---

## 3. Inventário: Por que Array com sortBy?

A escolha de um array simples para o inventário reflete o tamanho do problema:
máximo ~7 itens. Arrays são ótimos para este range:

- `add`: O(1) amortizado — push ao final
- `remove`: O(n) busca linear — aceitável para n ≤ 7
- `has`: O(n) — mesmo caso
- `sortBy`: O(n log n) — TimSort nativo do JS engine

O método `sortBy()` integra o segundo problema computacional (ordenação por
comparação) como feature real de gameplay: o jogador pode organizar o inventário
por valor, peso ou densidade para tomar decisões mais informadas.

Alternativas consideradas e descartadas:
- **Map (hash)**: O(1) para has/remove, mas sem ordem natural — complicaria sortBy
- **Min-heap**: ótimo para sortBy, mas O(n) para has e overhead desnecessário

---

## 4. Grafo: Por que distâncias euclidianas diretas?

O drone **voa** — não segue caminhos físicos terrestres. Modelar o grafo com
distâncias euclidianas entre coordenadas dos nós é fisicamente correto para
um drone aéreo e simplifica o TSP sem perda de fidelidade ao domínio.

As arestas visuais no mapa (trilhos de energia da cidade) são decorativas e
refletem a conectividade estética, mas o TSP opera sobre a **distância real de voo**.

---

## 5. Sistema de Bateria: calibração da fórmula

```
consume% = (distância_pixels / diagonal_canvas) × 100 × 0.55
```

**Por que normalizar pela diagonal?**  
A distância TSP retorna pixels absolutos que variam com o tamanho da janela.
Dividir pela diagonal garante que o consumo seja sempre um percentual coerente
independente da resolução. Com escala 0.55, atravessar a diagonal completa
(o pior caso possível) gasta 55% da bateria — uma rota típica de 3 paradas
custa entre 22–33%, deixando margem para upgrades fazerem diferença.

Este sistema é o que torna o TSP **mecanicamente relevante**: uma rota
sub-ótima (mais longa) gasta mais bateria, punindo o jogador que ignorar
o algoritmo.
