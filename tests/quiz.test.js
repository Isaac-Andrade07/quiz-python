import { test } from "node:test";
import assert from "node:assert/strict";
import {
  embaralhar, embaralharOpcoes, criarPartida, calcularPontos, responder,
  terminou, resumo, adicionarAoRanking, normalizarNome, TEMPO_LIMITE,
} from "../js/quiz.js";
import { PERGUNTAS, CATEGORIAS } from "../js/perguntas.js";

// gerador previsível para os testes
function rngFixo(seed = 42) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

test("embaralhar mantém os mesmos itens e não altera o original", () => {
  const original = [1, 2, 3, 4, 5];
  const r = embaralhar(original, rngFixo());
  assert.deepEqual([...r].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
});

test("embaralharOpcoes continua apontando para a resposta certa", () => {
  const p = { opcoes: ["a", "b", "c", "d"], correta: 2 };
  for (let seed = 1; seed < 30; seed++) {
    const e = embaralharOpcoes(p, rngFixo(seed));
    assert.equal(e.opcoes[e.correta], "c");
  }
});

test("criarPartida respeita categoria e quantidade", () => {
  const partida = criarPartida(PERGUNTAS, { categoria: "colecoes", quantidade: 3, rng: rngFixo() });
  assert.equal(partida.perguntas.length, 3);
  assert.ok(partida.perguntas.every((p) => p.categoria === "colecoes"));
});

test("criarPartida limita a quantidade ao total disponível", () => {
  const total = PERGUNTAS.filter((p) => p.categoria === "funcoes").length;
  const partida = criarPartida(PERGUNTAS, { categoria: "funcoes", quantidade: 99 });
  assert.equal(partida.perguntas.length, total);
});

test("criarPartida avisa quando a categoria não existe", () => {
  assert.throws(() => criarPartida(PERGUNTAS, { categoria: "xyz" }));
});

test("calcularPontos: erro vale 0, resposta instantânea vale 150", () => {
  assert.equal(calcularPontos(false, 1), 0);
  assert.equal(calcularPontos(true, 0), 150);
  assert.equal(calcularPontos(true, TEMPO_LIMITE / 2), 125);
  assert.equal(calcularPontos(true, TEMPO_LIMITE), 100);
  assert.equal(calcularPontos(true, 999), 100); // nunca abaixo de 100
});

test("responder registra acerto, erro e tempo esgotado", () => {
  let partida = criarPartida(PERGUNTAS, { quantidade: 3, rng: rngFixo() });
  const certa = partida.perguntas[0].correta;
  const errada = (partida.perguntas[1].correta + 1) % partida.perguntas[1].opcoes.length;

  partida = responder(partida, certa, 2);
  partida = responder(partida, errada, 5);
  partida = responder(partida, null, TEMPO_LIMITE);

  assert.equal(terminou(partida), true);
  assert.deepEqual(partida.respostas.map((r) => r.acertou), [true, false, false]);
  assert.throws(() => responder(partida, 0, 1));
});

test("resumo calcula pontos, percentual, categorias e erros", () => {
  let partida = criarPartida(PERGUNTAS, { quantidade: 4, rng: rngFixo(7) });
  partida.perguntas.forEach((p, i) => {
    partida = responder(partida, i < 3 ? p.correta : null, 0);
  });
  const r = resumo(partida);
  assert.equal(r.acertos, 3);
  assert.equal(r.total, 4);
  assert.equal(r.pontos, 450);
  assert.equal(r.percentual, 75);
  assert.equal(r.erros.length, 1);
  const somaCat = Object.values(r.porCategoria).reduce((s, c) => s + c.total, 0);
  assert.equal(somaCat, 4);
});

test("ranking ordena por pontos, desempata pelo mais antigo e limita o tamanho", () => {
  let ranking = [];
  ranking = adicionarAoRanking(ranking, { nome: "A", pontos: 300, data: 1 });
  ranking = adicionarAoRanking(ranking, { nome: "B", pontos: 500, data: 2 });
  ranking = adicionarAoRanking(ranking, { nome: "C", pontos: 300, data: 3 }, 2);
  assert.deepEqual(ranking.map((r) => r.nome), ["B", "A"]);
});

test("normalizarNome limpa espaços e usa Anônimo quando vazio", () => {
  assert.equal(normalizarNome("  Isaac   Andrade "), "Isaac Andrade");
  assert.equal(normalizarNome("   "), "Anônimo");
  assert.equal(normalizarNome(undefined), "Anônimo");
  assert.equal(normalizarNome("x".repeat(50)).length, 20);
});

test("banco de perguntas é válido", () => {
  for (const p of PERGUNTAS) {
    assert.ok(CATEGORIAS[p.categoria], `categoria inválida: ${p.categoria}`);
    assert.ok(p.opcoes.length >= 2, p.pergunta);
    assert.ok(p.correta >= 0 && p.correta < p.opcoes.length, p.pergunta);
    assert.equal(new Set(p.opcoes).size, p.opcoes.length, `opções repetidas: ${p.pergunta}`);
    assert.ok(p.explicacao.length > 10, p.pergunta);
  }
});
