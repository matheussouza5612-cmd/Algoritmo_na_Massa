/* Algoritmo na Massa — regras da partida, pedidos, montagem, validação e pontuação.
   Não faz fetch: funciona com os arquivos HTML abertos diretamente no navegador. */
'use strict';

/* Compatibilidade com file://: navegadores podem isolar o armazenamento de cada HTML.
   Uma cópia pequena da partida acompanha o # da URL entre as páginas locais.
   O armazenamento nativo continua sendo usado quando disponível. */
let restaurandoEstado = true;
function armazenamentoSeguro(nome) {
    let nativo;
    try { nativo = window[nome]; nativo.setItem('__alm_teste', '1'); nativo.removeItem('__alm_teste'); }
    catch (_) { nativo = null; }
    const memoria = new Map();
    return {
        getItem(chave) { try { return nativo ? nativo.getItem(chave) : (memoria.get(chave) ?? null); } catch (_) { return memoria.get(chave) ?? null; } },
        setItem(chave, valor) {
            memoria.set(chave, String(valor));
            try { nativo?.setItem(chave, String(valor)); } catch (_) {}
            if (!restaurandoEstado) sincronizarURL();
        },
        removeItem(chave) {
            memoria.delete(chave);
            try { nativo?.removeItem(chave); } catch (_) {}
            if (!restaurandoEstado) sincronizarURL();
        }
    };
}
const sessionStorage = armazenamentoSeguro('sessionStorage');
const localStorage = armazenamentoSeguro('localStorage');
const CHAVES_PORTATEIS = [
    'algoritmoNaMassa.partida.v1', 'pedidoAtual', 'algoritmoNaMassa.validacaoAtual',
    'algoritmoNaMassa.pontuacaoAtual', 'filaPizzasForno', 'algoritmoNaMassa.fornos.v1',
    'algoritmoNaMassa.perfil.v1'
];
function obterEstadoPortatil() {
    const estado = {};
    CHAVES_PORTATEIS.forEach(chave => {
        const valor = chave === 'algoritmoNaMassa.perfil.v1' ? (localStorage.getItem(chave) || sessionStorage.getItem(chave)) : sessionStorage.getItem(chave);
        if (valor !== null) estado[chave] = valor;
    });
    return estado;
}
function hashPortatil() {
    return '#am=' + encodeURIComponent(JSON.stringify(obterEstadoPortatil()));
}
function sincronizarURL() {
    if (restaurandoEstado) return;
    try { history.replaceState(null, '', location.pathname + location.search + hashPortatil()); }
    catch (_) { /* O fluxo entre páginas ainda usa hashPortatil() nos links. */ }
}
function navegar(pagina) { location.href = pagina + hashPortatil(); }
try {
    const dados = new URLSearchParams(location.hash.slice(1)).get('am');
    const estado = dados ? JSON.parse(dados) : null;
    if (estado && typeof estado === 'object' && !Array.isArray(estado)) {
        CHAVES_PORTATEIS.forEach(chave => {
            const storage = chave === 'algoritmoNaMassa.perfil.v1' ? localStorage : sessionStorage;
            if (typeof estado[chave] === 'string') storage.setItem(chave, estado[chave]);
            else storage.removeItem(chave);
        });
    }
} catch (erro) { console.warn('Estado da URL indisponível:', erro); }
restaurandoEstado = false;
// Atualiza o destino de links HTML locais depois que o código da página salvou os dados.
document.addEventListener('click', evento => {
    const link = evento.target.closest?.('a[href]');
    if (!link || evento.defaultPrevented) return;
    const endereco = link.getAttribute('href');
    if (!endereco || !/^(?:[^:/?#]+\.html)(?:\?[^#]*)?(?:#.*)?$/i.test(endereco)) return;
    const pagina = endereco.split('#')[0];
    link.setAttribute('href', pagina + hashPortatil());
});


const config = {
    nomes: [
        { nome: 'Ana', genero: 'feminino' }, { nome: 'Beatriz', genero: 'feminino' },
        { nome: 'Camila', genero: 'feminino' }, { nome: 'Clara', genero: 'feminino' },
        { nome: 'Fernanda', genero: 'feminino' }, { nome: 'Isabela', genero: 'feminino' },
        { nome: 'Júlia', genero: 'feminino' }, { nome: 'Larissa', genero: 'feminino' },
        { nome: 'Marina', genero: 'feminino' }, { nome: 'Sofia', genero: 'feminino' },
        { nome: 'André', genero: 'masculino' }, { nome: 'Bruno', genero: 'masculino' },
        { nome: 'Caio', genero: 'masculino' }, { nome: 'Daniel', genero: 'masculino' },
        { nome: 'Gabriel', genero: 'masculino' }, { nome: 'Lucas', genero: 'masculino' },
        { nome: 'Matheus', genero: 'masculino' }, { nome: 'Pedro', genero: 'masculino' },
        { nome: 'Rafael', genero: 'masculino' }, { nome: 'Vinícius', genero: 'masculino' }
    ],
    sobrenomes: [
        'Almeida', 'Barbosa', 'Cardoso', 'Costa', 'Ferreira', 'Gomes',
        'Lima', 'Martins', 'Oliveira', 'Pereira', 'Ribeiro', 'Santos', 'Silva', 'Souza'
    ],
    ingredientes: {
        massa:      { nome: 'Massa',       cor: '#d6a35b' },
        molho:      { nome: 'Molho de tomate', cor: '#cf4933' },
        queijo:     { nome: 'Queijo',      cor: '#e9aa2a' },
        pepperoni:  { nome: 'Pepperoni',   cor: '#9c3234' },
        manjericao: { nome: 'Manjericão',  cor: '#378d4b' },
        calabresa:  { nome: 'Calabresa',   cor: '#a24e35' },
        cebola:     { nome: 'Cebola',      cor: '#9e74ac' }
    },
    pizzas: {
        margherita: { nome: 'Margherita', ingredientes: ['massa', 'molho', 'queijo', 'manjericao'], tempoForno: 45 },
        pepperoni:  { nome: 'Pepperoni',  ingredientes: ['massa', 'molho', 'queijo', 'pepperoni'], tempoForno: 60 },
        calabresa:  { nome: 'Calabresa',  ingredientes: ['massa', 'molho', 'queijo', 'calabresa', 'cebola'], tempoForno: 75 }
    }
};

const ORDEM_NIVEIS = ['facil', 'medio', 'dificil'];
const NIVEIS = {
    facil: { rotulo: 'FÁCIL', quantidade: 3 },
    medio: { rotulo: 'MÉDIO', quantidade: 6 },
    dificil: { rotulo: 'DIFÍCIL', quantidade: 10 }
};
const CHAVES = {
    partida: 'algoritmoNaMassa.partida.v1',
    perfil: 'algoritmoNaMassa.perfil.v1',
    pedidoAtual: 'pedidoAtual',
    validacao: 'algoritmoNaMassa.validacaoAtual',
    pontuacao: 'algoritmoNaMassa.pontuacaoAtual',
    fila: 'filaPizzasForno',
    fornos: 'algoritmoNaMassa.fornos.v1'
};
const CONQUISTAS = {
    primeiro: { nome: 'Primeira fornada', descricao: 'Conclua seu primeiro pedido.' },
    perfeito: { nome: 'Algoritmo perfeito', descricao: 'Entregue uma pizza com 100 pontos.' },
    ligeiro: { nome: 'Mãos na massa', descricao: 'Monte um pedido em até 60 segundos.' },
    tresPerfeitos: { nome: 'Trinca perfeita', descricao: 'Faça três pizzas com 100 pontos na mesma partida.' },
    nivelCompleto: { nome: 'Turno encerrado', descricao: 'Conclua todos os clientes de um nível.' },
    dezClientes: { nome: 'Chef incansável', descricao: 'Atenda os dez clientes do nível difícil.' }
};
const MEDALHAS_HEADER = ['primeiro', 'perfeito', 'nivelCompleto'];

function formatarTempo(segundos) {
    const total = Math.max(0, Math.floor(Number(segundos) || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
function lerJSON(armazenamento, chave, padrao = null) {
    try { return JSON.parse(armazenamento.getItem(chave)) ?? padrao; } catch (_) { return padrao; }
}
function salvarJSON(armazenamento, chave, valor) {
    try { armazenamento.setItem(chave, JSON.stringify(valor)); return true; }
    catch (erro) { console.error('Armazenamento indisponível:', erro); return false; }
}
function obterPartida() {
    const partida = lerJSON(sessionStorage, CHAVES.partida);
    return partida && Array.isArray(partida.pedidos) && Array.isArray(partida.resultados) ? partida : null;
}
function salvarPartida(partida) { return salvarJSON(sessionStorage, CHAVES.partida, partida); }
const CRITERIOS_DESEMPENHO = {
    algoritmo: { nome: 'Construção do algoritmo', max: 30, dica: 'Confira a ordem de todos os blocos antes de enviar a pizza.' },
    ingredientes: { nome: 'Seleção de ingredientes', max: 40, dica: 'Revise a receita para evitar ingredientes faltando, extras ou repetidos.' },
    forno: { nome: 'Controle do forno', max: 20, dica: 'Acompanhe os quatro fornos e desligue cada um dentro da tolerância de 15 segundos.' },
    atendimento: { nome: 'Tempo de atendimento', max: 10, dica: 'Organize os blocos com mais agilidade, sem deixar de conferir a receita.' }
};
function normalizarDesempenho(perfil) {
    if (perfil?.desempenho && Number.isFinite(perfil.desempenho.quantidade)) {
        const d = perfil.desempenho;
        return {
            quantidade: d.quantidade, somaTotal: Number(d.somaTotal) || 0,
            criterios: Object.fromEntries(Object.keys(CRITERIOS_DESEMPENHO).map(id => [id, {
                quantidade: Number(d.criterios?.[id]?.quantidade) || 0,
                soma: Number(d.criterios?.[id]?.soma) || 0
            }])),
            montagem: { quantidade: Number(d.montagem?.quantidade) || 0, somaSegundos: Number(d.montagem?.somaSegundos) || 0 },
            cozimento: { quantidade: Number(d.cozimento?.quantidade) || 0, somaDesvio: Number(d.cozimento?.somaDesvio) || 0,
                atrasadas: Number(d.cozimento?.atrasadas) || 0, antecipadas: Number(d.cozimento?.antecipadas) || 0 }
        };
    }
    // Compatibilidade com o histórico da versão anterior, que tinha apenas a nota total.
    const antigos = Array.isArray(perfil?.historico) ? perfil.historico : [];
    return {
        quantidade: antigos.length,
        somaTotal: antigos.reduce((soma, item) => soma + (Number(item.pontos) || 0), 0),
        criterios: Object.fromEntries(Object.keys(CRITERIOS_DESEMPENHO).map(id => [id, { quantidade: 0, soma: 0 }])),
        montagem: { quantidade: 0, somaSegundos: 0 },
        cozimento: { quantidade: 0, somaDesvio: 0, atrasadas: 0, antecipadas: 0 }
    };
}
function registrarDesempenho(desempenho, resultado) {
    desempenho.quantidade++;
    desempenho.somaTotal += Number(resultado.total) || 0;
    Object.keys(CRITERIOS_DESEMPENHO).forEach(id => {
        const nota = Number(resultado.pontos?.[id]);
        if (!Number.isFinite(nota)) return;
        desempenho.criterios[id].quantidade++;
        desempenho.criterios[id].soma += nota;
    });
    if (Number.isFinite(Number(resultado.segundosMontagem))) {
        desempenho.montagem.quantidade++;
        desempenho.montagem.somaSegundos += Number(resultado.segundosMontagem);
    }
    if (Number.isFinite(Number(resultado.tempoRealForno)) && Number.isFinite(Number(resultado.tempoForno))) {
        const desvio = Number(resultado.tempoRealForno) - Number(resultado.tempoForno);
        desempenho.cozimento.quantidade++;
        desempenho.cozimento.somaDesvio += desvio;
        if (desvio > 15) desempenho.cozimento.atrasadas++;
        if (desvio < 0) desempenho.cozimento.antecipadas++;
    }
}
function numeroDesempenho(valor) { return Number(valor).toFixed(1).replace('.', ','); }

function obterPerfil() {
    const padrao = { conquistas: [], historico: [], niveisDesbloqueados: ['facil'] };
    const perfil = lerJSON(localStorage, CHAVES.perfil, lerJSON(sessionStorage, CHAVES.perfil, padrao));
    const desbloqueados = new Set(['facil']);
    if (Array.isArray(perfil?.niveisDesbloqueados)) {
        perfil.niveisDesbloqueados.filter(id => ORDEM_NIVEIS.includes(id)).forEach(id => desbloqueados.add(id));
    }
    // Migração: se uma partida da versão anterior terminou, libera seu próximo nível.
    const partidaAnterior = obterPartida();
    if (partidaAnterior?.concluidaEm && partidaAnterior.resultados.length >= partidaAnterior.meta) {
        const proximo = ORDEM_NIVEIS[ORDEM_NIVEIS.indexOf(partidaAnterior.nivel) + 1];
        if (proximo) desbloqueados.add(proximo);
    }
    // O desbloqueio é sequencial, nunca pula uma etapa.
    if (desbloqueados.has('dificil')) desbloqueados.add('medio');
    return {
        conquistas: Array.isArray(perfil?.conquistas) ? perfil.conquistas : [],
        historico: Array.isArray(perfil?.historico) ? perfil.historico : [],
        // Na primeira atualização, recupera as notas antigas já existentes.
        // Os detalhes por habilidade só são contabilizados quando foram realmente salvos.
        desempenho: normalizarDesempenho(perfil),
        niveisDesbloqueados: ORDEM_NIVEIS.filter(id => desbloqueados.has(id))
    };
}
function salvarPerfil(perfil) {
    if (!salvarJSON(localStorage, CHAVES.perfil, perfil)) salvarJSON(sessionStorage, CHAVES.perfil, perfil);
}
function nivelLiberado(nivel) {
    return ORDEM_NIVEIS.includes(nivel) && obterPerfil().niveisDesbloqueados.includes(nivel);
}
function desbloquearProximoNivel(nivel) {
    const proximo = ORDEM_NIVEIS[ORDEM_NIVEIS.indexOf(nivel) + 1];
    if (!proximo) return;
    const perfil = obterPerfil();
    if (!perfil.niveisDesbloqueados.includes(proximo)) {
        perfil.niveisDesbloqueados.push(proximo);
        salvarPerfil(perfil);
    }
}
function novoPedido(indice, nomesUsados) {
    let pessoa, sobrenome, nome;
    do {
        pessoa = sortear(config.nomes);
        sobrenome = sortear(config.sobrenomes);
        nome = `${pessoa.nome} ${sobrenome}`;
    } while (nomesUsados.has(nome));
    nomesUsados.add(nome);
    const [pizzaId, pizza] = sortear(Object.entries(config.pizzas));
    return {
        idPedido: `cliente-${indice + 1}`,
        nome,
        imagem: pessoa.genero === 'feminino' ? 'imagens/cliente_f.png' : 'imagens/cliente_m.png',
        pizzaId,
        pizzaNome: pizza.nome,
        ingredientes: [...pizza.ingredientes],
        tempoForno: pizza.tempoForno,
        estado: 'disponivel',
        recebidoEm: null
    };
}
function iniciarPartida(nivel) {
    if (!nivelLiberado(nivel)) return null;
    const definicao = NIVEIS[nivel] || NIVEIS.facil;
    const nomesUsados = new Set();
    const partida = {
        nivel: NIVEIS[nivel] ? nivel : 'facil',
        meta: definicao.quantidade,
        iniciadaEm: Date.now(),
        pedidos: Array.from({ length: definicao.quantidade }, (_, i) => novoPedido(i, nomesUsados)),
        resultados: [],
        concluidaEm: null
    };
    salvarPartida(partida);
    [CHAVES.pedidoAtual, CHAVES.validacao, CHAVES.pontuacao, CHAVES.fila, CHAVES.fornos].forEach(chave => {
        try { sessionStorage.removeItem(chave); } catch (_) {}
    });
    return partida;
}
function buscarPedido(partida, idPedido) { return partida?.pedidos.find(p => p.idPedido === idPedido); }
function atualizarEstadoPedido(idPedido, estado) {
    const partida = obterPartida();
    const pedido = buscarPedido(partida, idPedido);
    if (!pedido) return;
    pedido.estado = estado;
    salvarPartida(partida);
}
function marcarPedidoNoForno(idPedido) { atualizarEstadoPedido(idPedido, 'noForno'); }
function cancelarPedidoNoForno(idPedido) { atualizarEstadoPedido(idPedido, 'emPreparo'); }

function avaliarMontagem(pedido, sequencia) {
    const esperados = pedido.ingredientes;
    const selecionados = sequencia.filter(id => id !== 'tempoForno');
    const numeroCorretos = esperados.filter(id => selecionados.includes(id)).length;
    const extras = selecionados.filter(id => !esperados.includes(id)).length;
    const repetidos = selecionados.length - new Set(selecionados).size;
    const ingredientes = Math.max(0, Math.round(40 * numeroCorretos / esperados.length) - 10 * (extras + repetidos));
    const algoritmoEsperado = [...esperados, 'tempoForno'];
    const posicoesCorretas = algoritmoEsperado.filter((id, i) => sequencia[i] === id).length;
    const algoritmo = Math.round(30 * posicoesCorretas / algoritmoEsperado.length);
    const forno = sequencia[sequencia.length - 1] === 'tempoForno' && sequencia.filter(id => id === 'tempoForno').length === 1 ? 20 : 0;
    const segundosMontagem = Math.max(0, Math.round((Date.now() - (pedido.recebidoEm || Date.now())) / 1000));
    const atendimento = segundosMontagem <= 90 ? 10 : segundosMontagem <= 180 ? 7 : segundosMontagem <= 300 ? 4 : 1;
    return {
        idPedido: pedido.idPedido,
        nome: pedido.nome,
        pizzaNome: pedido.pizzaNome,
        tempoForno: pedido.tempoForno,
        recebidoEm: pedido.recebidoEm,
        segundosMontagem,
        sequencia,
        conferidos: numeroCorretos,
        esperados: esperados.length,
        faltantes: esperados.filter(id => !selecionados.includes(id)),
        extras: selecionados.filter((id, i) => !esperados.includes(id) || selecionados.indexOf(id) !== i),
        ordemCorreta: algoritmo === 30,
        temTempo: sequencia.includes('tempoForno'),
        pontos: { algoritmo, ingredientes, forno, atendimento },
        total: algoritmo + ingredientes + forno + atendimento,
        verificadoEm: Date.now()
    };
}
/* Os pontos de forno só são definitivos depois do DESLIGAMENTO manual.
   Até 15 segundos de atraso são tolerados; a cada 5 segundos adicionais
   iniciados, descontam-se 2 pontos. Desligar cedo também custa pontos. */
function pontuarCozimento(tempoIdeal, tempoReal, pontosMontagem = 20) {
    const ideal = Math.max(1, Number(tempoIdeal) || 1);
    const real = Math.max(0, Number(tempoReal) || 0);
    const diferenca = real - ideal;
    const penalidade = diferenca < 0
        ? Math.ceil((-diferenca) / 5) * 2
        : Math.ceil(Math.max(0, diferenca - 15) / 5) * 2;
    return Math.max(0, Math.min(20, Number(pontosMontagem) || 0) - penalidade);
}

function concluirPedido(dadosForno) {
    const partida = obterPartida();
    const idPedido = dadosForno?.idPedido;
    const pedido = buscarPedido(partida, idPedido);
    if (!pedido || partida.resultados.some(r => r.idPedido === idPedido)) return;
    const avaliacao = dadosForno.avaliacaoFinal || avaliarMontagem(pedido, []);
    // A montagem indica somente o máximo possível. O desligamento manual
    // determina os pontos de forno definitivos e, portanto, a nota final.
    const tempoRealForno = Math.max(0, Number(dadosForno.tempoRealForno) || 0);
    const pontosOriginais = avaliacao.pontos || {};
    const pontos = {
        ...pontosOriginais,
        forno: pontuarCozimento(pedido.tempoForno, tempoRealForno, pontosOriginais.forno)
    };
    const total = Object.values(pontos).reduce((soma, valor) => soma + (Number(valor) || 0), 0);
    const resultado = {
        ...avaliacao,
        pontos,
        total,
        atrasoForno: Math.max(0, Math.round(tempoRealForno - pedido.tempoForno)),
        idPedido,
        nome: pedido.nome,
        pizzaNome: pedido.pizzaNome,
        tempoRealForno,
        concluidoEm: Date.now()
    };
    partida.resultados.push(resultado);
    pedido.estado = 'concluido';
    if (partida.resultados.length >= partida.meta) {
        partida.concluidaEm = Date.now();
        desbloquearProximoNivel(partida.nivel);
    }
    salvarPartida(partida);
    salvarJSON(sessionStorage, CHAVES.pontuacao, resultado);
    atualizarConquistas(partida, resultado);
}
function atualizarConquistas(partida, resultado) {
    const perfil = obterPerfil();
    const conquistadas = new Set(perfil.conquistas);
    conquistadas.add('primeiro');
    if (resultado.total === 100) conquistadas.add('perfeito');
    if (resultado.segundosMontagem <= 60) conquistadas.add('ligeiro');
    if (partida.resultados.filter(r => r.total === 100).length >= 3) conquistadas.add('tresPerfeitos');
    if (partida.concluidaEm) conquistadas.add('nivelCompleto');
    if (partida.nivel === 'dificil' && partida.concluidaEm) conquistadas.add('dezClientes');
    perfil.conquistas = [...conquistadas];
    registrarDesempenho(perfil.desempenho, resultado);
    // Mantém somente os registros recentes para não sobrecarregar a URL file://.
    // As médias acumuladas acima NÃO são limitadas aos últimos 50 pedidos.
    perfil.historico.push({ nivel: partida.nivel, idPedido: resultado.idPedido, pizza: resultado.pizzaNome, pontos: resultado.total, quando: resultado.concluidoEm });
    perfil.historico = perfil.historico.slice(-50);
    salvarPerfil(perfil);
}

/* Exportação simples para a tela dos quatro fornos, sem duplicar regras. */
window.AlgoritmoNaMassa = { config, CHAVES, obterPartida, iniciarPartida, marcarPedidoNoForno, cancelarPedidoNoForno, concluirPedido, pontuarCozimento, navegar, sincronizarURL };

function atualizarHeader() {
    const cabeca = document.querySelector('.cabeca');
    if (!cabeca) return;
    const partida = obterPartida();
    const nivel = cabeca.querySelector('[data-nivel-atual]');
    const progresso = cabeca.querySelector('[data-progresso-texto]');
    const barra = cabeca.querySelector('.barra-preenchimento');
    if (nivel) {
        nivel.textContent = NIVEIS[partida?.nivel]?.rotulo || 'FÁCIL';
        nivel.className = partida?.nivel || 'facil';
    }
    if (progresso) progresso.textContent = `${partida?.resultados.length || 0}/${partida?.meta || 3} PIZZAS`;
    if (barra) barra.style.width = `${partida ? 100 * partida.resultados.length / partida.meta : 0}%`;
    const conquistas = obterPerfil().conquistas;
    cabeca.querySelectorAll('[data-conquista-header]').forEach(img => {
        const id = img.dataset.conquistaHeader;
        img.classList.toggle('conquistada', conquistas.includes(id));
        img.title = `${CONQUISTAS[id].nome} — ${CONQUISTAS[id].descricao}`;
        img.alt = CONQUISTAS[id].nome + (conquistas.includes(id) ? ' (conquistada)' : ' (bloqueada)');
    });
    const dicas = document.getElementById('dicas');
    if (dicas) {
        dicas.setAttribute('role', 'button');
        dicas.setAttribute('tabindex', '0');
        dicas.setAttribute('title', 'Dica de montagem');
        const mostrarDica = () => alert('Monte os blocos na ordem indicada na receita. Acrescente Tempo de Forno por último. Arraste, clique para adicionar e use ↑, ↓ ou × para organizar.');
        dicas.addEventListener('click', mostrarDica);
        dicas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrarDica(); } });
    }
}

/* NÍVEIS: fácil liberado; médio após terminar fácil; difícil após terminar médio. */
function iniciarPaginaNiveis() {
    if (!document.body.classList.contains('paginaNiveis')) return;
    ORDEM_NIVEIS.forEach((nivel, indice) => {
        const link = document.querySelector(`[data-iniciar-nivel="${nivel}"]`);
        if (!link) return;
        const liberado = nivelLiberado(nivel);
        const cartao = link.closest('.nivel');
        cartao?.classList.toggle('nivel-bloqueado', !liberado);
        if (liberado) {
            link.href = `pedidos.html?nivel=${nivel}`;
            link.textContent = 'JOGAR';
            link.removeAttribute('aria-disabled');
            link.removeAttribute('tabindex');
            link.removeAttribute('title');
        } else {
            link.removeAttribute('href');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1');
            link.textContent = '🔒 BLOQUEADO';
            const anterior = NIVEIS[ORDEM_NIVEIS[indice - 1]].rotulo;
            link.title = `Conclua o nível ${anterior} para desbloquear`;
            const descricao = cartao?.querySelector('p');
            if (descricao) descricao.title = `Conclua o nível ${anterior} para desbloquear`;
        }
    });
}

/* PEDIDOS: exatamente 3, 6 ou 10 clientes por partida, sorteados uma única vez. */
function iniciarPaginaPedidos() {
    const area = document.getElementById('backgroundDosPedidos');
    if (!area) return;
    const parametro = new URLSearchParams(location.search).get('nivel');
    const atual = obterPartida();
    const nivelSolicitado = parametro || atual?.nivel || 'facil';
    area.replaceChildren();
    if (!nivelLiberado(nivelSolicitado)) {
        const aviso = document.createElement('div');
        aviso.className = 'resumoPedidos';
        aviso.textContent = 'Este nível ainda está bloqueado. Conclua o nível anterior para liberá-lo.';
        const voltar = document.createElement('a');
        voltar.className = 'verResultadoPedidos';
        voltar.href = 'niveis.html';
        voltar.textContent = '← VOLTAR ÀS DIFICULDADES';
        area.append(aviso, voltar);
        return;
    }
    // Voltar à lista ou recarregar o mesmo nível não apaga pedidos nem fornos ativos.
    const partida = atual && atual.nivel === nivelSolicitado && !atual.concluidaEm
        ? atual : iniciarPartida(nivelSolicitado);

    const status = document.getElementById('mensagemPedidos');
    if (status) status.textContent = `Nível ${NIVEIS[partida.nivel].rotulo} • ${partida.resultados.length}/${partida.meta} pizzas concluídas`;
    const cabecalho = document.createElement('div');
    cabecalho.className = 'resumoPedidos';
    const titulo = document.createElement('h2');
    titulo.textContent = `PEDIDOS — ${NIVEIS[partida.nivel].rotulo}`;
    const resumo = document.createElement('p');
    resumo.textContent = `${partida.meta} clientes neste nível • ${partida.resultados.length} atendido(s)`;
    const linkFornos = document.createElement('a');
    linkFornos.href = 'fornos.html';
    linkFornos.textContent = 'VER FORNOS';
    const linkNiveis = document.createElement('a');
    linkNiveis.href = 'niveis.html';
    linkNiveis.textContent = 'TROCAR NÍVEL';
    const atalhos = document.createElement('div');
    atalhos.className = 'atalhosPedidos';
    const linkVoltar = document.createElement('a');
    linkVoltar.href = 'niveis.html';
    linkVoltar.textContent = '← VOLTAR';
    linkVoltar.title = 'Voltar para a seleção de dificuldade';
    atalhos.append(linkVoltar, linkFornos, linkNiveis);
    cabecalho.append(titulo, resumo, atalhos);
    area.appendChild(cabecalho);
    partida.pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido';
        const cliente = document.createElement('div');
        cliente.className = 'cliente';
        const img = document.createElement('img');
        img.src = pedido.imagem;
        img.alt = `Cliente ${pedido.nome}`;
        const nome = document.createElement('h4');
        nome.textContent = pedido.nome;
        const pizza = document.createElement('p');
        pizza.className = 'nomePizzaPedido';
        pizza.textContent = pedido.pizzaNome;
        const dados = document.createElement('div');
        dados.append(nome, pizza);
        cliente.append(img, dados);
        const aceitar = document.createElement('a');
        const estado = pedido.estado;
        aceitar.textContent = ({
            disponivel: 'RECEBER PEDIDO',
            emPreparo: 'CONTINUAR',
            noForno: 'NO FORNO',
            concluido: 'CONCLUÍDO ✓'
        })[estado] || 'RECEBER PEDIDO';
        aceitar.href = estado === 'noForno' ? 'fornos.html' : estado === 'concluido' ? 'pontuacao.html' : 'montagem.html';
        if (estado === 'concluido') card.classList.add('pedidoConcluido');
        if (estado !== 'noForno' && estado !== 'concluido') {
            aceitar.addEventListener('click', () => {
                const atual = obterPartida();
                const escolhido = buscarPedido(atual, pedido.idPedido);
                if (!escolhido) return;
                if (!escolhido.recebidoEm) escolhido.recebidoEm = Date.now();
                escolhido.estado = 'emPreparo';
                salvarPartida(atual);
                salvarJSON(sessionStorage, CHAVES.pedidoAtual, escolhido);
                try { sessionStorage.removeItem(CHAVES.validacao); } catch (_) {}
            });
        }
        card.append(cliente, aceitar);
        area.appendChild(card);
    });
    if (partida.concluidaEm) {
        const resultado = document.createElement('a');
        resultado.className = 'verResultadoPedidos';
        resultado.href = 'pontuacao.html';
        resultado.textContent = 'VER RESULTADO FINAL E CONQUISTAS';
        area.appendChild(resultado);
    }
}

/* MONTAGEM: o jogador monta uma pilha de blocos com drag-and-drop, reordenação e exclusão.
   Cliques na bandeja também adicionam blocos para funcionar no toque/teclado. */
function iniciarPaginaMontagem() {
    const bandeja = document.getElementById('bandejaIngredientes');
    const receita = document.getElementById('pedidoReceita');
    const area = document.getElementById('areaPizza');
    if (!bandeja || !receita || !area) return;
    atualizarHeader();
    const pedido = lerJSON(sessionStorage, CHAVES.pedidoAtual);
    const partida = obterPartida();
    const original = buscarPedido(partida, pedido?.idPedido);
    if (!pedido || !original || original.estado === 'concluido' || original.estado === 'noForno') {
        receita.textContent = 'Nenhum pedido em montagem. Volte para a lista de clientes.';
        const btn = document.getElementById('botaoVerificar');
        if (btn) btn.disabled = true;
        return;
    }
    bandeja.replaceChildren();
    receita.replaceChildren();
    const titulo = document.createElement('div');
    titulo.className = 'itemPedido';
    titulo.textContent = `${pedido.nome}: ${pedido.pizzaNome}`;
    receita.appendChild(titulo);
    pedido.ingredientes.forEach((id, i) => {
        const item = document.createElement('div');
        item.className = 'itemPedido';
        item.textContent = `${i + 1} - ${config.ingredientes[id]?.nome || id}`;
        receita.appendChild(item);
    });
    const itemTempo = document.createElement('div');
    itemTempo.className = 'itemPedido tempoPedido';
    itemTempo.textContent = `◷ ${formatarTempo(pedido.tempoForno)} min`;
    receita.appendChild(itemTempo);
    const tempoValor = document.getElementById('tempoFornoValor');
    if (tempoValor) tempoValor.textContent = formatarTempo(pedido.tempoForno);

    const instrucoes = document.createElement('p');
    instrucoes.className = 'instrucoesMontagem';
    instrucoes.textContent = 'Arraste os blocos ou clique para adicionar. Organize na ordem da receita e coloque o tempo por último.';
    const pilha = document.createElement('div');
    pilha.id = 'pilhaAlgoritmo';
    pilha.setAttribute('aria-label', 'Sequência de preparação');
    const vazio = document.createElement('p');
    vazio.className = 'pilhaVazia';
    vazio.textContent = 'Solte os blocos aqui para montar o algoritmo 🍕';
    const aviso = document.createElement('p');
    aviso.className = 'avisoMontagem';
    aviso.setAttribute('role', 'status');
    area.replaceChildren(instrucoes, pilha, vazio, aviso);
    let arrastando = null;

    function atualizarPilha() {
        const elementos = [...pilha.children];
        vazio.hidden = elementos.length > 0;
        elementos.forEach((item, indice) => {
            item.querySelector('[data-acao="cima"]').disabled = indice === 0;
            item.querySelector('[data-acao="baixo"]').disabled = indice === elementos.length - 1;
            item.setAttribute('aria-label', `Etapa ${indice + 1}: ${item.dataset.rotulo}`);
        });
        aviso.textContent = `${elementos.length} etapa(s) na sequência.`;
    }
    function montarBloco(id, posicao = pilha.children.length) {
        if (id === 'tempoForno' && pilha.querySelector('[data-ingrediente="tempoForno"]')) {
            aviso.textContent = 'O tempo de forno já foi adicionado.';
            return;
        }
        const info = id === 'tempoForno' ? { nome: `Tempo de Forno · ${formatarTempo(pedido.tempoForno)}`, cor: '#16b6df' } : config.ingredientes[id];
        if (!info) return;
        const bloco = document.createElement('div');
        bloco.className = 'ingredienteMontado';
        bloco.dataset.ingrediente = id;
        bloco.dataset.rotulo = info.nome;
        bloco.style.backgroundColor = info.cor;
        bloco.draggable = true;
        const rotulo = document.createElement('span');
        rotulo.className = 'blocoRotulo';
        rotulo.textContent = info.nome;
        const comandos = document.createElement('span');
        comandos.className = 'acoesBloco';
        [['cima', '↑', 'Subir etapa'], ['baixo', '↓', 'Descer etapa'], ['excluir', '×', 'Remover ingrediente']].forEach(([acao, texto, descricao]) => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'acaoBloco';
            botao.dataset.acao = acao;
            botao.textContent = texto;
            botao.title = descricao;
            botao.setAttribute('aria-label', descricao + ': ' + info.nome);
            comandos.appendChild(botao);
        });
        bloco.append(rotulo, comandos);
        pilha.insertBefore(bloco, pilha.children[Math.max(0, posicao)] || null);
        atualizarPilha();
    }
    function prepararFonte(el, id) {
        el.draggable = true;
        el.dataset.ingrediente = id;
        el.title = 'Arraste para a área central ou clique para adicionar';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('click', () => montarBloco(id));
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montarBloco(id); } });
        el.addEventListener('dragstart', e => {
            arrastando = { origem: 'bandeja', id };
            e.dataTransfer.setData('text/plain', id);
            e.dataTransfer.effectAllowed = 'copy';
        });
    }
    Object.entries(config.ingredientes).forEach(([id, ingrediente]) => {
        const bloco = document.createElement('div');
        bloco.className = 'blocoPizza';
        bloco.id = id;
        bloco.textContent = ingrediente.nome;
        bloco.style.backgroundColor = ingrediente.cor;
        bandeja.appendChild(bloco);
        prepararFonte(bloco, id);
    });
    const tempoFonte = document.getElementById('tempoFornoBloco');
    if (tempoFonte) prepararFonte(tempoFonte, 'tempoForno');

    pilha.addEventListener('click', e => {
        const botao = e.target.closest('button[data-acao]');
        if (!botao) return;
        const bloco = botao.closest('.ingredienteMontado');
        if (!bloco) return;
        const acao = botao.dataset.acao;
        if (acao === 'excluir') bloco.remove();
        else if (acao === 'cima' && bloco.previousElementSibling) pilha.insertBefore(bloco, bloco.previousElementSibling);
        else if (acao === 'baixo' && bloco.nextElementSibling) pilha.insertBefore(bloco.nextElementSibling, bloco);
        atualizarPilha();
    });
    pilha.addEventListener('contextmenu', e => {
        const bloco = e.target.closest('.ingredienteMontado');
        if (!bloco) return;
        e.preventDefault();
        bloco.remove();
        atualizarPilha();
    });
    pilha.addEventListener('dragstart', e => {
        const bloco = e.target.closest('.ingredienteMontado');
        if (!bloco) return;
        arrastando = { origem: 'pilha', bloco };
        e.dataTransfer.setData('text/plain', bloco.dataset.ingrediente);
        e.dataTransfer.effectAllowed = 'move';
        bloco.classList.add('blocoArrastando');
    });
    document.addEventListener('dragend', () => {
        pilha.querySelectorAll('.blocoArrastando').forEach(b => b.classList.remove('blocoArrastando'));
        arrastando = null;
        area.classList.remove('areaRecebendo');
    });
    area.addEventListener('dragover', e => {
        if (!arrastando) return;
        e.preventDefault();
        area.classList.add('areaRecebendo');
        e.dataTransfer.dropEffect = arrastando.origem === 'bandeja' ? 'copy' : 'move';
    });
    area.addEventListener('dragleave', e => { if (!area.contains(e.relatedTarget)) area.classList.remove('areaRecebendo'); });
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('areaRecebendo');
        if (!arrastando) return;
        const sobre = e.target.closest('.ingredienteMontado');
        const indice = sobre && pilha.contains(sobre) ? [...pilha.children].indexOf(sobre) + (e.clientY > sobre.getBoundingClientRect().top + sobre.offsetHeight / 2 ? 1 : 0) : pilha.children.length;
        if (arrastando.origem === 'bandeja') montarBloco(arrastando.id, indice);
        else if (arrastando.origem === 'pilha') {
            const bloco = arrastando.bloco;
            if (bloco && pilha.contains(bloco)) pilha.insertBefore(bloco, pilha.children[indice] || null);
            atualizarPilha();
        }
        arrastando = null;
    });
    document.getElementById('botaoVerificar')?.addEventListener('click', () => {
        const sequencia = [...pilha.children].map(bloco => bloco.dataset.ingrediente);
        const avaliacao = avaliarMontagem(pedido, sequencia);
        salvarJSON(sessionStorage, CHAVES.validacao, avaliacao);
        navegar('validacao.html');
    });
}

