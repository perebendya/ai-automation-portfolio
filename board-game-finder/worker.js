import {Finder} from "./engine.js";

async function readJSON(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(path + " " + response.status);
  if (!path.endsWith(".gz")) return response.json();
  // Static hosts may serve the gzip file as-is or decode its HTTP encoding.
  const bytes = await response.arrayBuffer();
  const magic = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  if (magic[0] !== 31 || magic[1] !== 139) return JSON.parse(new TextDecoder().decode(bytes));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).json();
}

let finder;
async function load() {
  const [manifest, rules, model] = await Promise.all([
    readJSON("data/catalogue.json"), readJSON("ranking.json"), readJSON("models/trees.json")
  ]);
  const rows = [];
  for (let i = 0; i < manifest.parts.length; i += 4) {
    const batches = await Promise.all(manifest.parts.slice(i,i+4).map(name => readJSON("data/" + name)));
    for (const batch of batches) rows.push(...batch);
    postMessage({type:"progress", loaded:rows.length, total:manifest.count});
  }
  finder = new Finder(manifest, rows, rules, model);
  postMessage({type:"ready", questions:rules.questions, limit:rules.maxQuestions});
}

self.onmessage = async ({data}) => {
  try {
    if (data.type === "load") await load();
    else if (data.type === "rank")
      postMessage({type:"ranked", id:data.id, ...finder.rank(data.filters, data.answers, data.ml, data.limit, data.finished)});
  } catch (error) {
    postMessage({type:"error", message:error.message});
  }
};
