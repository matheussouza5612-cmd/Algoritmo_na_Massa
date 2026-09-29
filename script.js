let arrastando = false;

const blocos = document.querySelectorAll(".blocosArrastaveis");

let blocoAtual;
let distanciaX;
let distanciaY;


blocos.forEach(function(bloco) {

    bloco.addEventListener("mousedown", function(event) {

        arrastando = true;

        blocoAtual = bloco;

        distanciaX = event.clientX - bloco.getBoundingClientRect().left;
        distanciaY = event.clientY - bloco.getBoundingClientRect().top;

    });

});


document.addEventListener("mouseup", function() {

    arrastando = false;
    blocoAtual = null;

});


document.addEventListener("mousemove", function(event) {

    if (arrastando) {

        blocoAtual.style.left = event.clientX - distanciaX + "px";
        blocoAtual.style.top = event.clientY - distanciaY + "px";

    }

});