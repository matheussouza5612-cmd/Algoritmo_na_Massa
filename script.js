// ==========================================
// CONFIGURAÇÕES E FLUXO DE PEDIDOS
// Temporariamente, as configurações ficam aqui no próprio JavaScript.
// Não é necessário Node.js nem carregar presets/config.json.
// ==========================================
const config = {
    "nomes": [
        {
            "nome": "Eu",
            "genero": "masculino"
        }
    ],
    "sobrenomes": [
        "não tem ainda",
        "tem ainda"
    ],
    "ingredientes": {
        "pepperoni": {
            "nome": "Pepperoni",
            "cor": "#8e2525"
        },
        "massa": {
            "nome": "Massa",
            "cor": "#f8c891"
        },
        "queijo": {
            "nome": "Queijo",
            "cor": "#f29d26"
        },
        "molho": {
            "nome": "molho",
            "cor": "#cb2a2a"
        }
    },
    "pizzas": {
        "pizza_de_seila": {
            "nome": "Pizza de seila",
            "ingredientes": [
                "pepperoni",
                "massa",
                "queijo",
                "molho"
            ],
            "tempoForno": 130
        }
    }
}



function formatarTempo(segundos) {
    segundos = Math.max(0, Number(segundos) || 0);
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${minutos}:${String(resto).padStart(2, "0")}`;
}

function sortear(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarErro(mensagem) {
    const alvo = document.getElementById("mensagemPedidos") || document.getElementById("pedidoReceita");
    if (alvo) alvo.textContent = mensagem;
}



function iniciarPaginaPedidos() {
    const botao = document.getElementById("addPedidoTeste");
    const area = document.getElementById("backgroundDosPedidos");

    if (!botao || !area) return;

    botao.addEventListener("click", () => {
        // Sorteia o cliente e a pizza
        const nomeSorteado = sortear(config.nomes);
        const sobrenomeSorteado = sortear(config.sobrenomes);
        const [pizzaId, pizza] = sortear(Object.entries(config.pizzas));

        const imagem = String(nomeSorteado.genero).toLowerCase() === "feminino"
            ? "imagens/cliente_f.png"
            : "imagens/cliente_m.png";

        // Mantém todos os dados necessários para a montagem
        const pedido = {
            nome: `${nomeSorteado.nome} ${sobrenomeSorteado}`,
            imagem,
            pizzaId,
            pizzaNome: pizza.nome || pizzaId,
            ingredientes: pizza.ingredientes.filter(
                id => config.ingredientes[id]
            ),
            tempoForno: Math.max(0, Number(pizza.tempoForno) || 0)
        };

        if (!pedido.ingredientes.length) {
            mostrarErro(
                `A pizza "${pedido.pizzaNome}" não possui ingredientes válidos.`
            );
            return;
        }

        // Cartão do pedido
        const card = document.createElement("div");
        card.className = "pedido";

        // Imagem e nome do cliente
        const cliente = document.createElement("div");
        cliente.className = "cliente";

        const img = document.createElement("img");
        img.src = pedido.imagem;
        img.alt = `Cliente: ${nomeSorteado.nome}`;
        img.onerror = () => {
            img.style.display = "none";
        };

        const nome = document.createElement("h4");
        nome.textContent = pedido.nome;

        cliente.append(img, nome);

        // Botão para receber o pedido
        const aceitar = document.createElement("a");
        aceitar.href = "montagem.html";
        aceitar.textContent = "RECEBER PEDIDO";

        aceitar.addEventListener("click", (evento) => {
            evento.preventDefault();

            sessionStorage.setItem(
                "pedidoAtual",
                JSON.stringify(pedido)
            );

            window.location.href = "montagem.html";
        });

        // Adiciona somente o cliente e o botão ao cartão
        card.append(cliente, aceitar);
        area.appendChild(card);

        const status = document.getElementById("mensagemPedidos");
        if (status) {
            status.textContent = "";
        }
    });
}



function iniciarPaginaMontagem() {
    const bandeja = document.getElementById("bandejaIngredientes");
    const receita = document.getElementById("pedidoReceita");
    const tempoValor = document.getElementById("tempoFornoValor");
    if (!bandeja || !receita) return;

    let pedido = null;
    try {
        const texto = sessionStorage.getItem("pedidoAtual");
        pedido = texto ? JSON.parse(texto) : null;
    } catch (_) {}

    if (!pedido) {
        mostrarErro("Nenhum pedido selecionado. Volte para pedidos.html e receba um pedido.");
        return;
    }

    bandeja.replaceChildren();
    Object.entries(config.ingredientes).forEach(([id, ingrediente]) => {
        const bloco = document.createElement("div");
        bloco.className = "blocoPizza";
        bloco.id = id;
        bloco.textContent = ingrediente.nome || id;
        bloco.style.backgroundColor = ingrediente.cor || "#777";
        bloco.title = ingrediente.nome || id;
        bandeja.appendChild(bloco);
    });

    if (tempoValor) tempoValor.textContent = formatarTempo(pedido.tempoForno);
    receita.replaceChildren();

    const titulo = document.createElement("div");
    titulo.className = "itemPedido";
    titulo.textContent = `Pizza: ${pedido.pizzaNome}`;
    receita.appendChild(titulo);

    pedido.ingredientes.forEach((id, indice) => {
        const item = document.createElement("div");
        item.className = "itemPedido";
        item.dataset.ingredienteEsperado = id;
        item.textContent = `${indice + 1} - ${config.ingredientes[id]?.nome || id}`;
        receita.appendChild(item);
    });

    const itemTempo = document.createElement("div");
    itemTempo.className = "itemPedido tempoPedido";
    itemTempo.textContent = `◷ ${formatarTempo(pedido.tempoForno)} min`;
    receita.appendChild(itemTempo);
}

// Inicia a página sem fazer nenhuma requisição a servidor ou arquivo JSON.
if (document.getElementById("backgroundDosPedidos")) {
    iniciarPaginaPedidos();
} else if (document.getElementById("areaPizza")) {
    iniciarPaginaMontagem();
    executarSistemaDeMontagem();
}

function executarSistemaDeMontagem() {
// ==========================================
// SISTEMA DE MONTAGEM DA PIZZA
// ==========================================

const areaPizza = document.getElementById("areaPizza");
const pedidoAtualTexto = sessionStorage.getItem("pedidoAtual");
let pedido = null;
try { pedido = pedidoAtualTexto ? JSON.parse(pedidoAtualTexto) : null; } catch (erro) { console.error("Pedido inválido:", erro); }
const blocosPizza = document.querySelectorAll(".blocoPizza");
const tempoFornoBloco = document.getElementById("tempoFornoBloco");
if (pedido) console.log("Pedido recebido:", pedido);
if (areaPizza) {

    let proximoId = 1;
    let tempoFornoColocado = false;


    // ==========================================
    // GERA ID ÚNICO
    // ==========================================

    function gerarId() {

        let id = "blocoMontado" + proximoId;

        proximoId++;

        return id;
    }


    // ==========================================
    // LIMITA UM BLOCO DENTRO DA ÁREA
    // ==========================================

    function limitarPosicao(bloco, x, y) {

        let larguraArea = areaPizza.clientWidth;
        let alturaArea = areaPizza.clientHeight;

        let larguraBloco = bloco.offsetWidth;
        let alturaBloco = bloco.offsetHeight;

        let limiteX = larguraArea - larguraBloco;
        let limiteY = alturaArea - alturaBloco;

        x = Math.max(0, Math.min(x, limiteX));
        y = Math.max(0, Math.min(y, limiteY));

        return {
            x: x,
            y: y
        };
    }


    // ==========================================
    // PEGA TODOS OS FILHOS DE UM BLOCO
    // ==========================================

    function pegarFilhos(bloco) {

        let filhos = [];

        let idDoBloco = bloco.dataset.blocoId;

        document.querySelectorAll(".ingredienteMontado").forEach(function(outroBloco) {

            if (outroBloco.dataset.pai === idDoBloco) {

                filhos.push(outroBloco);

                filhos = filhos.concat(
                    pegarFilhos(outroBloco)
                );
            }

        });

        return filhos;
    }


    // ==========================================
    // PEGA O BLOCO + TODOS OS FILHOS
    // ==========================================

    function pegarFamilia(bloco) {

        let familia = [bloco];

        familia = familia.concat(
            pegarFilhos(bloco)
        );

        return familia;
    }


    // ==========================================
    // MANTÉM TODA A FAMÍLIA DENTRO DA ÁREA
    // ==========================================

    function limitarFamilia(familia, movimentoX, movimentoY) {

        let menorX = Infinity;
        let menorY = Infinity;

        let maiorX = -Infinity;
        let maiorY = -Infinity;

        familia.forEach(function(bloco) {

            let x = parseFloat(bloco.style.left);
            let y = parseFloat(bloco.style.top);

            let largura = bloco.offsetWidth;
            let altura = bloco.offsetHeight;

            menorX = Math.min(menorX, x);
            menorY = Math.min(menorY, y);

            maiorX = Math.max(maiorX, x + largura);
            maiorY = Math.max(maiorY, y + altura);

        });


        // Impede sair pela esquerda

        if (menorX + movimentoX < 0) {

            movimentoX = -menorX;
        }


        // Impede sair pelo topo

        if (menorY + movimentoY < 0) {

            movimentoY = -menorY;
        }


        // Impede sair pela direita

        if (maiorX + movimentoX > areaPizza.clientWidth) {

            movimentoX =
                areaPizza.clientWidth - maiorX;
        }


        // Impede sair por baixo

        if (maiorY + movimentoY > areaPizza.clientHeight) {

            movimentoY =
                areaPizza.clientHeight - maiorY;
        }


        return {
            x: movimentoX,
            y: movimentoY
        };
    }


    // ==========================================
    // CRIA BLOCO NA ÁREA DE MONTAGEM
    // ==========================================

    function criarBlocoMontagem(blocoOriginal, x, y) {

        let novoBloco = blocoOriginal.cloneNode(true);

        novoBloco.removeAttribute("id");

        novoBloco.classList.add("ingredienteMontado");

        novoBloco.draggable = false;

        novoBloco.dataset.blocoId = gerarId();

        novoBloco.dataset.ingrediente =
            blocoOriginal.id;

        novoBloco.dataset.pai = "";


        let posicao =
            limitarPosicao(
                novoBloco,
                x,
                y
            );


        novoBloco.style.left =
            posicao.x + "px";

        novoBloco.style.top =
            posicao.y + "px";


        areaPizza.appendChild(novoBloco);

        configurarBloco(novoBloco);

        return novoBloco;
    }


    // ==========================================
    // CONFIGURA EVENTOS DO BLOCO
    // ==========================================

    function configurarBloco(bloco) {


        // ==========================================
        // ARRASTAR COM BOTÃO ESQUERDO
        // ==========================================

        bloco.addEventListener(
            "pointerdown",
            function(event) {

                if (event.button !== 0) return;

                event.preventDefault();


                // Se era filho de alguém,
                // ele se desprende do pai.

                if (bloco.dataset.pai !== "") {

                    bloco.dataset.pai = "";
                }


                // Pega o bloco + seus filhos

                let familia =
                    pegarFamilia(bloco);


                // Guarda as posições originais

                let posicoes = [];

                familia.forEach(function(item) {

                    posicoes.push({

                        elemento: item,

                        x: parseFloat(
                            item.style.left
                        ),

                        y: parseFloat(
                            item.style.top
                        )

                    });

                });


                let mouseInicialX =
                    event.clientX;

                let mouseInicialY =
                    event.clientY;


                // ==========================================
                // MOVIMENTAÇÃO
                // ==========================================

                function mover(event) {

                    let deslocamentoX =
                        event.clientX -
                        mouseInicialX;

                    let deslocamentoY =
                        event.clientY -
                        mouseInicialY;


                    // Limita toda a família

                    let movimento =
                        limitarFamilia(
                            familia,
                            deslocamentoX,
                            deslocamentoY
                        );


                    // Move todos juntos

                    posicoes.forEach(function(posicao) {

                        let novaX =
                            posicao.x +
                            movimento.x;

                        let novaY =
                            posicao.y +
                            movimento.y;


                        posicao.elemento.style.left =
                            novaX + "px";

                        posicao.elemento.style.top =
                            novaY + "px";

                    });

                }


                // ==========================================
                // SOLTAR
                // ==========================================

                function soltar() {

                    document.removeEventListener(
                        "pointermove",
                        mover
                    );

                    document.removeEventListener(
                        "pointerup",
                        soltar
                    );


                    procurarEncaixe(bloco);
                }


                document.addEventListener(
                    "pointermove",
                    mover
                );

                document.addEventListener(
                    "pointerup",
                    soltar
                );

            }
        );


        // ==========================================
        // BOTÃO DIREITO REMOVE
        // ==========================================

        bloco.addEventListener(
            "contextmenu",
            function(event) {

                event.preventDefault();


                let familia =
                    pegarFamilia(bloco);


                // Se for o bloco de tempo,
                // permite colocar novamente.

                if (
                    bloco.dataset.ingrediente ===
                    "tempoForno"
                ) {

                    tempoFornoColocado = false;
                }


                familia.forEach(function(item) {

                    item.remove();

                });

            }
        );

    }


    // ==========================================
    // PROCURA O ENCAIXE MAIS PRÓXIMO
    // ==========================================

    function procurarEncaixe(blocoArrastado) {

        let blocos =
            document.querySelectorAll(
                ".ingredienteMontado"
            );


        let familia =
            pegarFamilia(blocoArrastado);


        let melhorAlvo = null;

        let menorDistancia = 30;


        let xBloco =
            parseFloat(
                blocoArrastado.style.left
            );

        let yBloco =
            parseFloat(
                blocoArrastado.style.top
            );


        let larguraBloco =
            blocoArrastado.offsetWidth;

        let alturaBloco =
            blocoArrastado.offsetHeight;


        let centroBloco =
            xBloco +
            larguraBloco / 2;


        blocos.forEach(function(alvo) {


            // Não pode encaixar nele mesmo

            if (alvo === blocoArrastado) {
                return;
            }


            // Não pode encaixar em um descendente

            if (familia.includes(alvo)) {
                return;
            }


            let xAlvo =
                parseFloat(
                    alvo.style.left
                );

            let yAlvo =
                parseFloat(
                    alvo.style.top
                );


            let larguraAlvo =
                alvo.offsetWidth;

            let alturaAlvo =
                alvo.offsetHeight;


            let centroAlvo =
                xAlvo +
                larguraAlvo / 2;


            let distanciaHorizontal =
                Math.abs(
                    centroBloco -
                    centroAlvo
                );


            // Distância para ficar abaixo

            let distanciaAbaixo =
                Math.abs(
                    yBloco -
                    (yAlvo + alturaAlvo)
                );


            // Distância para ficar acima

            let distanciaAcima =
                Math.abs(
                    (yBloco + alturaBloco) -
                    yAlvo
                );


            // Encaixe abaixo

            if (
                distanciaHorizontal < 60 &&
                distanciaAbaixo < menorDistancia
            ) {

                melhorAlvo = {

                    alvo: alvo,

                    tipo: "abaixo"

                };

                menorDistancia =
                    distanciaAbaixo;
            }


            // Encaixe acima

            if (
                distanciaHorizontal < 60 &&
                distanciaAcima < menorDistancia
            ) {

                melhorAlvo = {

                    alvo: alvo,

                    tipo: "acima"

                };

                menorDistancia =
                    distanciaAcima;
            }

        });


        // Nenhum encaixe encontrado

        if (!melhorAlvo) {
            return;
        }


        let alvo =
            melhorAlvo.alvo;


        let novoX;
        let novoY;


        // ==========================================
        // CALCULA A NOVA POSIÇÃO
        // ==========================================

        if (melhorAlvo.tipo === "abaixo") {

            novoX =
                parseFloat(
                    alvo.style.left
                );

            novoY =
                parseFloat(
                    alvo.style.top
                ) +
                alvo.offsetHeight;

        }


        if (melhorAlvo.tipo === "acima") {

            novoX =
                parseFloat(
                    alvo.style.left
                );

            novoY =
                parseFloat(
                    alvo.style.top
                ) -
                alturaBloco;

        }


        // ==========================================
        // CALCULA QUANTO O BLOCO PRECISA ANDAR
        // ==========================================

        let movimentoX =
            novoX - xBloco;

        let movimentoY =
            novoY - yBloco;


        // Pega novamente a família

        let familiaAtual =
            pegarFamilia(blocoArrastado);


        // Move TODOS os blocos da família juntos

        familiaAtual.forEach(function(item) {

            let xAtual =
                parseFloat(
                    item.style.left
                );

            let yAtual =
                parseFloat(
                    item.style.top
                );


            item.style.left =
                (xAtual + movimentoX) +
                "px";

            item.style.top =
                (yAtual + movimentoY) +
                "px";

        });


        // ==========================================
        // DEFINE O PAI
        // ==========================================

        blocoArrastado.dataset.pai =
            alvo.dataset.blocoId;

    }


    // ==========================================
    // CRIA INGREDIENTES DA BANDEJA
    // ==========================================

    blocosPizza.forEach(function(bloco) {

        bloco.draggable = false;


        bloco.addEventListener(
            "pointerdown",
            function(event) {

                if (event.button !== 0) {
                    return;
                }

                event.preventDefault();


                let rect =
                    areaPizza.getBoundingClientRect();


                let x =
                    event.clientX -
                    rect.left -
                    90;


                let y =
                    event.clientY -
                    rect.top -
                    20;


                criarBlocoMontagem(
                    bloco,
                    x,
                    y
                );

            }
        );

    });


// ==========================================
// BLOCO DE TEMPO DE FORNO
// ==========================================

if (tempoFornoBloco) {

    tempoFornoBloco.draggable = false;

    tempoFornoBloco.addEventListener(
        "pointerdown",
        function(event) {

            if (event.button !== 0) {
                return;
            }

            event.preventDefault();

            // Só pode existir um bloco de tempo

            if (tempoFornoColocado) {
                return;
            }

            let rect =
                areaPizza.getBoundingClientRect();


            // Cria o bloco

            let novoTempo =
                tempoFornoBloco.cloneNode(true);


            novoTempo.removeAttribute("id");

            novoTempo.classList.add(
                "ingredienteMontado"
            );


            novoTempo.draggable = false;


            novoTempo.dataset.blocoId =
                gerarId();


            novoTempo.dataset.ingrediente =
                "tempoForno";


            novoTempo.dataset.pai = "";


            // Posição inicial

            let x =
                event.clientX -
                rect.left -
                (novoTempo.offsetWidth / 2);


            let y =
                event.clientY -
                rect.top -
                (novoTempo.offsetHeight / 2);


            let posicao =
                limitarPosicao(
                    novoTempo,
                    x,
                    y
                );


            novoTempo.style.left =
                posicao.x + "px";

            novoTempo.style.top =
                posicao.y + "px";


            // Coloca na área da pizza

            areaPizza.appendChild(
                novoTempo
            );


            // Ativa arrastar, botão direito etc.

            configurarBloco(
                novoTempo
            );


            tempoFornoColocado = true;

        }
    );
}

    // ==========================================
    // BOTÃO VERIFICAR
    // ==========================================

    const botaoVerificar =
        document.getElementById(
            "botaoVerificar"
        );


    if (botaoVerificar) {

        botaoVerificar.addEventListener(
            "click",
            function() {

                const montados = [...document.querySelectorAll(".ingredienteMontado")];
                const idsMontados = montados
                    .map(bloco => bloco.dataset.ingrediente)
                    .filter(id => id && id !== "tempoForno");
                const esperados = pedido && Array.isArray(pedido.ingredientes) ? pedido.ingredientes : [];
                const faltando = esperados.filter(id => !idsMontados.includes(id));
                const extras = idsMontados.filter(id => !esperados.includes(id));
                const tempo = montados.some(bloco => bloco.dataset.ingrediente === "tempoForno");

                if (!pedido) {
                    alert("Nenhum pedido foi recebido. Volte à página de pedidos e escolha um cliente.");
                } else if (faltando.length === 0 && extras.length === 0 && tempo) {
                    alert("Pedido montado corretamente! 🍕");
                } else {
                    const nomesFaltando = faltando.map(id => config.ingredientes[id]?.nome || id);
                    const nomesExtras = extras.map(id => config.ingredientes[id]?.nome || id);
                    let mensagem = "Ainda há diferenças na montagem.";
                    if (nomesFaltando.length) mensagem += "\\nFaltando: " + nomesFaltando.join(", ");
                    if (nomesExtras.length) mensagem += "\\nIngredientes extras: " + nomesExtras.join(", ");
                    if (!tempo) mensagem += "\\nAdicione o bloco de tempo de forno.";
                    alert(mensagem);
                }

            }
        );

    }

}
}
