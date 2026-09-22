



// minha parte aqui 😡

// vou usar pra fazer o nome dos clientes
let nomes = [
    "Daniel",
    "Matheus",
    "Renato"
]
let sobrenome = [
    "Matsuno",
    "Souza"
]
// imagens 

const botaoAddPedidoTeste = document.getElementById("addPedidoTeste");
const backgroundDosPedidos = document.getElementById("backgroundDosPedidos");
function adicionarPedido(pedido) {

    let novoPedido = document.createElement("div");
    novoPedido.classList.add("pedido");

    let clienteDiv = document.createElement("div");
    clienteDiv.classList.add("cliente");

    let imgDoCliente = document.createElement("img");
    imgDoCliente.src = pedido.imagem;
    imgDoCliente.alt = "Foto representando o cliente";

    let nomeDoCliente = document.createElement("h4");
    nomeDoCliente.textContent = pedido.nome;

    let botaoAceitar = document.createElement("button");
    botaoAceitar.textContent = "receber pedido";

    clienteDiv.appendChild(imgDoCliente);
    clienteDiv.appendChild(nomeDoCliente);

    novoPedido.appendChild(clienteDiv);
    novoPedido.appendChild(botaoAceitar);

    backgroundDosPedidos.appendChild(novoPedido);
}

botaoAddPedidoTeste.addEventListener("click", function(){
    let nome = nomes[Math.floor(Math.random() * nomes.length)];
    let imagem = "imagens/Logo.png"; // Depois é so troca pela img dos personagem
    let pedido = {
        nome: nome,
        imagem: imagem
    }

    adicionarPedido(pedido)
} )
// apartir daqui não é minha parte 😒