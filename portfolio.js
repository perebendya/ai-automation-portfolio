// Apply one language choice to the header, content and internal links on every page.
(() => {
  const requested = new URL(location.href).searchParams.get("lang");
  const choose = value => ["uk", "en"].includes(value) ? value : null;
  let saved;
  try { saved = localStorage.getItem("dariia-portfolio-language"); } catch {}
  let language = choose(requested) || choose(saved) || (navigator.language.startsWith("uk") ? "uk" : "en");
  // Project cards share the language switcher with the apps they launch.
  const finderCard = document.querySelector('.project-card[href="boardgames.html"]');
  if (finderCard) {
    const sectionTitle = finderCard.closest("section").querySelector("h2");
    sectionTitle.textContent = "Interactive projects";
    sectionTitle.dataset.uk = "Інтерактивні проєкти";
    const description = finderCard.querySelector(".card-copy p");
    description.textContent = "My System Analysis thesis. Find a game for your group in a catalogue of 30,224 board games.";
    description.dataset.uk = "Дипломна із системного аналізу. Знайди гру для своєї компанії в каталозі з 30 224 настільних ігор.";
  }
  const caseLinks = [];
  for (const [id, image, en, uk] of [
    ["funnels", "funnel-review", "View the reading quiz example", "Відкрити сценарій із квізом про читання"],
    ["search", "candidate-search", "View the fictional profile search", "Відкрити сценарій пошуку за вигаданими профілями"]
  ]) {
    const card = document.getElementById(id);
    if (!card?.matches(".casework details")) continue;
    const link = document.createElement("a");
    link.className = "case-example-link";
    link.textContent = en;
    link.dataset.uk = uk;
    card.append(link);
    card.open = true;
    caseLinks.push({link, image});
  }
  const translations = Array.from(document.querySelectorAll("[data-uk]"), node => ({
    node, en: node.textContent, uk: node.dataset.uk
  }));
  const meta = document.querySelector('meta[name="description"]');
  const englishDescription = meta.content;
  const toggle = document.getElementById("lang");

  function render() {
    const uk = language === "uk";
    document.documentElement.lang = language;
    for (const {link, image} of caseLinks) link.href = "assets/" + image + "-" + language + ".png";
    for (const entry of translations) entry.node.textContent = entry[language];
    document.querySelectorAll("[data-only]").forEach(node => { node.hidden = node.dataset.only !== language; });
    for (const link of document.querySelectorAll("a[data-site-link]")) {
      const url = new URL(link.href);
      url.searchParams.set("lang", language);
      link.setAttribute("href", url.pathname.split("/").pop() + url.search + url.hash);
    }
    meta.content = uk ? meta.dataset.ukDescription : englishDescription;
    document.querySelector(".masthead nav").setAttribute("aria-label", uk ? "Навігація портфоліо" : "Portfolio navigation");
    toggle.lang = uk ? "en" : "uk";
    toggle.textContent = uk ? "English" : "Українською";
    toggle.setAttribute("aria-label", uk ? "Switch to English" : "Перейти на українську");
  }

  toggle.addEventListener("click", () => {
    language = language === "uk" ? "en" : "uk";
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    try { history.replaceState(history.state, "", url); } catch {}
    try { localStorage.setItem("dariia-portfolio-language", language); } catch {}
    render();
    document.dispatchEvent(new Event("portfolio-language"));
  });
  render();
})();

