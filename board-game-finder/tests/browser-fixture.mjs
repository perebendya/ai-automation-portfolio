import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {Finder} from "../engine.js";

const read = path => readFileSync(new URL("../" + path, import.meta.url));
const json = path => JSON.parse(read(path));
const manifest = json("data/catalogue.json");
const rows = manifest.parts.flatMap(path => JSON.parse(gunzipSync(read("data/" + path))));
const finder = new Finder(manifest, rows, json("ranking.json"), json("models/trees.json"));
finder.rank({}, [], true, 1);
const states = JSON.parse(readFileSync(0,"utf8"));
const results = states.map(s => {
  const r = finder.rank(s.filters, s.answers, s.ml, 10);
  return {count:r.count, next:r.next, ids:r.results.map(g => g.id)};
});
process.stdout.write(JSON.stringify({predictions:Array.from(finder.ml), results}));
