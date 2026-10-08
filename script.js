// ==========================================
// SISTEMA DE MONTAGEM DA PIZZA
// ==========================================

const areaPizza = document.getElementById("areaPizza");
const pedidoAtual = sessionStorage.getItem("pedidoAtual");
const blocosPizza = document.querySelectorAll(".blocoPizza");
const tempoFornoBloco = document.getElementById("tempoFornoBloco");
if (pedidoAtual) {

    const pedido = JSON.parse(pedidoAtual);

    console.log("Pedido recebido:", pedido);

}
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

                console.log(
                    "Blocos montados:",
                    document.querySelectorAll(
                        ".ingredienteMontado"
                    )
                );


                alert(
                    "Montagem funcionando!"
                );

            }
        );

    }

}