/* VALIDAÇÃO: exibe o diagnóstico verdadeiro e permite tentar de novo. */
function iniciarPaginaValidacao() {
    const botaoAssar = document.getElementById('assaarPizza');
    if (!botaoAssar) return;
    const avaliacao = lerJSON(sessionStorage, CHAVES.validacao);
    const pedido = lerJSON(sessionStorage, CHAVES.pedidoAtual);
    const info = document.getElementById('resumoValidacao');
    const certo = document.getElementById('validacaoCorreta');
    const errado = document.getElementById('validacaoErrada');
    const voltar = document.getElementById('tentarNovamente');
    if (!pedido || !avaliacao || pedido.idPedido !== avaliacao.idPedido) {
        if (info) info.textContent = 'Não há uma montagem para verificar. Volte aos pedidos.';
        if (voltar) { voltar.href = 'pedidos.html'; voltar.textContent = 'VER PEDIDOS'; }
        botaoAssar.hidden = true;
        return;
    }
    if (info) info.textContent = `${pedido.nome} • ${pedido.pizzaNome} • até ${avaliacao.total}/100 pontos (nota final depende do desligamento manual do forno)`;
    if (certo) {
        certo.querySelector('p:nth-of-type(1)').textContent = `Ingredientes: ${avaliacao.conferidos}/${avaliacao.esperados}`;
        certo.querySelector('p:nth-of-type(2)').textContent = `Ordem correta: ${avaliacao.ordemCorreta ? 'sim' : 'não'}`;
    }
    if (errado) {
        errado.querySelector('p:nth-of-type(1)').textContent = avaliacao.faltantes.length || avaliacao.extras.length ? `Faltas/extras: ${avaliacao.faltantes.length}/${avaliacao.extras.length}` : 'Ingredientes sem erros';
        errado.querySelector('p:nth-of-type(2)').textContent = `Tempo no final: ${avaliacao.pontos.forno === 20 ? 'sim' : 'não'}`;
    }
    if (voltar) voltar.href = 'montagem.html';
    botaoAssar.textContent = avaliacao.total === 100 ? 'ASSAR PIZZA' : 'ASSAR MESMO ASSIM';
    botaoAssar.addEventListener('click', e => {
        e.preventDefault();
        const partida = obterPartida();
        const original = buscarPedido(partida, pedido.idPedido);
        if (!original || original.estado === 'noForno' || original.estado === 'concluido') return;
        const fila = lerJSON(sessionStorage, CHAVES.fila, []);
        if (!Array.isArray(fila)) return;
        if (!fila.some(p => p.idPedido === pedido.idPedido)) {
            fila.push({
                pizzaNome: pedido.pizzaNome,
                nome: pedido.nome,
                idPedido: pedido.idPedido,
                tempoForno: pedido.tempoForno,
                recebidoEm: pedido.recebidoEm,
                avaliacaoFinal: avaliacao
            });
            if (!salvarJSON(sessionStorage, CHAVES.fila, fila)) return;
        }
        marcarPedidoNoForno(pedido.idPedido);
        navegar('fornos.html');
    });
}


