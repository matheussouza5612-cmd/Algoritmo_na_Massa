# Algoritmo na Massa 🍕

Jogo educativo em HTML, CSS e JavaScript. **Não precisa de Node.js, instalação nem servidor local.**

## Como jogar
1. Extraia o ZIP inteiro, mantendo a pasta `imagens` ao lado dos arquivos HTML.
2. Abra `index.html` no navegador (por exemplo, Google Chrome ou Microsoft Edge).
3. Clique em **JOGAR**, selecione um nível e receba um pedido.
4. Na montagem, clique nos ingredientes para adicioná-los ou arraste-os para a área central. Os blocos são organizados em uma sequência de preparação. Use **↑ / ↓** para reordenar e **×** (ou botão direito) para remover. Inclua **Tempo de Forno** como última etapa.
5. Clique em **VERIFICAR**. Se necessário, use **TENTAR DE NOVO**; também é possível assar com erros, recebendo menos pontos.
6. Coloque a pizza em um dos quatro fornos e clique em **COMEÇAR A ASSAR**. Quando atingir o tempo ideal, o forno **continua ligado**. Volte a ele, clique em **DESLIGAR FORNO** manualmente e depois em **VERIFICAR**. É possível pausar e retomar cada forno; os outros seguem independentes.

## Regras de níveis
- **Fácil:** 3 clientes.
- **Médio:** 6 clientes.
- **Difícil:** 10 clientes.

**Progressão:** o nível Fácil começa liberado. Concluir os 3 pedidos do Fácil desbloqueia o Médio; concluir os 6 pedidos do Médio desbloqueia o Difícil. Os níveis já liberados podem ser jogados novamente. Reabrir a lista de pedidos do nível em andamento não reinicia a partida. O desbloqueio é salvo no perfil local, junto das conquistas (não há conta online).

Cada cliente recebe aleatoriamente nome e receita. Os pedidos são criados uma única vez por partida e mantidos até a conclusão, mesmo ao alternar entre telas. Selecionar um nível inicia uma partida nova e substitui a partida anterior.

## Receitas e dados
O arquivo `script.js`, no início, contém o objeto `config` com nomes, sobrenomes, ingredientes e as três pizzas: **Margherita, Pepperoni e Calabresa**. É a fonte única dos dados, pois carregar um JSON por `fetch()` exigiria um servidor ao executar os HTMLs localmente. As receitas foram configuradas com 45, 60 e 75 segundos de forno para permitir testar a partida.

## Pontos e desempenho
Cada pedido vale no máximo **100 pontos**:

| Critério | Máximo |
|---|---:|
| Construção do algoritmo (ordem dos blocos) | 30 |
| Seleção dos ingredientes (faltas/extras/repetidos) | 40 |
| Tempo de forno na sequência + desligamento manual no momento correto | 20 |
| Agilidade ao montar a pizza | 10 |

**Regra do forno:** ao desligar entre o tempo ideal e 15 segundos após ele, não perde pontos de cozimento. A partir de 16 segundos de atraso, perde 2 pontos a cada bloco de 5 segundos adicionais (até zerar os 20 pontos do forno). Desligar antes do tempo ideal perde 2 pontos a cada 5 segundos de antecedência. Os pontos de forno também exigem que o bloco Tempo de Forno esteja na posição correta. A nota mostrada antes do forno é apenas a nota máxima possível, não a definitiva.

A página `pontuacao.html` apresenta a nota da pizza e, depois do último cliente, o resultado total. Mostra ainda um painel de **Desempenho geral** com a média de todos os níveis, médias por habilidade, tempo médio de montagem, atrasos de forno e dicas sobre onde melhorar, além de seis conquistas: Primeira fornada, Algoritmo perfeito, Mãos na massa, Trinca perfeita, Turno encerrado e Chef incansável.

Os dados de conquistas/histórico são guardados no navegador quando o armazenamento local está disponível. Para funcionar **sem servidor**, o estado da partida também acompanha a navegação entre páginas no trecho `#am=...` do endereço. Isso evita depender de permissões de acesso entre arquivos `file://`. Mantenha a mesma aba durante a partida; não remova manualmente o trecho após `#` de um endereço do jogo. O estado e as conquistas são **locais a este navegador** e não sincronizam entre computadores. Em navegação anônima ou com armazenamento bloqueado, o histórico poderá não sobreviver ao fechamento da aba.

## Arquivos
- `styles.css`: todos os estilos, com regras separadas por página para preservar o visual original.
- `script.js`: configurações, partidas, pedidos, montagem, validação, pontuação, conquistas e persistência.
- `fornos.js`: quatro fornos independentes, conectados à pontuação.
- `index.html`, `niveis.html`, `pedidos.html`, `montagem.html`, `validacao.html`, `fornos.html`, `pontuacao.html`, `tutorial.html`: telas originais do projeto.
- `imagens/`: arte e imagens originais da equipe.
- `Blocos.txt`: anotações do projeto original.

O cabeçalho da montagem está diretamente no `montagem.html`, sem `header.html` e `header-loader.js`. Os arquivos CSS individuais e o `presets/config.json` antigo foram removidos por estarem duplicados ou não serem usados em execução.

## Avaliação pedagógica acumulada
O painel **Desempenho geral** usa todas as notas registradas no perfil, incluindo partidas anteriores e diferentes níveis. Exibe médias com uma casa decimal (por exemplo, 95,3/100) e orientações para melhorar as habilidades com mais perdas proporcionais de pontos. Os acumuladores persistem mesmo após ultrapassar o limite de 50 registros recentes guardados para compatibilidade com os endereços locais (`file://`).

**Compatibilidade:** notas antigas registradas antes desta versão entram na média geral. Seus pontos por habilidade e os tempos não são reconstruídos, porque não existiam no histórico antigo. As métricas detalhadas ficam disponíveis para pedidos concluídos a partir desta versão. O desempenho é local ao navegador, sem autenticação ou certificação contra edição manual; para avaliação oficial é recomendável acompanhamento da professora.
