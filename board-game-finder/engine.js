// Browser implementation of src/recommender_core.py. Question wording, weights
// and the order used to break ties come from the same ranking.json file.
function bounds(values) {
  let min = Infinity, max = -Infinity;
  for (const value of values) { min = Math.min(min, value); max = Math.max(max, value); }
  return {min, max};
}

function unit(value, range) {
  return range.max === range.min ? 0 : (value - range.min) / (range.max - range.min);
}

function predict(row, model, featureIndices) {
  let prediction = model.base;
  for (const tree of model.trees) {
    let node = tree[0];
    while (Array.isArray(node)) {
      const [feature, threshold, left, right] = node;
      node = tree[(row[featureIndices[feature]] ?? 0) <= threshold ? left : right];
    }
    prediction += node;
  }
  return prediction;
}

export class Finder {
  constructor(manifest, rows, rules, model) {
    const columns = Object.fromEntries(manifest.columns.map((name, index) => [name, index]));
    if (rows.length !== manifest.count || new Set(rows.map(r => r[columns.id])).size !== rows.length)
      throw new Error("Incomplete game catalogue");
    this.rows = rows;
    this.columns = columns;
    this.rules = rules;
    this.questions = rules.questions.map(q => ({...q, col: columns[q.feature], known:(q.requiresPositive ?? []).map(k => columns[k])}));
    this.model = model;
    this.featureIndices = model.features.map(f => columns[f]);
    if ([...this.featureIndices, ...this.questions.map(q => q.col)].some(i => i === undefined))
      throw new Error("Catalogue feature schema mismatch");
    this.ml = new Float64Array(rows.length).fill(NaN);
    const ranks = rows.map(row => 1 / Math.max(1, row[columns.rank] ?? 30000));
    const votes = rows.map(row => Math.log1p(row[columns.usersrated] ?? 0));
    const rank = bounds(ranks), vote = bounds(votes);
    this.base = Float64Array.from(rows, (row, i) => rules.rankBonus * (
      .4 * (ranks[i] - rank.min) / (rank.max - rank.min + 1e-9) +
      .3 * (votes[i] - vote.min) / (vote.max - vote.min + 1e-9) +
      .3 * Math.min(10, Math.max(0, row[columns.bayesaverage] ?? 0)) / 10
    ));
  }

  nextQuestion(ranked, history, players) {
    if (history.length >= this.rules.maxQuestions || ranked.length < 2) return null;
    const answered = new Set(history.map(a => a.feature));
    const asked = this.questions.filter(q => answered.has(q.feature));
    const pool = ranked.slice(0, this.rules.poolSize);
    const covered = new Set(asked.map(q => q.samePreference ?? q.feature));
    const choices = [];
    for (const q of this.questions) {
      if (covered.has(q.samePreference ?? q.feature) || (players && q.group_size)) continue;
      let yes = 0, known = 0;
      for (const g of pool) {
        const row = this.rows[g.index];
        if (!q.known.every(i => row[i] > 0)) continue;
        const v = row[q.col];
        if (v != null) { yes += v; known++; }
      }
      if (!yes || yes === known) continue;
      const p = yes / known;
      const entropy = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
      const used = asked.filter(a => a.category === q.category).length;
      const score = entropy + (4 - q.priority) * this.rules.priorityBonus - used * this.rules.categoryPenalty;
      choices.push({q, score});
    }
    const hard = choices.filter(c => c.q.kind === "hard");
    const hardFirst = asked.filter(q => q.kind === "hard").length < this.rules.hardPhase && hard.length;
    const candidates = hardFirst ? hard : choices;
    return candidates.reduce((best, c) => !best || c.score > best.score ? c : best, null)?.q ?? null;
  }

  rank(filters, history, useModel, limit, finished = false) {
    const c = this.columns;
    const answers = history.map(a => ({q: this.questions.find(q => q.feature === a.feature), value:a.value}))
      .filter(a => a.q && a.value !== "s");
    const games = [];
    for (const [index, row] of this.rows.entries()) {
      if (filters.players && !(row[c.minplayers] > 0 && row[c.minplayers] <= filters.players && row[c.maxplayers] >= filters.players)) continue;
      if (filters.minutes && !(row[c.playingtime] > 0 && row[c.playingtime] <= filters.minutes)) continue;
      if (filters.weight && !(row[c.averageweight] > 0 && row[c.averageweight] <= filters.weight)) continue;
      if (filters.rating && !(row[c.bayesaverage] >= filters.rating)) continue;
      let score = this.base[index];
      for (const {q, value} of answers) {
        if (row[q.col] == null || !q.known.every(i => row[i] > 0)) continue;
        const weight = q.kind === "hard" ? this.rules.hardWeight : this.rules.softWeight;
        score += row[q.col] === (value === "y" ? 1 : 0) ? weight : -weight;
      }
      games.push({index, score});
    }
    games.sort((a,b) => b.score - a.score || a.index - b.index);
    const next = finished ? null : this.nextQuestion(games, history, filters.players);
    if (useModel && games.length) {
      const scoreRange = {min:games[games.length - 1].score, max:games[0].score};
      for (const g of games) {
        if (Number.isNaN(this.ml[g.index]))
          this.ml[g.index] = predict(this.rows[g.index], this.model, this.featureIndices);
      }
      const mlRange = bounds(games.map(g => this.ml[g.index]));
      for (const g of games) {
        const alpha = this.rules.quizWeight;
        g.score = alpha * unit(g.score, scoreRange) + (1 - alpha) * unit(this.ml[g.index], mlRange);
      }
      games.sort((a,b) => b.score - a.score || a.index - b.index);
    }
    const results = games.slice(0, limit).map(({index}) => {
      const r = this.rows[index];
      const matches = answers.filter(a => a.value === "y" && r[a.q.col] === 1 && a.q.known.every(i => r[i] > 0)).map(a => a.q.feature);
      return {
        id:r[c.id], name:r[c.name], image:r[c.thumbnail], year:r[c.yearpublished],
        min:r[c.minplayers], max:r[c.maxplayers], minutes:r[c.playingtime],
        weight:r[c.averageweight], rating:r[c.bayesaverage], rank:r[c.rank],
        categories:r[c.categories_raw], mechanics:r[c.mechanics_raw], matches
      };
    });
    return {count:games.length, next:next?.feature ?? null, results};
  }
}
