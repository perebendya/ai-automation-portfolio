const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = ["rental-catalogue.js", "rental-search.js"].map(file =>
  fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
).join("\n");
const {parseRequest, rankRentals, spellingSuggestion} = vm.runInNewContext(
  code + "\n;({parseRequest, rankRentals, spellingSuggestion})"
);

// Expected ordering, number of visual/place criteria, winner, bounds and unsupported count.
const cases = [
  ["хочу килим на стіні, балкон і якнайдешевше", "asc", 2, "a"],
  ["Якомога дешевша квартира з балконом", "asc", 1, "b"],
  ["Від найдешевших до найдорожчих", "asc", 0, "g"],
  ["Cheapest flat with a bed and a shower", "asc", 2, "e"],
  ["Килим на стіні, балкон, спочатку дорожчі", "desc", 2, "f"],
  ["Найдорожча квартира", "desc", 0, "i"],
  ["balcony, highest rent first", "desc", 1, "i"],
  ["ціна неважлива, хочу рожеву плитку", "match", 1, "b"],
  ["до 18к та балкон", "match", 1, "b", 0, 18000],
  ["балкон, не більше 18 000", "match", 1, "b", 0, 18000],
  ["a balcony under ₴18,000", "match", 1, "b", 0, 17999],
  ["дешевше за 16 500 грн, балкон", "match", 1, "g", 0, 16499],
  ["бюджет 17,5 тис. грн, хочу диван", "match", 1, "g", 0, 17500],
  ["від 20 тисяч, стіл", "match", 1, "c", 20000, null],
  ["від 15 до 18 тисяч, балкон", "match", 1, "b", 15000, 18000],
  ["15–18 тис. грн і ліжко", "match", 1, "a", 15000, 18000],
  ["between 17k and 23k UAH, cheapest with a balcony", "asc", 1, "a", 17000, 23000],
  ["до 10 тис. грн, душ", "match", 1, null, 0, 10000],
  ["тільки до 13 500 грн", "match", 0, "g", 0, 13500],
  ["душ або ванна і якнайдешевше", "asc", 1, "g"],
  ["на Оболоні або на Подолі, балкон", "match", 2, "d"],
  ["шукаю ліжко, без килимів на стінах", "match", 2, "e"],
  ["вінтажний диван, душ і картина на стіні", "match", 3, "b"],
  ["бля хочу багато рожевого похуй за які гроші", "match", 1, "b"],
  ["без ванни і без балкона", "match", 2, "g"],
  ["білий холодильник", "match", 1, "e"],
  ["Килим на стіні та балкон, від 19 до 24к, найдешевший варіант", "asc", 2, "f", 19000, 24000],
  ["Ліжко або диван", "match", 1, "g"],
  ["Балкон та килим на стіні", "match", 2, "a"],
  ["Стіл біля вікна, найдешевше", "asc", 1, "e"],
  ["балкон, up to 15k USD", "match", 1, "b", 0, null, 1],
  ["Квартира до 5 хвилин від метро", "match", 0, null, 0, null, 1]
];

for (const [query, sort, count, winner, min=0, max=null, ignored=0] of cases) {
  test(query, () => {
    const plan = parseRequest(query);
    const rows = rankRentals(plan);
    assert.equal(plan.sort, sort);
    assert.equal(plan.criteria.length, count);
    assert.equal(plan.ignored.length, ignored);
    assert.equal(plan.budget?.minRent ?? 0, min);
    assert.equal(Number.isFinite(plan.budget?.maxRent) ? plan.budget.maxRent : null, max);
    assert.equal(rows[0]?.flat.id ?? null, winner);
    assert.ok(rows.every(({flat}) => flat.rent >= min && (max === null || flat.rent <= max)));
  });
}

test("order by rent only among equally relevant flats", () => {
  const rows = rankRentals(parseRequest(cases[0][0]));
  assert.deepEqual(Array.from(rows.filter(row => row.matches === 2), row => row.flat.id), ["a","f"]);
  assert.deepEqual(Array.from(rows.slice(0,2), row => row.points), [2,2]);
  const cheapest = rows.find(row => row.flat.id === "g");
  assert.equal(cheapest.matches, 1);
  assert.equal(cheapest.evidence[1].value, 0);
});

test("additional price expressions and punctuation do not alter visual wishes", () => {
  for (const query of ["балкон,до 18к","балкон, укластися в 18 тисяч"]) {
    const plan = parseRequest(query);
    assert.equal(plan.budget.maxRent, 18000);
    assert.equal(plan.criteria.length, 1);
    assert.equal(plan.ignored.length, 0);
  }
  for (const query of ["найменша ціна, балкон","I need the cheapest one with a balcony"]) {
    const plan = parseRequest(query);
    assert.equal(plan.sort, "asc");
    assert.equal(rankRentals(plan)[0].points, 1);
  }
  assert.equal(parseRequest("дешевий диван").sort, "match");
  assert.equal(parseRequest("не найдешевшу квартиру").sort, "match");
});

test("offer a catalogue spelling while preserving the other wishes and exact budget", () => {
  assert.equal(spellingSuggestion("хочу балкно, душ до 18к"), "хочу балкон, душ до 18к");
  assert.equal(spellingSuggestion("need a balconyy, under 18000"), "need a balcony, under 18000");
  assert.equal(spellingSuggestion("до 15000, рожева плитка"), null);
  assert.equal(spellingSuggestion("ліфт і метро"), null);
});
