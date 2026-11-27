// Regras do quiz: funções puras, sem DOM, para poderem ser testadas no Node.

export const TEMPO_LIMITE = 20; // segundos por pergunta
export const PONTOS_ACERTO = 100;
export const BONUS_MAXIMO = 50;

/** Embaralha uma cópia do array (Fisher-Yates). */
export function embaralhar(lista, rng = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Embaralha as opções de uma pergunta mantendo o índice da correta. */
export function embaralharOpcoes(pergunta, rng = Math.random) {
  const indices = embaralhar(pergunta.opcoes.map((_, i) => i), rng);
  return {
    ...pergunta,
    opcoes: indices.map((i) => pergunta.opcoes[i]),
    correta: indices.indexOf(pergunta.correta),
  };
}

/** Cria uma nova partida filtrando por categoria e sorteando as perguntas. */
export function criarPartida(banco, { categoria = "todas", quantidade = 10, rng = Math.random } = {}) {
  const filtradas = categoria === "todas" ? banco : banco.filter((p) => p.categoria === categoria);
  if (filtradas.length === 0) throw new Error("Nenhuma pergunta para essa categoria.");
  const qtd = Math.min(Math.max(1, quantidade), filtradas.length);
  const perguntas = embaralhar(filtradas, rng).slice(0, qtd).map((p) => embaralharOpcoes(p, rng));
  return { perguntas, indice: 0, respostas: [] };
}

/** Pontos de uma resposta: acerto vale 100 + bônus por rapidez (até 50). */
export function calcularPontos(acertou, segundos, limite = TEMPO_LIMITE) {
  if (!acertou) return 0;
  const t = Math.min(Math.max(segundos, 0), limite);
  return PONTOS_ACERTO + Math.round(BONUS_MAXIMO * (1 - t / limite));
}

/**
 * Registra a resposta da pergunta atual e avança.
 * escolha = índice da opção ou null (tempo esgotado). Retorna uma nova partida.
 */
export function responder(partida, escolha, segundos) {
  if (terminou(partida)) throw new Error("A partida já terminou.");
  const pergunta = partida.perguntas[partida.indice];
  const acertou = escolha === pergunta.correta;
  const resposta = { escolha, acertou, segundos, pontos: calcularPontos(acertou, segundos) };
  return { ...partida, indice: partida.indice + 1, respostas: [...partida.respostas, resposta] };
}

export function terminou(partida) {
  return partida.indice >= partida.perguntas.length;
}

/** Resumo final: acertos, pontos, aproveitamento e desempenho por categoria. */
export function resumo(partida) {
  const total = partida.respostas.length;
  const acertos = partida.respostas.filter((r) => r.acertou).length;
  const pontos = partida.respostas.reduce((s, r) => s + r.pontos, 0);
  const porCategoria = {};
  partida.respostas.forEach((r, i) => {
    const cat = partida.perguntas[i].categoria;
    porCategoria[cat] ??= { acertos: 0, total: 0 };
    porCategoria[cat].total++;
    if (r.acertou) porCategoria[cat].acertos++;
  });
  const erros = partida.respostas
    .map((r, i) => ({ ...r, pergunta: partida.perguntas[i] }))
    .filter((r) => !r.acertou);
  return {
    total,
    acertos,
    pontos,
    percentual: total ? Math.round((acertos / total) * 100) : 0,
    porCategoria,
    erros,
  };
}

/** Insere uma entrada no ranking, ordena (pontos desc, mais antigo primeiro no empate) e limita. */
export function adicionarAoRanking(ranking, entrada, maximo = 10) {
  return [...ranking, entrada]
    .sort((a, b) => b.pontos - a.pontos || a.data - b.data)
    .slice(0, maximo);
}

/** Limpa o nome digitado: tira espaços extras e limita o tamanho. */
export function normalizarNome(nome) {
  const limpo = String(nome ?? "").trim().replace(/\s+/g, " ").slice(0, 20);
  return limpo || "Anônimo";
}