/* PONTUAÇÃO: apresenta o desempenho geral do aluno. */
function iniciarPaginaPontuacao() {
    const titulo = document.getElementById('tituloPontuacao');
    if (!titulo) return;

    const partida = obterPartida();
    const atual = lerJSON(sessionStorage, CHAVES.pontuacao);
    const final = Boolean(partida?.concluidaEm);
    const resultados = partida?.resultados || [];
    const considerados = final ? resultados : atual ? [atual] : [];

    if (!considerados.length) {
        titulo.textContent = 'AINDA SEM PONTUAÇÃO';
        document.getElementById('totalPontos').textContent = 'Prepare uma pizza para começar!';
        document.getElementById('proximaTela').href = 'pedidos.html';
        return;
    }

    titulo.textContent = final ? 'PONTUAÇÃO FINAL' : 'PONTUAÇÃO DO PEDIDO';

    const totais = {
        algoritmo: 0,
        ingredientes: 0,
        forno: 0,
        atendimento: 0
    };

    considerados.forEach(r => {
        Object.keys(totais).forEach(chave => {
            totais[chave] += Number(r.pontos?.[chave]) || 0;
        });
    });

    const quantidade = considerados.length;

    const definir = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    };

    definir('pontosAlgoritmo', `${totais.algoritmo}/${30 * quantidade} pts`);
    definir('pontosIngredientes', `${totais.ingredientes}/${40 * quantidade} pts`);
    definir('pontosForno', `${totais.forno}/${20 * quantidade} pts`);
    definir('pontosAtendimento', `${totais.atendimento}/${10 * quantidade} pts`);

    definir('detalheAlgoritmo', final
        ? `Sequência em ${quantidade} pizzas`
        : atual.ordemCorreta
            ? 'Ordem perfeita dos blocos'
            : 'A ordem da receita pode melhorar'
    );

    definir('detalheIngredientes', final
        ? 'Ingredientes somados em toda a partida'
        : `${atual.conferidos}/${atual.esperados} ingredientes esperados`
    );

    definir('detalheForno', final
        ? 'Cozimento e desligamento manual dos fornos'
        : `Tempo real: ${formatarTempo(atual.tempoRealForno)} • ideal: ${formatarTempo(atual.tempoForno)} • atraso: ${atual.atrasoForno || 0}s`
    );

    definir('detalheAtendimento', final
        ? 'Agilidade na montagem'
        : `Montagem: ${formatarTempo(atual.segundosMontagem)}`
    );

    const soma = Object.values(totais).reduce((a, b) => a + b, 0);
    const maximo = quantidade * 100;

    definir('totalPontos', `Total: ${soma}/${maximo} Pontos`);

    const porcentagem = soma / maximo;

    definir('desempenhoPontos',
        `DESEMPENHO: ${
            porcentagem >= 0.9 ? 'EXCELENTE ⭐⭐⭐' :
            porcentagem >= 0.7 ? 'MUITO BOM ⭐⭐' :
            porcentagem >= 0.5 ? 'BOM ⭐' :
            'CONTINUE PRATICANDO'
        }`
    );

    const proxima = document.getElementById('proximaTela');

    if (proxima) {
        proxima.href = final ? 'niveis.html' : 'pedidos.html';
        proxima.textContent = final ? 'JOGAR NOVAMENTE' : 'PRÓXIMO PEDIDO';
    }

    const subtitulo = document.getElementById('subtituloPontuacao');

    if (subtitulo) {
        subtitulo.textContent = final
            ? `${NIVEIS[partida.nivel].rotulo}: ${resultados.length} de ${partida.meta} clientes atendidos`
            : `${atual.nome} • ${atual.pizzaNome} • ${resultados.length}/${partida.meta} concluídos`;
    }

    // DESEMPENHO GERAL
    const perfil = obterPerfil();
    const painel = document.getElementById('historicoPontuacao');

    if (painel) {
        painel.replaceChildren();

        const dados = perfil.desempenho;

        const escrever = (tag, texto, classe) => {
            const el = document.createElement(tag);
            el.textContent = texto;

            if (classe) el.className = classe;

            painel.appendChild(el);
            return el;
        };

        escrever('strong', 'DESEMPENHO GERAL');

        escrever(
            'p',
            `Média de todos os níveis: ${numeroDesempenho(
                dados.somaTotal / Math.max(1, dados.quantidade)
            )}/100 • ${dados.quantidade} pedido(s) avaliados`,
            'mediaDesempenho'
        );

        // Médias por habilidade
        const disponiveis = Object.entries(CRITERIOS_DESEMPENHO)
            .map(([id, criterio]) => ({
                ...criterio,
                id,
                dados: dados.criterios[id]
            }))
            .filter(c => c.dados.quantidade > 0)
            .map(c => ({
                ...c,
                media: c.dados.soma / c.dados.quantidade
            }));

        disponiveis.forEach(c => {
            const linha = document.createElement('div');
            linha.className = 'linhaDesempenho';

            const rotulo = document.createElement('span');
            rotulo.textContent = c.nome;

            const valor = document.createElement('strong');
            valor.textContent = `${numeroDesempenho(c.media)}/${c.max}`;

            linha.append(rotulo, valor);
            painel.appendChild(linha);
        });
    }
}


if (document.body.classList.contains('paginaNiveis')) iniciarPaginaNiveis();
if (document.getElementById('backgroundDosPedidos')) iniciarPaginaPedidos();
if (document.getElementById('areaPizza')) iniciarPaginaMontagem();
if (document.getElementById('assaarPizza')) iniciarPaginaValidacao();
if (document.getElementById('tituloPontuacao')) iniciarPaginaPontuacao();
