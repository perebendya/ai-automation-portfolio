(() => {
  const byId = id => document.getElementById(id);
  const status = byId("status");
  const players = byId("players");
  const model = byId("model");
  const question = byId("question");
  let data, failed = false, answers = "";

  function render() {
    const lang = document.documentElement.lang;
    const uk = lang === "uk";
    if (!data) {
      if (failed) status.textContent = uk ? "Каталог не завантажився. Онови сторінку, щоб повторити." : "The catalogue could not load. Refresh the page to retry.";
      return;
    }
    const node = data.outcomes[players.value + answers];
    const next = node.question;
    byId("step").textContent = next
      ? (uk ? `Питання ${answers.length + 1} з 4` : `Question ${answers.length + 1} of 4`)
      : (uk ? "Опитування завершено" : "Quiz complete");
    question.textContent = next ? data.questions[next][lang] :
      (uk ? "Ігри підібрано. Порівняй два варіанти ранжування." : "Your shortlist is ready. Try it with and without the model.");
    byId("answers").hidden = !next;
    byId("back").hidden = !answers.length;
    byId("restart").hidden = !!next;

    const games = node[model.checked ? "hybrid" : "quiz"];
    byId("games").replaceChildren(...games.map(id => {
      const [name, min, max, minutes] = data.games[id];
      const range = min === max ? min : `${min}–${max}`;
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = "https://boardgamegeek.com/boardgame/" + id;
      link.textContent = name;
      const facts = document.createElement("small");
      facts.textContent = uk ? `Гравці · ${range} ｜ ${minutes} хв` : `${range} players · ${minutes} min`;
      li.append(link, facts);
      return li;
    }));
  }

  byId("answers").addEventListener("click", event => {
    const button = event.target.closest("button[data-answer]");
    if (!button) return;
    answers += button.dataset.answer;
    render();
    if (byId("answers").hidden) question.focus();
  });
  byId("back").addEventListener("click", () => {
    answers = answers.slice(0, -1);
    render();
    question.focus();
  });
  byId("restart").addEventListener("click", () => {
    answers = "";
    render();
    question.focus();
  });
  players.addEventListener("change", () => { answers = ""; render(); });
  model.addEventListener("change", render);
  document.addEventListener("portfolio-language", render);

  async function init() {
    try {
      const response = await fetch("board-game-finder/demo.json");
      if (!response.ok) throw new Error("Catalogue unavailable");
      data = await response.json();
      render();
      byId("finder").hidden = false;
      status.hidden = true;
    } catch {
      data = null;
      failed = true;
      render();
    }
  }
  init();
})();
