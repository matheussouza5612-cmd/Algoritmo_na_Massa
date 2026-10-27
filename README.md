https://prod.liveshare.vsengsaas.visualstudio.com/join?D80D7C45F13B54776EDD359E56A051C4A833


# Configuração do jogo de pizzas

## Arquivos
- `config.html`: interface administrativa (CSS e JS embutidos).
- `server.js`: servidor local, sem dependências externas.
- `presets/config.json`: arquivo que será atualizado pelo painel.

## Como instalar no projeto
Copie `config.html`, `server.js` e a pasta `presets` para a pasta principal do projeto.
Mantenha sua pasta `img` existente ao lado deles. Os nomes usam `img/cliente_m.png` e `img/cliente_f.png`.

## Como executar no Windows
1. Instale Node.js (se ainda não tiver).
2. Abra o terminal do VS Code na pasta onde está `server.js`.
3. Execute: `node server.js`
4. Abra no navegador: `http://127.0.0.1:3000`

Não abra `config.html` com duplo clique: o navegador precisa acessar o servidor para salvar diretamente no JSON.
O servidor escuta apenas em `127.0.0.1`, não na rede externa. O painel salva cada inclusão/remoção automaticamente.

## Formato do JSON
- `nomes`: objetos `{ "nome": "...", "genero": "masculino" | "feminino" }`
- `sobrenomes`: lista de textos
- `ingredientes`: objeto indexado por identificador, com `nome` e `cor`
- `pizzas`: objeto indexado por identificador, com `nome`, IDs de `ingredientes` e `tempoForno` em segundos

## Observação
Este painel grava o JSON, mas o restante do jogo ainda precisa carregar `presets/config.json` pelo mecanismo adequado. Uma página web comum não lê o arquivo JSON local automaticamente; quando ligarmos o sistema de pedidos a essas configurações, devemos integrar o carregamento.
