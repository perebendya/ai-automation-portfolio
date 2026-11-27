// Apply one language choice to the header, content and internal links on every page.
(() => {
  const requested = new URL(location.href).searchParams.get("lang");
  const choose = value => ["uk", "en"].includes(value) ? value : null;
  let saved;
  try { saved = localStorage.getItem("dariia-portfolio-language"); } catch {}
  let language = choose(requested) || choose(saved) || (navigator.language.startsWith("uk") ? "uk" : "en");
  const caseScreens = Array.from(document.querySelectorAll("img[data-uk-src]"), image => ({
    image, en: [image.getAttribute("src"), image.alt], uk: [image.dataset.ukSrc, image.dataset.ukAlt]
  }));
  const translations = Array.from(document.querySelectorAll("[data-uk]"), node => ({
    node, en: node.textContent, uk: node.dataset.uk
  }));
  const meta = document.querySelector('meta[name="description"]');
  const englishDescription = meta.content;
  const toggle = document.getElementById("lang");

  const narrowScreen = window.matchMedia("(max-width: 640px)");
  function positionScreens() {
    for (const {image} of caseScreens) {
      const frame = image.parentElement;
      // Start with the selected record in view, with the rest available by swiping.
      frame.scrollLeft = narrowScreen.matches ? (frame.scrollWidth - frame.clientWidth) * .55 : 0;
    }
  }
  narrowScreen.addEventListener("change", positionScreens);
  positionScreens();

  function render() {
    const uk = language === "uk";
    document.documentElement.lang = language;
    for (const screen of caseScreens) {
      const [src, alt] = screen[language];
      if (screen.image.getAttribute("src") !== src) screen.image.src = src;
      screen.image.alt = alt;
      screen.image.parentElement.setAttribute("aria-label", uk ? "Скріншот сценарію" : "Scenario screenshot");
    }
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

