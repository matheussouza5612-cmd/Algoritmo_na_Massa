const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const CONFIG_DIR = path.join(ROOT, "presets");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const MAX_BODY = 1_000_000;

const initialConfig = {
    nomes: [],
    sobrenomes: [],
    ingredientes: {},
    pizzas: {}
};

fs.mkdirSync(CONFIG_DIR, { recursive: true });
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 4) + "\n", "utf8");
}

function responder(res, status, body, contentType = "application/json; charset=utf-8") {
    res.writeHead(status, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });
    res.end(contentType.startsWith("application/json") ? JSON.stringify(body) : body);
}

function validarConfig(dados) {
    if (!dados || typeof dados !== "object" ||
        !Array.isArray(dados.nomes) ||
        !Array.isArray(dados.sobrenomes) ||
        !dados.ingredientes || typeof dados.ingredientes !== "object" ||
        Array.isArray(dados.ingredientes) ||
        !dados.pizzas || typeof dados.pizzas !== "object" ||
        Array.isArray(dados.pizzas)) {
        return "Estrutura JSON inválida. São esperados nomes, sobrenomes, ingredientes e pizzas.";
    }

    for (const registro of dados.nomes) {
        if (!registro || typeof registro.nome !== "string" ||
            !["masculino", "feminino"].includes(registro.genero)) {
            return "Cada nome precisa ter nome e gênero masculino/feminino.";
        }
    }

    for (const [id, ingrediente] of Object.entries(dados.ingredientes)) {
        if (!/^[a-z0-9_]+$/.test(id) ||
            !ingrediente || typeof ingrediente.nome !== "string" ||
            typeof ingrediente.cor !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(ingrediente.cor)) {
            return `Dados inválidos para o ingrediente "${id}".`;
        }
    }

    for (const [id, pizza] of Object.entries(dados.pizzas)) {
        if (!/^[a-z0-9_]+$/.test(id) ||
            !pizza || typeof pizza.nome !== "string" ||
            !Array.isArray(pizza.ingredientes) || pizza.ingredientes.length === 0 ||
            !Number.isInteger(pizza.tempoForno) || pizza.tempoForno < 1) {
            return `Dados inválidos para a pizza "${id}".`;
        }
        for (const ingredienteId of pizza.ingredientes) {
            if (!Object.hasOwn(dados.ingredientes, ingredienteId)) {
                return `A pizza "${pizza.nome}" referencia um ingrediente inexistente: "${ingredienteId}".`;
            }
        }
    }

    if (!dados.sobrenomes.every(item => typeof item === "string" && item.trim())) {
        return "A lista de sobrenomes contém um valor inválido.";
    }

    return null;
}

function servirArquivo(req, res, pathname) {
    let caminhoUrl;
    try {
        caminhoUrl = decodeURIComponent(pathname);
    } catch {
        return responder(res, 400, { erro: "Caminho inválido." });
    }

    if (caminhoUrl === "/") caminhoUrl = "/config.html";

    const caminho = path.resolve(ROOT, "." + caminhoUrl);
    if (caminho !== ROOT && !caminho.startsWith(ROOT + path.sep)) {
        return responder(res, 403, { erro: "Acesso negado." });
    }

    fs.stat(caminho, (erro, info) => {
        if (erro || !info.isFile()) return responder(res, 404, { erro: "Arquivo não encontrado." });

        const ext = path.extname(caminho).toLowerCase();
        const tipos = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml"
        };

        res.writeHead(200, {
            "Content-Type": tipos[ext] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff"
        });
        fs.createReadStream(caminho).pipe(res);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/config" && req.method === "GET") {
        fs.readFile(CONFIG_FILE, "utf8", (erro, conteudo) => {
            if (erro) return responder(res, 500, { erro: "Não foi possível ler o JSON." });
            try {
                responder(res, 200, JSON.parse(conteudo));
            } catch {
                responder(res, 500, { erro: "presets/config.json não contém JSON válido." });
            }
        });
        return;
    }

    if (url.pathname === "/api/config" && req.method === "POST") {
        let corpo = "";
        req.on("data", parte => {
            corpo += parte;
            if (corpo.length > MAX_BODY) {
                responder(res, 413, { erro: "Arquivo de configuração muito grande." });
                req.destroy();
            }
        });

        req.on("end", () => {
            let dados;
            try {
                dados = JSON.parse(corpo);
            } catch {
                return responder(res, 400, { erro: "O conteúdo enviado não é um JSON válido." });
            }

            const erroValidacao = validarConfig(dados);
            if (erroValidacao) return responder(res, 400, { erro: erroValidacao });

            const temporario = CONFIG_FILE + ".tmp";
            fs.writeFile(temporario, JSON.stringify(dados, null, 4) + "\n", "utf8", erro => {
                if (erro) return responder(res, 500, { erro: "Não foi possível gravar o arquivo." });
                fs.rename(temporario, CONFIG_FILE, erroRename => {
                    if (erroRename) return responder(res, 500, { erro: "Não foi possível atualizar o arquivo de configuração." });
                    responder(res, 200, { sucesso: true });
                });
            });
        });
        return;
    }

    if (url.pathname.startsWith("/api/")) {
        return responder(res, 404, { erro: "Rota de API não encontrada." });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        return responder(res, 405, { erro: "Método não permitido." });
    }

    servirArquivo(req, res, url.pathname);
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`Página de configuração disponível em http://127.0.0.1:${PORT}`);
    console.log(`Arquivo de configurações: ${CONFIG_FILE}`);
    console.log("Este servidor está limitado ao próprio computador (localhost).");
});
