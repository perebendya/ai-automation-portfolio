const el = id => document.getElementById(id);
const lang = () => document.documentElement.lang === "uk" ? "uk" : "en";
const tr = (en, uk) => lang() === "uk" ? uk : en;
const number = value => new Intl.NumberFormat(lang()).format(value);
const rules = new Map();
let worker, request = 0, result, maxQuestions = 12, ready = false;
let started = false, focusTarget = null, lastAnswer = null;
let history = [], finished = false, failed = false, progress = null;

function textElement(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function filters() {
  const group = el("players").value;
  return {players: group === "custom" ? el("customPlayers").valueAsNumber : Number(group),
    minutes:Number(el("minutes").value), weight:Number(el("weight").value), rating:el("rating").valueAsNumber || 0};
}

function update() {
  if (!ready || !started) return;
  request++;
  const custom = el("players").value === "custom";
  el("custom-size").hidden = !custom;
  if ((custom && (!el("customPlayers").value || !el("customPlayers").reportValidity())) || !el("rating").reportValidity()) {
    el("answers").hidden = true;
    el("games").replaceChildren();
    el("count").textContent = "";
    el("step").textContent = "";
    el("question").textContent = tr("Check your filters to continue.", "Перевір умови гри, щоб продовжити.");
    result = null;
    return;
  }
  const selected = filters();
  if (selected.players) history = history.filter(a => !rules.get(a.feature).group_size);
  el("answers").inert = true;
  if (!result) render();
  worker.postMessage({type:"rank", id:request, filters:selected, answers:history,
    ml:el("model").checked, limit:Number(el("limit").value), finished});
}

function gameCard(g) {
  const li = document.createElement("li");
  const body = document.createElement("div");
  const link = textElement("a", g.name);
  link.href = "https://boardgamegeek.com/boardgame/" + g.id;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  body.append(link);
  const range = g.min === g.max ? g.min : g.min + "–" + g.max;
  const facts = [];
  if (g.min > 0 && g.max > 0) facts.push(tr(range + " players", "Гравці · " + range));
  if (g.minutes > 0) facts.push(number(g.minutes) + tr(" min"," хв"));
  if (g.weight > 0) facts.push(tr("Complexity ","Складність ") + number(Number(g.weight.toFixed(1))) + "/5");
  if (g.rating > 0) facts.push("BGG " + number(Number(g.rating.toFixed(2))) + "/10");
  body.append(textElement("p", facts.join(" · "), "facts"));
  const matches = g.matches.slice(0,3).map(f => rules.get(f)["label_" + lang()]);
  if (matches.length) body.append(textElement("p", tr("Matches your answers · ", "Збіги з відповідями · ") + matches.join(", "), "reasons"));
  if (g.categories || g.mechanics || g.year > 0) {
    const details = document.createElement("details");
    details.append(textElement("summary", tr("Game details","Детальніше про гру")));
    for (const [label, value] of [[tr("Year","Рік"),g.year], [tr("Categories","Категорії"),g.categories], [tr("Mechanics","Механіки"),g.mechanics]]) {
      if (value) details.append(textElement("p", label + " · " + String(value).replaceAll(" | ",", ")));
    }
    body.append(details);
  }
  li.append(body);
  if (g.image?.startsWith("https://cf.geekdo-images.com/")) {
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error",() => img.remove(), {once:true});
    img.src = g.image;
    li.append(img);
  }
  return li;
}

function render() {
  if (!ready) {
    el("status").hidden = !started && !failed;
    el("status").textContent = failed ? tr("The catalogue could not load.", "Каталог не завантажився.") :
      tr("Loading the catalogue…","Завантажую каталог…") + (progress ? " " + number(progress.loaded) + " / " + number(progress.total) : "");
    return;
  }
  if (!started) return;
  if (!result) {
    el("status").hidden = false;
    el("status").textContent = tr("Finding games for your table…", "Підбираю ігри за твоїми умовами…");
    return;
  }
  const {count, next, results} = result;
  const q = rules.get(next);
  const top = results[0];
  const showQuestions = count > 0 && (!!q || history.length > 0 || finished);
  el("preferences").hidden = !showQuestions;
  el("selection").classList.toggle("empty-list", !showQuestions);
  el("list").querySelector(".rank-settings").hidden = !count;
  el("refine-help").hidden = !q;
  el("step").textContent = q ? tr(`Question ${history.length + 1} of up to ${maxQuestions}`, `Запитання ${history.length + 1} із максимум ${maxQuestions}`) : tr("Quiz complete","Опитування завершено");
  el("question").textContent = q ? q[lang() === "uk" ? "question" : "en"] : tr("Your shortlist is ready.","Твоя добірка готова.");
  const hints = {
    is_light_game: tr("Think of rules you can explain in a few minutes.", "Уяви гру, правила якої можна пояснити за кілька хвилин."),
    is_medium_weight: tr("A few rules to learn and room to plan your moves.", "Треба трохи часу на правила, зате є простір планувати ходи."),
    is_heavy_game: tr("These games reward learning detailed rules and planning several moves ahead.", "У таких іграх детальні правила і треба продумувати кілька ходів наперед.")
  };
  el("hint").textContent = q ? hints[q.feature] || tr("Choose what sounds fun for this evening. Skip leaves your ranking as it is.", "Обери те, чого хочеться цього вечора. Якщо пропустиш, порядок ігор збережеться.") : "";
  el("answers").hidden = !q;
  el("answers").inert = false;
  el("back").hidden = !history.length;
  el("restart").hidden = !!q || !count;
  el("finish").hidden = !q;
  el("clear").hidden = !!count;
  let feedback = "";
  if (lastAnswer && top) {
    if (lastAnswer.value === "s") feedback = tr("Question skipped. Your ranking stayed the same.", "Запитання пропущено. Порядок ігор зберігся.");
    else if (lastAnswer.top === top.id) feedback = tr("List updated. Still first · ", "Добірку оновлено. Досі на першому місці · ") + top.name;
    else feedback = tr("New first pick · ", "Нова гра на першому місці · ") + top.name;
  }
  el("feedback").textContent = feedback;
  const {players, minutes} = filters();
  const summary = [tr("Games that fit · ", "Ігор за твоїми умовами · ") + number(count)];
  if (players) summary.push(tr("Players: ", "Гравців: ") + number(players));
  if (minutes) summary.push(tr("Up to ", "До ") + number(minutes) + tr(" min", " хв"));
  el("count").textContent = count ? summary.join("  ·  ") :
    tr("No games fit these settings. Allow more time or lower the minimum rating.", "За цих умов ігор немає. Збільш час на партію або знизь мінімальний рейтинг.");
  el("games").replaceChildren(...results.map(gameCard));
}

function load() {
  if (worker) worker.terminate();
  failed = false; ready = false; progress = null;
  el("retry").hidden = true;
  el("status").hidden = !started;
  render();
  function error() {
    failed = true; ready = false;
    el("selection").hidden = true;
    el("status").hidden = false;
    el("retry").hidden = false;
    render();
  }
  try {
    worker = new Worker(new URL("./worker.js", import.meta.url), {type:"module"});
  } catch { error(); return; }
  worker.onerror = error;
  worker.onmessage = ({data}) => {
    if (data.type === "error") { error(); return; }
    if (data.type === "progress") { progress = data; render(); return; }
    if (data.type === "ready") {
      for (const q of data.questions) rules.set(q.feature,q);
      maxQuestions = data.limit;
      ready = true;
      update();
      return;
    }
    if (data.type === "ranked" && data.id === request) {
      const wasInAnswers = el("answers").contains(document.activeElement);
      result = data;
      el("status").hidden = true; el("selection").hidden = false;
      render();
      if (focusTarget) { el(focusTarget).focus(); focusTarget = null; }
      else if (wasInAnswers) el("question").focus({preventScroll:true});
    }
  };
  worker.postMessage({type:"load"});
}

function resetAnswers() {
  history = []; finished = false; lastAnswer = null;
}

for (const id of ["players","minutes","rating","weight","customPlayers"]) {
  el(id).addEventListener("input", () => {
    request++;
    el("custom-size").hidden = el("players").value !== "custom";
    el("customPlayers").disabled = el("custom-size").hidden;
    el("selection").hidden = true;
    el("status").hidden = !failed;
    started = false; result = null; focusTarget = null;
    resetAnswers();
  });
}
el("customPlayers").required = true;
el("customPlayers").disabled = el("players").value !== "custom";
el("finder").addEventListener("submit", event => {
  event.preventDefault();
  started = true; focusTarget = "results-title";
  if (failed) load();
  else if (ready) update();
  else render();
});
for (const id of ["model","limit"]) el(id).addEventListener("change", () => {
  lastAnswer = null; update();
});
el("answers").addEventListener("click", e => {
  const button = e.target.closest("[data-answer]");
  if (!button || !result?.next || el("answers").inert) return;
  lastAnswer = {top:result.results[0]?.id, value:button.dataset.answer};
  history.push({feature:result.next, value:button.dataset.answer});
  update();
});
el("finish").addEventListener("click", () => {
  finished = true; lastAnswer = null; focusTarget = "list"; update();
});
el("back").addEventListener("click", () => {
  history.pop(); finished = false; lastAnswer = null; focusTarget = "question"; update();
});
el("restart").addEventListener("click", () => {
  resetAnswers(); focusTarget = "question"; update();
});
el("clear").addEventListener("click", () => {
  for (const id of ["players","minutes","weight","rating"]) el(id).value = "0";
  el("customPlayers").disabled = true;
  resetAnswers(); focusTarget = "results-title"; update();
});
el("retry").addEventListener("click",load);
document.addEventListener("portfolio-language",render);
function openSetup() {
  el("finder").hidden = false;
  el("start").setAttribute("aria-expanded", "true");
  el("setup-title").focus({preventScroll:true});
  el("finder").scrollIntoView({block:"start"});
  if (!worker && !failed) load();
}
el("start").addEventListener("click", openSetup);
el("start").hidden = false;
function revealAnchor() {
  if (["#finder", "#setup-title"].includes(location.hash) && el("finder").hidden) openSetup();
  if (location.hash === "#method") el("method").open = true;
}
window.addEventListener("hashchange", revealAnchor);
revealAnchor();
