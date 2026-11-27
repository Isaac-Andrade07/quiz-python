// Interface do quiz: liga as regras (quiz.js) ao HTML.
import { PERGUNTAS, CATEGORIAS } from "./perguntas.js";
import {
  TEMPO_LIMITE, criarPartida, responder, terminou, resumo,
  adicionarAoRanking, normalizarNome,
} from "./quiz.js";

const CHAVE_RANKING = "quiz-python-ranking";
const $ = (id) => document.getElementById(id);

const telas = { inicio: $("tela-inicio"), pergunta: $("tela-pergunta"), resultado: $("tela-resultado") };
let partida = null;
let jogador = "";
let timer = null;
let inicioPergunta = 0;

// ---------- utilidades ----------
function mostrar(nome) {
  Object.entries(telas).forEach(([k, el]) => (el.hidden = k !== nome));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function lerRanking() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RANKING)) ?? [];
  } catch {
    return [];
  }
}

function salvarRanking(ranking) {
  try {
    localStorage.setItem(CHAVE_RANKING, JSON.stringify(ranking));
  } catch {
    /* navegação privada: segue sem salvar */
  }
}

// ---------- tela inicial ----------
function montarCategorias() {
  const sel = $("categoria");
  const contagem = (cat) => PERGUNTAS.filter((p) => p.categoria === cat).length;
  sel.innerHTML = `<option value="todas">Todos os temas (${PERGUNTAS.length})</option>` +
    Object.entries(CATEGORIAS)
      .map(([id, nome]) => `<option value="${id}">${nome} (${contagem(id)})</option>`)
      .join("");
}

function desenharRanking() {
  const ranking = lerRanking();
  $("ranking").innerHTML = ranking.length
    ? ranking.map((r) => `<li>${escapar(r.nome)} <span>${r.pontos} pts</span></li>`).join("")
    : `<li class="vazio">Ninguém jogou ainda. Seja o primeiro!</li>`;
}

$("form-inicio").addEventListener("submit", (e) => {
  e.preventDefault();
  jogador = normalizarNome($("nome").value);
  partida = criarPartida(PERGUNTAS, {
    categoria: $("categoria").value,
    quantidade: Number($("quantidade").value),
  });
  mostrar("pergunta");
  mostrarPergunta();
});

$("limpar-ranking").addEventListener("click", () => {
  salvarRanking([]);
  desenharRanking();
});

// ---------- pergunta ----------
function mostrarPergunta() {
  const p = partida.perguntas[partida.indice];
  const pontos = partida.respostas.reduce((s, r) => s + r.pontos, 0);

  $("progresso").textContent = `Pergunta ${partida.indice + 1} de ${partida.perguntas.length}`;
  $("categoria-atual").textContent = CATEGORIAS[p.categoria];
  $("pontos-atuais").textContent = `${pontos} pts`;
  $("texto-pergunta").textContent = p.pergunta;

  const pre = $("codigo");
  pre.hidden = !p.codigo;
  pre.querySelector("code").textContent = p.codigo ?? "";

  $("opcoes").innerHTML = "";
  p.opcoes.forEach((texto, i) => {
    const b = document.createElement("button");
    b.className = "opcao";
    b.textContent = `${String.fromCharCode(65 + i)}) ${texto}`;
    b.addEventListener("click", () => escolher(i));
    $("opcoes").appendChild(b);
  });

  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("proxima").hidden = true;
  iniciarTimer();
}

function iniciarTimer() {
  clearInterval(timer);
  inicioPergunta = performance.now();
  const barra = $("barra-tempo");
  barra.classList.remove("alerta");
  timer = setInterval(() => {
    const passado = (performance.now() - inicioPergunta) / 1000;
    const resto = Math.max(0, 1 - passado / TEMPO_LIMITE);
    barra.style.width = `${resto * 100}%`;
    barra.classList.toggle("alerta", resto < 0.25);
    if (passado >= TEMPO_LIMITE) escolher(null);
  }, 100);
}

function escolher(indice) {
  clearInterval(timer);
  if (!$("proxima").hidden) return; // já respondeu
  const segundos = (performance.now() - inicioPergunta) / 1000;
  const p = partida.perguntas[partida.indice];
  partida = responder(partida, indice, segundos);
  const r = partida.respostas.at(-1);

  [...$("opcoes").children].forEach((b, i) => {
    b.disabled = true;
    if (i === p.correta) b.classList.add("certa");
    else if (i === indice) b.classList.add("errada");
  });

  const fb = $("feedback");
  if (r.acertou) {
    fb.textContent = `✔ Acertou! +${r.pontos} pontos. ${p.explicacao}`;
    fb.className = "feedback ok";
  } else {
    fb.textContent = `${indice === null ? "⏰ Tempo esgotado." : "✘ Não foi dessa vez."} ${p.explicacao}`;
    fb.className = "feedback erro";
  }

  const btn = $("proxima");
  btn.textContent = terminou(partida) ? "Ver resultado" : "Próxima";
  btn.hidden = false;
  btn.focus();
}

$("proxima").addEventListener("click", () => {
  if (terminou(partida)) mostrarResultado();
  else mostrarPergunta();
});

// Atalhos: teclas 1-4 ou A-D escolhem; Enter avança.
document.addEventListener("keydown", (e) => {
  if (telas.pergunta.hidden) return;
  const mapa = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
  const i = mapa[e.key.toLowerCase()];
  if (i !== undefined && $("proxima").hidden && i < partida.perguntas[partida.indice].opcoes.length) escolher(i);
});

// ---------- resultado ----------
function mostrarResultado() {
  const res = resumo(partida);
  const titulo =
    res.percentual === 100 ? "Gabaritou! 🏆" :
    res.percentual >= 70 ? "Mandou bem! 🚀" :
    res.percentual >= 40 ? "Bom começo! 💪" : "Bora estudar mais um pouco! 📚";

  $("titulo-resultado").textContent = `${titulo} ${jogador}`;
  $("res-pontos").textContent = res.pontos;
  $("res-acertos").textContent = `${res.acertos}/${res.total}`;
  $("res-percentual").textContent = `${res.percentual}%`;

  $("res-categorias").innerHTML = Object.entries(res.porCategoria)
    .map(([cat, { acertos, total }]) => {
      const pct = Math.round((acertos / total) * 100);
      return `<li>${CATEGORIAS[cat]}: ${acertos}/${total}<div class="mini"><div style="width:${pct}%"></div></div></li>`;
    })
    .join("");

  $("titulo-revisao").hidden = res.erros.length === 0;
  $("revisao").innerHTML = res.erros
    .map(({ pergunta: p, escolha }) => `
      <div class="item-revisao">
        <p><strong>${escapar(p.pergunta)}</strong></p>
        ${p.codigo ? `<pre><code>${escapar(p.codigo)}</code></pre>` : ""}
        <p>Sua resposta: ${escolha === null ? "sem resposta" : escapar(p.opcoes[escolha])}</p>
        <p class="resp">Correta: ${escapar(p.opcoes[p.correta])}</p>
        <p class="muted">${escapar(p.explicacao)}</p>
      </div>`)
    .join("");

  salvarRanking(adicionarAoRanking(lerRanking(), { nome: jogador, pontos: res.pontos, data: Date.now() }));
  mostrar("resultado");
}

$("jogar-novamente").addEventListener("click", () => {
  desenharRanking();
  mostrar("inicio");
});

// ---------- inicialização ----------
montarCategorias();
desenharRanking();
