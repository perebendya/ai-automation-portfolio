const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = ["rental-catalogue.js", "rental-search.js"].map(file =>
  fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
).join("\n");
const {parseRequest, evidenceFor, flats, examples} = vm.runInNewContext(
  code + "\n;({parseRequest, evidenceFor, flats, examples})"
);

function confirmed(query) {
  const {criteria, ignored} = parseRequest(query);
  assert.equal(ignored.length, 0, query);
  return Array.from(criteria, criterion =>
    Array.from(flats.filter(flat => evidenceFor(flat, criterion).value > 0), flat => flat.id)
  );
}

test("a typed wish list preserves the vintage qualifier, shower and wall art", () => {
  for (const query of [
    "хочу щоб був вінтажний диван, душ і картина на стіні",
    "I'm looking for a retro couch, a shower and framed art"
  ]) {
    assert.deepEqual(confirmed(query), [["i"], ["b", "e", "g", "h"], ["b"]]);
  }
});

test("unseen combinations search individual observations and point to the source photo", () => {
  assert.deepEqual(confirmed("балкон з видом на воду і дерев’яна шафа"), [["f"], ["a", "f"]]);
  assert.deepEqual(confirmed("white fridge"), [["e"]]);
  const {criteria} = parseRequest("картини на стіні");
  const art = evidenceFor(flats.find(flat => flat.id === "b"), criteria[0]);
  assert.equal(art.photo, 1);
  assert.match(art.label[0], /картини/);
});

test("unknown details are visible, including unknown modifiers of a known item", () => {
  const {criteria, ignored} = parseRequest("фіолетовий диван, душ і сауна");
  assert.equal(criteria.length, 2);
  assert.deepEqual(Array.from(ignored), ["сауна"]);
  for (const query of ["фіолетовий диван", "рудий диван"]) {
    const [sofa] = parseRequest(query).criteria;
    assert.equal(sofa.approximate, true);
    assert.equal(sofa.label, query);
    assert.equal(Math.max(...flats.map(flat => evidenceFor(flat,sofa).value)), 0.5);
  }
  assert.equal(parseRequest("приватний вертолітний майданчик").criteria.length, 0);
});

test("negating an observed item conflicts only where there is evidence of it", () => {
  const {criteria} = parseRequest("без картин на стіні");
  for (const flat of flats) assert.equal(evidenceFor(flat, criteria[0]).value, flat.id === "b" ? -1 : 0);
  assert.equal(parseRequest("a balcony, though I don't mind the kitchen colour").criteria.length, 1);
});

test("rent, district and free text combine without conflating foreign currency", () => {
  const {criteria, budget, ignored} = parseRequest("на Оболоні до 20 тисяч, бірюзовий диван");
  assert.equal(criteria.length, 2);
  assert.equal(ignored.length, 0);
  assert.equal(budget.maxRent, 20000);
  assert.equal(parseRequest("under ₴13,500").budget.maxRent, 13499);
  assert.equal(parseRequest("under 15k USD").budget, null);
});

test("both languages of every preset still express the same three criteria", () => {
  for (const {query} of examples) {
    const [uk, en] = Array.from(query, parseRequest);
    for (const parsed of [uk,en]) {
      assert.equal(parsed.criteria.length + Number(Boolean(parsed.budget)), 3);
      assert.equal(parsed.ignored.length, 0);
    }
    for (const flat of flats) {
      const values = parsed => Array.from(parsed.criteria, c => evidenceFor(flat,c).value);
      assert.deepEqual(values(uk), values(en));
    }
  }
});

test("asking for two sleeping options does not silently overwrite either one", () => {
  assert.equal(parseRequest("ліжко і диван").criteria.length, 2);
  assert.equal(parseRequest("a bed rather than a sofa").criteria.length, 1);
});

test("informal colour and quantity requests survive an independent price aside", () => {
  for (const query of [
    "бля хочу багато рожевого похуй за які гроші",
    "ціна мені взагалі неважлива, ну хочу побільше рожевого",
    "Покажи щось у рожевих тонах, за будь-які гроші",
    "Damn, lots of pink whatever the rent",
    "money is no object, I want plenty of pink"
  ]) {
    const {criteria, budget, anyRent, ignored} = parseRequest(query);
    assert.equal(criteria.length, 1, query);
    assert.equal(budget, null, query);
    assert.equal(anyRent, true, query);
    assert.equal(ignored.length, 0, query);
    const candidates = flats.filter(flat => evidenceFor(flat, criteria[0]).value > 0);
    assert.deepEqual(Array.from(candidates, flat => flat.id), ["b"], query);
    const photo = evidenceFor(candidates[0], criteria[0]);
    assert.equal(photo.photo, 0);
    assert.match(photo.label[0], /рожевою плиткою/);
    assert.equal(photo.value, criteria[0].abundance ? 0.5 : 1);
  }
});

test("abundance applies across colours and objects without fabricating a measurement", () => {
  for (const query of ["хочу більше зеленого","якомога більше рослин","lots of wood","plenty of blue"]) {
    const parsed = parseRequest(query);
    assert.equal(parsed.ignored.length, 0);
    const [wish] = parsed.criteria;
    assert.equal(wish.abundance, true, query);
    const evidence = flats.map(flat => evidenceFor(flat,wish));
    assert.equal(Math.max(...evidence.map(e => e.value)), 0.5);
    assert(evidence.some(e => e.support > 0));
  }
});

test("price indifference neither negates a visual wish nor removes an explicit cap", () => {
  const noCap = parseRequest("Пофіг на ціну, без рожевого");
  assert.equal(noCap.anyRent, true);
  assert.equal(noCap.criteria[0].dir, -1);
  const capped = parseRequest("пофіг на ціну але до 15 000 грн і хочу рожеву плитку");
  assert.equal(capped.budget.maxRent, 15000);
  assert.equal(capped.anyRent, false);
  assert.equal(capped.criteria.length, 1);
  assert.equal(parseRequest("рожевий слон").criteria.length, 0);
  assert.equal(parseRequest("без фіолетового дивана").criteria.length, 0);
  const justPrice = parseRequest("any price");
  assert.equal(justPrice.anyRent, true);
  assert.equal(justPrice.criteria.length, 0);
});

test("an unverified phrase can offer a known word as an explicit narrower search", () => {
  const miss=parseRequest("рожевий слон");
  assert.equal(miss.criteria.length,0);
  assert.deepEqual(Array.from(miss.suggestions),["рожевий"]);
  assert.deepEqual(confirmed(miss.suggestions[0]),[["b"]]);
  assert.equal(parseRequest("без рожевого слона").suggestions.length,0);
});
