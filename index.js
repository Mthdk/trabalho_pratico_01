const express = require("express");
const PORT = 3000;
const app = express();
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 0 });

const resultados = {
  pessoas: [
    { id: 1, nome: "Marcelo" },
    { id: 2, nome: "João" },
    { id: 3, nome: "Maria" }
  ],
  carros: [
    { id: 1, modelo: "Fusca" },
    { id: 2, modelo: "Gol" },
    { id: 3, modelo: "Palio" }
  ],
  animais: [
    { id: 1, nome: "Cachorro" },
    { id: 2, nome: "Gato" },
    { id: 3, nome: "Papagaio" }
  ]
};

const time = 2 * 60; // segundos

app.get("/", function (request, response) {
  const keys = Object.keys(resultados);

  const cacheData = cache.get("index");

  if (cacheData) {
    response.status(304).send(cacheData);
    return;
  }

  const urlsDisponiveis = keys.map((key) => ({
    description: `Endpoint que retorna ${key}`,
    list: `/${key}`,
    detail: `/${key}/:id`
  }));

  cache.set("index", urlsDisponiveis, time);

  response.status(200).send(urlsDisponiveis);
});

app.get("/:path", function (request, response) {
  const { params: { path } } = request;
  const data = resultados[path];

  const cacheData = cache.get(path);

  if (cacheData) {
    response.status(304).send(cacheData);
    return;
  }

  let status = 200;
  let mensagem = "200 Ok";

  if (!data) {
    status = 400;
    mensagem = "400 Solicitação inválida.";
  }

  const responseData = {
    data: data ?? {},
    mensagem
  };

  cache.set(path, responseData, time);

  response.status(status).send(responseData);
});

app.get("/:path/:id", function (request, response) {
  const { params: { id, path } } = request;
  const data = resultados[path];

  const keyCache = `${path}_${id}`;

  try {
    const cacheData = cache.get(keyCache);

    if (cacheData) {
      response.status(304).send(cacheData);
      return;
    }

    const result = data.find((item) => item.id === Number(id));

    let status = 200;
    let mensagem = "200 Ok";

    if (!result) {
      status = 404;
      mensagem = "404 Not found";
    }

    const responseData = {
      data: result ?? {},
      mensagem
    };

    cache.set(keyCache, responseData, time);

    response.status(status).send(responseData);
  } catch (error) {
    response.status(400).send({
      data: null,
      mensagem: "400 Url inválida."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Rodando em http://localhost:${PORT}`);
});
