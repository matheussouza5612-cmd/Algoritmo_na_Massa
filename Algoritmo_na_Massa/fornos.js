/* Quatro fornos independentes. O fim do tempo IDEAL nunca desliga um forno:
   somente a ação manual do jogador congela o tempo usado para pontuar. */
(() => {
    'use strict';
    const CHAVE_FORNOS = 'algoritmoNaMassa.fornos.v1';
    const CHAVE_FILA = 'filaPizzasForno';
    const QUANTIDADE = 4;
    const nomesStatus = {
        vazio: 'LIVRE',
        aguardando: 'PRONTO PARA ASSAR',
        assando: 'ASSANDO...',
        pausado: 'PAUSADO',
        pronto: 'FORNO DESLIGADO'
    };
    const grade = document.getElementById('gradeFornos');
    const resumo = document.getElementById('resumoFila');
    const mensagem = document.getElementById('mensagemFornos');
    if (!grade || !resumo) return;

    const fornoVazio = () => ({ status: 'vazio', pizza: null, duracao: 0,
        restantes: 0, terminaEm: null, assadoSegundos: 0, iniciadoEm: null, concluidoEm: null });
    const lerJSON = (chave, padrao) => {
        try { return JSON.parse(sessionStorage.getItem(chave)) ?? padrao; }
        catch (_) { return padrao; }
    };
    let fornos = lerJSON(CHAVE_FORNOS, []);
    if (!Array.isArray(fornos)) fornos = [];
    fornos = Array.from({ length: QUANTIDADE }, (_, i) => {
        const forno = fornos[i];
        return forno && ['vazio', 'aguardando', 'assando', 'pausado', 'pronto'].includes(forno.status)
            ? forno : fornoVazio();
    });
    let fila = lerJSON(CHAVE_FILA, []);
    if (!Array.isArray(fila)) fila = [];

    const salvar = () => {
        sessionStorage.setItem(CHAVE_FORNOS, JSON.stringify(fornos));
        sessionStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
        window.AlgoritmoNaMassa?.sincronizarURL();
    };
    const segundosValidos = (valor) => Math.max(1, Math.min(7200, Math.round(Number(valor) || 60)));
    const formatarTempo = (valor) => {
        const tempo = Math.max(0, Math.floor(Number(valor) || 0));
        return `${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, '0')}`;
    };
    const avisar = (texto) => { if (mensagem) mensagem.textContent = texto; };

    // O tempo efetivo é a soma de intervalos ativos. Tempo pausado não conta.
    // Usa Date.now(), por isso persiste mesmo quando o navegador muda de página.
    function tempoAssado(forno, agora = Date.now()) {
        const acumulado = Math.max(0, Number(forno.assadoSegundos) || 0);
        if (forno.status !== 'assando') return acumulado;
        // Compatibilidade com partidas gravadas na versão antiga do jogo.
        if (!Number.isFinite(Number(forno.iniciadoEm)) || !forno.iniciadoEm) {
            return Math.max(acumulado, Number(forno.duracao) - Number(forno.restantes || 0));
        }
        return acumulado + Math.max(0, (agora - Number(forno.iniciadoEm)) / 1000);
    }
    function colocarPizzaEmForno(pizza, indice) {
        const tempo = segundosValidos(pizza.tempoForno);
        fornos[indice] = {
            status: 'aguardando',
            pizza: {
                nome: String(pizza.pizzaNome || 'Pizza'),
                cliente: String(pizza.nome || pizza.nomeCliente || 'Cliente'),
                idPedido: pizza.idPedido,
                tempoPrevisto: tempo,
                avaliacaoFinal: pizza.avaliacaoFinal || null,
                recebidoEm: Number(pizza.recebidoEm) || Date.now()
            },
            duracao: tempo,
            restantes: tempo,
            terminaEm: null,
            assadoSegundos: 0,
            iniciadoEm: null,
            concluidoEm: null
        };
    }
    function distribuirFila() {
        let colocadas = 0;
        while (fila.length) {
            const indice = fornos.findIndex(f => f.status === 'vazio');
            if (indice < 0) break;
            const pizza = fila.shift();
            if (!pizza || typeof pizza !== 'object' || !pizza.idPedido) continue;
            colocarPizzaEmForno(pizza, indice);
            colocadas++;
        }
        if (colocadas) {
            salvar();
            avisar(`${colocadas} pizza(s) recebida(s). Inicie cada forno manualmente.`);
        }
    }
    function mostrarEstado() {
        fornos.forEach((forno, indice) => {
            const cartao = grade.querySelector(`[data-slot="${indice}"].forno`);
            if (!cartao) return;
            const tempo = tempoAssado(forno);
            const restante = forno.duracao - tempo;
            const atraso = Math.max(0, Math.floor(-restante));
            cartao.dataset.status = forno.status;
            cartao.querySelector('[data-campo="estado"]').textContent = forno.status === 'assando' && atraso > 15
                ? 'ATRASADO! DESLIGUE' : forno.status === 'assando' && restante <= 0
                    ? 'TEMPO IDEAL! DESLIGUE' : nomesStatus[forno.status];
            cartao.querySelector('[data-campo="pizza"]').textContent = forno.pizza
                ? `${forno.pizza.nome} • ${forno.pizza.cliente}` : 'Aguardando pizza...';
            const tempoEl = cartao.querySelector('[data-campo="tempo"]');
            tempoEl.textContent = forno.status === 'vazio' ? '0:00'
                : restante <= 0 ? `+${formatarTempo(atraso)}` : formatarTempo(Math.ceil(restante));
            tempoEl.title = forno.status === 'assando' && restante <= 0
                ? `Atraso: ${atraso}s (tolerância de 15s). Desligue manualmente.`
                : `Tempo ideal: ${formatarTempo(forno.duracao)}`;
            const progresso = forno.duracao > 0
                ? Math.max(0, Math.min(100, tempo / forno.duracao * 100)) : 0;
            cartao.querySelector('.preenchimento').style.width = `${progresso}%`;
            cartao.querySelector('.trilho').setAttribute('aria-valuenow', String(Math.round(progresso)));
            const principal = cartao.querySelector('[data-acao="principal"]');
            const secundaria = cartao.querySelector('[data-acao="secundaria"]');
            principal.disabled = forno.status === 'vazio';
            principal.textContent = ({
                vazio: 'AGUARDANDO PIZZA',
                aguardando: 'COMEÇAR A ASSAR',
                assando: 'DESLIGAR FORNO',
                pausado: 'RETOMAR FORNO',
                pronto: 'VERIFICAR'
            })[forno.status];
            secundaria.hidden = !['aguardando', 'assando', 'pausado'].includes(forno.status);
            secundaria.textContent = ({
                aguardando: 'CANCELAR PIZZA',
                assando: 'PAUSAR',
                pausado: 'DESLIGAR FORNO'
            })[forno.status] || '';
        });
        const ativos = fornos.filter(f => f.status === 'assando').length;
        const livres = fornos.filter(f => f.status === 'vazio').length;
        resumo.textContent = `${ativos} assando • ${livres} livre(s) • ${fila.length} na fila`;
    }
    function desligar(forno, indice) {
        const total = tempoAssado(forno);
        forno.assadoSegundos = total;
        forno.restantes = Math.max(0, forno.duracao - total);
        forno.terminaEm = null;
        forno.iniciadoEm = null;
        forno.concluidoEm = Date.now();
        forno.status = 'pronto';
        const diferenca = Math.floor(total - forno.duracao);
        const nota = window.AlgoritmoNaMassa?.pontuarCozimento(
            forno.duracao, total, forno.pizza?.avaliacaoFinal?.pontos?.forno ?? 20
        );
        avisar(`Forno ${indice + 1} desligado manualmente. ${diferenca < 0 ? `Faltaram ${-diferenca}s.` : `Atraso: ${Math.max(0, diferenca)}s.`} Pontos de forno: ${nota ?? 'a calcular'}/20. Clique em VERIFICAR.`);
    }
    function executarAcao(indice, tipo) {
        if (!Number.isInteger(indice) || indice < 0 || indice >= QUANTIDADE) return;
        const forno = fornos[indice];
        if (tipo === 'principal') {
            switch (forno.status) {
                case 'aguardando':
                case 'pausado':
                    forno.iniciadoEm = Date.now();
                    forno.terminaEm = null;
                    forno.status = 'assando';
                    avisar(`Forno ${indice + 1} ligado. Os demais continuam independentes.`);
                    break;
                case 'assando':
                    desligar(forno, indice);
                    break;
                case 'pronto': {
                    const dados = {
                        ...forno.pizza,
                        tempoRealForno: forno.assadoSegundos,
                        concluidoEm: forno.concluidoEm,
                        verificadoEm: Date.now()
                    };
                    window.AlgoritmoNaMassa?.concluirPedido(dados);
                    fornos[indice] = fornoVazio();
                    distribuirFila();
                    salvar();
                    window.AlgoritmoNaMassa?.navegar('pontuacao.html');
                    return;
                }
                default: return;
            }
        } else if (tipo === 'secundaria') {
            switch (forno.status) {
                case 'aguardando':
                    window.AlgoritmoNaMassa?.cancelarPedidoNoForno(forno.pizza?.idPedido);
                    fornos[indice] = fornoVazio();
                    distribuirFila();
                    avisar(`Pizza cancelada no forno ${indice + 1}.`);
                    break;
                case 'assando':
                    forno.assadoSegundos = tempoAssado(forno);
                    forno.iniciadoEm = null;
                    forno.terminaEm = null;
                    forno.status = 'pausado';
                    avisar(`Forno ${indice + 1} pausado; os outros continuam assando.`);
                    break;
                case 'pausado':
                    desligar(forno, indice);
                    break;
                default: return;
            }
        } else return;
        salvar();
        mostrarEstado();
    }
    grade.addEventListener('click', e => {
        const botao = e.target.closest('button[data-acao]');
        if (!botao || !grade.contains(botao)) return;
        executarAcao(Number(botao.dataset.slot), botao.dataset.acao);
    });
    distribuirFila();
    mostrarEstado();
    setInterval(mostrarEstado, 250);
})();
