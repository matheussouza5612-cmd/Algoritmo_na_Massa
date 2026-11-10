/* QUATRO FORNOS INDEPENDENTES - ALTERA SOMENTE A PÁGINA DOS FORNOS.
   A montagem passa os pedidos pela chave "filaPizzasForno" da sessionStorage.
   Os segundos são calculados pelo relógio real; continuam contando mesmo em outra tela. */
(() => {
    "use strict";

    const CHAVE_FORNOS = "algoritmoNaMassa.fornos.v1";
    const CHAVE_FILA = "filaPizzasForno";
    const QUANTIDADE = 4;
    const nomesStatus = {
        vazio: "LIVRE",
        aguardando: "PRONTO PARA ASSAR",
        assando: "ASSANDO...",
        pausado: "PAUSADO",
        pronto: "PIZZA PRONTA!"
    };

    const grade = document.getElementById("gradeFornos");
    const resumo = document.getElementById("resumoFila");
    const mensagem = document.getElementById("mensagemFornos");
    if (!grade || !resumo) return;

    const fornoVazio = () => ({ status: "vazio", pizza: null, duracao: 0, restantes: 0, terminaEm: null });
    const lerJSON = (chave, padrao) => {
        try {
            const valor = JSON.parse(sessionStorage.getItem(chave));
            return valor == null ? padrao : valor;
        } catch (_) { return padrao; }
    };
    let fornos = lerJSON(CHAVE_FORNOS, []);
    if (!Array.isArray(fornos)) fornos = [];
    fornos = Array.from({ length: QUANTIDADE }, (_, i) => {
        const forno = fornos[i];
        return forno && ["vazio", "aguardando", "assando", "pausado", "pronto"].includes(forno.status)
            ? forno
            : fornoVazio();
    });
    let fila = lerJSON(CHAVE_FILA, []);
    if (!Array.isArray(fila)) fila = [];

    const salvar = () => {
        sessionStorage.setItem(CHAVE_FORNOS, JSON.stringify(fornos));
        sessionStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
    };
    const segundosValidos = (valor) => Math.max(1, Math.min(7200, Math.round(Number(valor) || 130)));
    const formatarTempo = (valor) => {
        const tempo = Math.max(0, Math.ceil(Number(valor) || 0));
        return `${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, "0")}`;
    };
    const restantesAgora = (forno) => forno.status === "assando"
        ? Math.max(0, Math.ceil((Number(forno.terminaEm) - Date.now()) / 1000))
        : Math.max(0, Number(forno.restantes) || 0);
    const avisar = (texto) => { mensagem.textContent = texto; };

    function atualizarFornosConcluidos() {
        let houveMudanca = false;
        fornos.forEach((forno) => {
            if (forno.status === "assando" && restantesAgora(forno) <= 0) {
                forno.status = "pronto";
                forno.restantes = 0;
                forno.terminaEm = null;
                forno.concluidoEm = Date.now();
                houveMudanca = true;
            }
        });
        if (houveMudanca) {
            salvar();
            avisar("🍕 Pizza pronta! Clique em VERIFICAR para conferir sua pontuação.");
        }
    }

    function colocarPizzaEmForno(pizza, indice) {
        const tempo = segundosValidos(pizza.tempoForno);
        fornos[indice] = {
            status: "aguardando",
            pizza: {
                nome: String(pizza.pizzaNome || "Pizza"),
                cliente: String(pizza.nome || pizza.nomeCliente || "Cliente"),
                idPedido: pizza.idPedido || `teste-${Date.now()}-${indice}`,
                tempoPrevisto: tempo,
                primeiraTentativa: pizza.primeiraTentativa || null,
                avaliacaoFinal: pizza.avaliacaoFinal || null,
                recebidoEm: Number(pizza.recebidoEm) || Date.now(),
                demonstracao: !pizza.avaliacaoFinal
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
            const indiceLivre = fornos.findIndex((forno) => forno.status === "vazio");
            if (indiceLivre === -1) break;
            const pizza = fila.shift();
            if (!pizza || typeof pizza !== "object") continue;
            colocarPizzaEmForno(pizza, indiceLivre);
            colocadas++;
        }
        if (colocadas > 0) {
            salvar();
            avisar(`${colocadas} pizza(s) chegou/chegaram da montagem. Escolha COMEÇAR A ASSAR em cada forno.`);
        }
    }

    function mostrarEstado() {
        atualizarFornosConcluidos();
        fornos.forEach((forno, indice) => {
            const cartao = grade.querySelector(`[data-slot="${indice}"].forno`);
            if (!cartao) return;
            cartao.dataset.status = forno.status;
            cartao.querySelector('[data-campo="estado"]').textContent = nomesStatus[forno.status];
            cartao.querySelector('[data-campo="pizza"]').textContent = forno.pizza
                ? `${forno.pizza.nome} • ${forno.pizza.cliente}` : "Aguardando pizza...";
            const restantes = restantesAgora(forno);
            cartao.querySelector('[data-campo="tempo"]').textContent = formatarTempo(restantes);
            const progresso = forno.duracao > 0
                ? Math.max(0, Math.min(100, ((forno.duracao - restantes) / forno.duracao) * 100)) : 0;
            cartao.querySelector(".preenchimento").style.width = `${progresso}%`;
            cartao.querySelector(".trilho").setAttribute("aria-valuenow", String(Math.round(progresso)));

            const principal = cartao.querySelector('[data-acao="principal"]');
            const secundaria = cartao.querySelector('[data-acao="secundaria"]');
            principal.disabled = forno.status === "vazio";
            principal.textContent = ({
                vazio: "AGUARDANDO PIZZA",
                aguardando: "COMEÇAR A ASSAR",
                assando: "PAUSAR CRONÔMETRO",
                pausado: "RETOMAR FORNO",
                pronto: "VERIFICAR"
            })[forno.status];
            secundaria.hidden = !["aguardando", "pausado"].includes(forno.status);
            secundaria.textContent = forno.status === "aguardando" ? "CANCELAR PIZZA" : "RETIRAR SEM ASSAR";
        });
        const ativos = fornos.filter((forno) => forno.status === "assando").length;
        const livres = fornos.filter((forno) => forno.status === "vazio").length;
        resumo.textContent = `${ativos} assando • ${livres} livre(s) • ${fila.length} na fila`;
    }

    function executarAcao(indice, tipo) {
        if (!Number.isInteger(indice) || indice < 0 || indice >= QUANTIDADE) return;
        atualizarFornosConcluidos();
        const forno = fornos[indice];
        if (tipo === "principal") {
            switch (forno.status) {
                case "aguardando":
                case "pausado": {
                    // Captura o saldo ANTES de mudar o status: caso contrário,
                    // o relógio tentaria usar terminaEm ainda vazio e zeraria.
                    const tempoRestante = restantesAgora(forno);
                    forno.restantes = tempoRestante;
                    forno.terminaEm = Date.now() + tempoRestante * 1000;
                    forno.iniciadoEm = Date.now();
                    forno.status = "assando";
                    avisar(`Forno ${indice + 1} assando. Os outros fornos continuam independentes.`);
                    break;
                }
                case "assando":
                    forno.restantes = restantesAgora(forno);
                    forno.assadoSegundos = (forno.assadoSegundos || 0) + Math.max(0, forno.duracao - forno.restantes - (forno.assadoSegundos || 0));
                    forno.terminaEm = null;
                    forno.status = "pausado";
                    avisar(`Forno ${indice + 1} pausado; os outros continuam assando.`);
                    break;
                case "pronto": {
                    const dados = {
                        ...forno.pizza,
                        tempoRealForno: forno.duracao - forno.restantes,
                        concluidoEm: forno.concluidoEm || Date.now(),
                        verificadoEm: Date.now()
                    };
                    // Guarda o resultado ANTES de liberar o slot e mudar de página.
                    sessionStorage.setItem("algoritmoNaMassa.pontuacaoAtual", JSON.stringify(dados));
                    fornos[indice] = fornoVazio();
                    distribuirFila();
                    salvar();
                    window.location.href = "pontuacao.html";
                    return;
                }
                default: return;
            }
        } else if (tipo === "secundaria") {
            if (forno.status === "aguardando") {
                fornos[indice] = fornoVazio();
                avisar(`Pizza cancelada no forno ${indice + 1}.`);
            } else if (forno.status === "pausado") {
                fornos[indice] = fornoVazio();
                avisar(`Pizza retirada sem terminar de assar no forno ${indice + 1}.`);
            } else return;
            distribuirFila();
        } else return;
        salvar();
        mostrarEstado();
    }

    grade.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao || !grade.contains(botao)) return;
        executarAcao(Number(botao.dataset.slot), botao.dataset.acao);
    });

    let numeroTeste = 0;
    document.getElementById("botaoDemo").addEventListener("click", () => {
        numeroTeste++;
        // Durações diferentes ajudam a demonstrar os quatro cronômetros na apresentação.
        const temposTeste = [40, 75, 110, 95];
        fila.push({
            pizzaNome: `Pizza de teste ${numeroTeste}`,
            nomeCliente: "Demonstração",
            tempoForno: temposTeste[(numeroTeste - 1) % temposTeste.length]
        });
        distribuirFila();
        if (fila.length) avisar("Os quatro fornos estão ocupados. A pizza de teste ficou na fila.");
        salvar();
        mostrarEstado();
    });

    atualizarFornosConcluidos();
    distribuirFila();
    mostrarEstado();
    setInterval(mostrarEstado, 250);
})();
