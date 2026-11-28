const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const cases = require("./rental-conversation-cases.cjs");

const source = ["rental-catalogue.js", "rental-search.js"]
  .map(file => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
const { parseRequest, rankRentals } = vm.runInNewContext(source + "\n;({parseRequest, rankRentals})");

for (const [query, winner, expectedProof, kind] of cases) {
  test(query, () => {
    const plan = parseRequest(query);
    const rows = rankRentals(plan);
    assert.equal(rows[0]?.flat.id ?? null, winner);
    assert.equal(plan.criteria.length + Number(Boolean(plan.budget)) +
      Number(plan.sort !== "match") + plan.ignored.length, 3, "keep all three wishes");
    if (kind === "budget") {
      assert.equal(plan.budget.maxRent, 12000);
      return;
    }
    if (kind === "unknown") {
      assert.equal(plan.ignored.length, 3);
      return;
    }
    assert.equal(plan.ignored.length, kind === "partial" ? 1 : 0);
    if (kind === "partial") assert.match(plan.ignored[0], /кота/);
    assert.equal(plan.sort, kind === "asc" ? "asc" : "match");
    const { evidence, matches, points } = rows[0];
    const proof = plan.budget ? ["rent"] : [];
    for (const [i, fact] of evidence.entries()) {
      assert.equal(fact.value, 1, fact.label[0]);
      proof.push(plan.criteria[i].type === "place" ? "place" : fact.photo + 1);
    }
    assert.deepEqual(proof.sort(), [...expectedProof].sort());
    assert.equal(matches, expectedProof.length);
    assert.equal(points, matches);
    assert.equal(new Set(Array.from(evidence, fact => fact.label[0])).size, evidence.length);
  });
}

test("a desk inside the room cannot confirm a balcony workspace", () => {
  const rows = rankRentals(parseRequest("працювати за столом на балконі"));
  assert.deepEqual(Array.from(rows.filter(row => row.matches), r => r.flat.id), ["h"]);
  assert.match(rows[0].evidence[0].label[0], /Письмовий стіл на заскленому балконі/);
});

test("the same objects above and below each other have different photo evidence", () => {
  const full = q => Array.from(rankRentals(parseRequest(q)).filter(row => row.matches), row => row.flat.id);
  assert.deepEqual(full("килим над диваном"), ["g"]);
  assert.deepEqual(full("диван під килимом"), ["g"]);
  assert.deepEqual(full("диван над килимом"), []);
});

test("a bedroom object cannot be borrowed to complete a kitchen or hallway wish", () => {
  for (const query of ["ліжко на кухні", "білий холодильник у передпокої"]) {
    assert.ok(rankRentals(parseRequest(query)).every(row => row.matches === 0), query);
  }
});
