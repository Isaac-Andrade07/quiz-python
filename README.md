# 🐍 Quiz de Python para Iniciantes

![Testes](https://github.com/isaac-andrade07/quiz-python/actions/workflows/testes.yml/badge.svg)

Um quiz para testar (e aprender) o básico de Python: cada pergunta tem tempo, pontuação por rapidez e uma explicação curta da resposta certa.

🔗 **Jogue aqui:** https://isaac-andrade07.github.io/quiz-python

## ✨ Funcionalidades

- **21 perguntas** em 4 temas: Básico, Listas e dicionários, Strings e loops e Funções
- Perguntas e alternativas **embaralhadas** a cada partida
- **20 segundos** por pergunta, com barra de tempo
- **Pontuação**: 100 pontos por acerto + bônus de até 50 pela rapidez
- **Explicação** depois de cada resposta, para aprender com o erro
- **Resultado por tema** e revisão de tudo que você errou
- **Ranking** dos 10 melhores, salvo no navegador (localStorage)
- Atalhos de teclado: `1`–`4` ou `A`–`D` para responder, `Enter` para avançar
- Layout responsivo (funciona bem no celular)

## 🛠️ Tecnologias

- HTML, CSS e **JavaScript puro** (ES Modules), sem frameworks
- Perguntas cobrindo os fundamentos do **Python 3**
- Testes com o **test runner nativo do Node.js** (`node:test`)
- **GitHub Actions** rodando os testes a cada push
- **GitHub Pages** para hospedagem

## 🧱 Organização do código

```
├── index.html
├── css/style.css
├── js/
│   ├── perguntas.js   # banco de perguntas
│   ├── quiz.js        # regras do jogo (funções puras, sem DOM)
│   └── app.js         # interface: telas, timer, eventos
├── tests/quiz.test.js # testes das regras
└── .github/workflows/testes.yml
```

A lógica do jogo (`quiz.js`) foi separada da interface (`app.js`). Assim, as regras de pontuação, embaralhamento e ranking podem ser testadas sem abrir o navegador.

## ▶️ Como rodar

```bash
git clone https://github.com/isaac-andrade07/quiz-python.git
cd quiz-python

# os ES Modules precisam de um servidor local:
npx serve .          # ou: python -m http.server

# rodar os testes (Node 20+)
npm test
```

## ➕ Como adicionar perguntas

Inclua um objeto em `js/perguntas.js`:

```js
{
  categoria: "basico",           // basico | colecoes | strings | funcoes
  pergunta: "Texto da pergunta",
  codigo: "opcional",           // trecho de código exibido
  opcoes: ["A", "B", "C", "D"],
  correta: 1,                    // índice da opção certa
  explicacao: "Por que a resposta é essa.",
}
```

Os testes verificam automaticamente se toda pergunta nova é válida.

## 👨‍💻 Autor

**Isaac Andrade**, estudante de Análise e Desenvolvimento de Sistemas.
[LinkedIn](https://www.linkedin.com/in/isaac-raphael-oliveira-andrade-784928313) · [GitHub](https://github.com/isaac-andrade07)
