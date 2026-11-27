const el = id => document.getElementById(id);
const lang = () => document.documentElement.lang === "uk" ? "uk" : "en";
const tr = (en, uk) => lang() === "uk" ? uk : en;
const number = value => new Intl.NumberFormat(lang()).format(value);
const rules = new Map();
let worker, request = 0, result, maxQuestions = 12, ready = false;
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
  if (!ready) return;
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
    el("status").textContent = failed ? tr("The catalogue could not load.", "Каталог не завантажився.") :
      tr("Loading the catalogue…","Завантажую каталог…") + (progress ? " " + number(progress.loaded) + " / " + number(progress.total) : "");
    return;
  }
  if (!result) return;
  const {count, next, results} = result;
  const q = rules.get(next);
  el("step").textContent = !count ? tr("Your filters","Умови гри") : q ?
    tr(`Question ${history.length + 1} of ${maxQuestions}`,`Питання ${history.length + 1} з ${maxQuestions}`) : tr("Quiz complete","Підбір завершено");
  el("question").textContent = !count ? tr("No games fit these conditions. Try a wider time or rating range.","За цих умов ігор немає. Спробуй збільшити час або знизити мінімальний рейтинг.") : q ? q[lang() === "uk" ? "question" : "en"] :
    tr("Your shortlist is ready.","Твоя добірка готова.");
  el("answers").hidden = !q;
  el("answers").inert = false;
  el("back").hidden = !history.length;
  el("restart").hidden = !!q || !count || (!history.length && !finished);
  el("finish").hidden = !q;
  el("clear").hidden = !!count;
  el("count").textContent = tr("Games matching your filters · ","Ігор за твоїми умовами · ") + number(count);
  el("games").replaceChildren(...results.map(gameCard));
}

function load() {
  if (worker) worker.terminate();
  failed = false; ready = false; progress = null;
  el("retry").hidden = true;
  el("status").hidden = false;
  el("finder").hidden = true;
  render();
  function error() {
    failed = true; ready = false;
    el("finder").hidden = true;
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
      el("status").hidden = true; el("finder").hidden = false;
      render();
      if (wasInAnswers && !data.next) el("question").focus();
    }
  };
  worker.postMessage({type:"load"});
}

for (const id of ["players","minutes","rating","weight","customPlayers","limit","model"])
  el(id).addEventListener("change", update);
el("answers").addEventListener("click", e => {
  const button = e.target.closest("[data-answer]");
  if (!button || !result?.next || el("answers").inert) return;
  history.push({feature:result.next, value:button.dataset.answer});
  update();
});
el("finish").addEventListener("click", () => { finished = true; update(); el("results-title").focus(); });
el("back").addEventListener("click", () => { history.pop(); finished = false; update(); el("question").focus(); });
el("restart").addEventListener("click", () => { history = []; finished = false; update(); el("question").focus(); });
el("clear").addEventListener("click", () => {
  for (const id of ["players","minutes","weight","rating"]) el(id).value = "0";
  finished = false; update(); el("players").focus();
});
el("retry").addEventListener("click",load);
document.addEventListener("portfolio-language",render);
load();
