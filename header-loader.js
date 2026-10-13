document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("[data-site-header]");

    if (!container) return;

    try {
        const resposta = await fetch("header.html");

        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar o cabeçalho: ${resposta.status}`);
        }

        container.innerHTML = await resposta.text();
    } catch (erro) {
        console.error(erro);
    }
});