const opposites = [
  en("Килим на стіні","A rug on the wall"),
  en("Яскрава кухня","A brightly coloured kitchen"),
  en("Диван","A sofa"),
  en("Без робочого столу","No desk"),
  en("Без балкона","No balcony"),
  en("Душова кабіна","A shower stall")
];
// Each expression names one visible preference. A positive direction agrees with
// the corresponding fact in the listing; a negative direction favours its opposite.
const phrases = [
  [0,-1,/килим[а-яіїєґ]*|ков[её]р[а-я]*|ковр[а-я]*|carpets?|rugs?/gu],
  [1,-1,/яскрав[а-яіїєґ]*|кислотн[а-яіїєґ]*|вирви[ -]?глаз[а-яіїєґ]*|вирви[ -]?око|кричущ[а-яіїєґ]*|салатов[а-яіїєґ]*|лаймов[а-яіїєґ]*|bright(?:ly)?|neon|loud|garish|flashy|lime.green/gu],
  [1,1,/спокійн[а-яіїєґ]*|нейтральн[а-яіїєґ]*|стриман[а-яіїєґ]*|приглушен[а-яіїєґ]*|пастельн[а-яіїєґ]*|бежев[а-яіїєґ]*|muted|calm|neutral|understated|pastel|subdued/gu],
  [2,1,/ліж[а-яіїєґ]*|матрац[а-яіїєґ]*|\bbeds?\b|mattress(?:es)?/gu],
  [2,-1,/диван[а-яіїєґ]*|sofas?|couch(?:es)?/gu],
  [3,1,/письмов[а-яіїєґ]*\s+ст[іо]л[а-яіїєґ]*|робоч[а-яіїєґ]*\s+місц[а-яіїєґ]*|(?:^|\s)ст(?:іл|олом|олу|ола)(?=\s|$)|працю[а-яіїєґ]*\s+(?:з\s+дому|вдома|за\s+ноутбуком)|\bdesks?\b|work(?:ing)? from home|\bworkstations?\b|\bworkspaces?\b/gu],
  [4,1,/балкон[а-яіїєґ]*|лоджі[а-яіїєґ]*|balcon(?:y|ies)|loggia/gu],
  [5,1,/ванн(?:у|а|ою|і|и)(?![а-яіїєґ]|\s+кімнат)|\bbathtubs?\b|\btub\b|(?:take|taking|have|having|love)\s+(?:a\s+)?baths?/gu],
  [5,-1,/душ(?:ову|ова|овій|і|ем|у)?(?=\s|$)|shower(?:s|ing)?/gu]
];
const indifferent = /байдуж|все одно|неважлив|не важлив|не принципов|не заважа|не хвилю|не проти|мені ок|можна залишити|без різниці|don't (?:mind|care)|do not (?:mind|care)|doesn't matter|is fine|are fine|no preference|okay with|ok with/i;
// Require a currency marker so a distance or floor number cannot become a rent limit.
const rentLimit = /(?<![\p{L}\d])(?:(?:мій бюджет|бюджет|my budget is|budget)\s+)?(не дорожче(?: за| ніж)?|менше ніж|до|максимум|up to|at most|less than|under|max(?:imum)?)\s*(₴\s*|uah\s+)?(\d+(?:[,\s]\d{3})*)(?:\s*(тис(?:яч[іу]?)?\.?|k))?(?:\s*(грн|гривень|₴|uah))?(?![\p{L}\d])(?:\s*(?:\/\s*(?:міс(?:яць)?|month)|на місяць|per month|a month))?/giu;
function extractBudget(query) {
  let budget=null;
  const remainder=query.replace(rentLimit,(match,comparison,prefix,number,scale,suffix,offset)=>{
    if(!prefix && !suffix && !scale) return match;
    if(!prefix && !suffix && /^(?:\s*(?:usd|eur|dollars?|euros?|долар|євро))/iu.test(query.slice(offset + match.length))) return match;
    const amount=Number(number.replace(/[,\s]/g,""))*(scale ? 1000 : 1);
    if(!Number.isSafeInteger(amount)) return match;
    const exclusive=/^(under|less than|менше ніж)/u.test(comparison);
    const maxRent=amount-(exclusive ? 1 : 0);
    if(!budget || maxRent<budget.maxRent) budget={amount,maxRent,exclusive};
    return " ";
  });
  return {budget,remainder};
}
// The same normalization is used for a visitor's words and the bilingual photo index.
const vocabulary = [
  ["sofa", /^(?:диван.*|соф[аиуіою]|канап.*|sofas?|couch(?:es)?)$/u],
  ["vintage", /^(?:вінтаж.*|винтаж.*|ретро|vintage|retro|antique)$/u],
  ["picture", /^(?:картин.*|постер.*|репродукц.*|принт.*|pictures?|paintings?|posters?|prints?|artwork|art)$/u],
  ["wall", /^(?:стін[а-яіїєґ]*|настін.*|walls?)$/u],
  ["balcony", /^(?:балкон.*|лоджі.*|balcon(?:y|ies)|loggia)$/u],
  ["enclosed", /^(?:засклен.*|застеклен.*|glazed|enclosed)$/u],
  ["desk", /^(?:письмов.*|робоч.*|desks?|workspaces?|workstations?)$/u],
  ["table", /^(?:стіл|стола|столу|столи|столів|столом|tables?)$/u],
  ["coffee-table", /^(?:столик.*|столичок)$/u],
  ["chair", /^(?:стільц.*|стілець|chairs?)$/u],
  ["bed", /^(?:ліж[кеч].*|beds?)$/u],
  ["wood", /^(?:дерев'ян.*|wooden|wood)$/u],
  ["plant", /^(?:вазон.*|рослин.*|plants?|houseplants?)$/u],
  ["flower", /^(?:квіт(?:и|ів|ами|ка|ки|ок|кою)|flowers?)$/u],
  ["window", /^(?:вікн.*|вікон|windows?)$/u],
  ["shower", /^(?:душ|душем|душ[оі].*|showers?)$/u],
  ["bath", /^(?:ванн[а-яії]*|bathtubs?|tubs?)$/u],
  ["kitchen", /^(?:кух[а-яіїєґ]+|kitchens?|cabinets?)$/u],
  ["colour", /^(?:колір|кольор.*|colou?rs?)$/u],
  ["rug", /^(?:килим.*|ковер|ковр.*|carpets?|rugs?)$/u],
  ["floor", /^(?:підло[гз].*|floors?|flooring)$/u],
  ["mirror", /^(?:дзеркал(?:о|а|і|ом|ами)|mirrors?)$/u],
  ["glass", /^(?:склян.*|glass)$/u],
  ["gas", /^(?:газов.*|gas)$/u],
  ["stove", /^(?:плит(?:а|и|у|і|ою)|stoves?|cookers?|cooktops?)$/u],
  ["fridge", /^(?:холодильник.*|fridges?|refrigerators?)$/u],
  ["oven", /^(?:духов(?:к|ц).*|ovens?)$/u],
  ["water", /^(?:вод[аиуіою]|канал.*|water|canal)$/u],
  ["view", /^(?:вид|видом|краєвид.*|краєвид|views?|overlooking)$/u],
  ["frame", /^(?:рам[кц].*|рамі|framed|frames?)$/u],
  ["velvet", /^(?:оксамит.*|велюр.*|velvet)$/u]
];
const neutralWords=new Set(("я ми мені нам мене оренда оренди район районі райончику хотілось хочеться можна знайти оселю треба потрібен потрібна потрібне потрібні потрібний потрібно хочу хочеться хотіла хотів б би щоб щоби аби була був було були буде бути є мав мала мали має мають шукаю шукаємо квартиру квартира квартирі житло помешкання орендувати бажано подобається подобаються люблю вітаю привіт будь ласка ще також тільки тож і й та а з зі із на над у в до за під для біля поруч коло від при там де що який яка яке які цей ця це ці " +
  "i i'd i’d id would like want need looking for am we my me a an the it its with at on of in to by and or please that has have is be prefer flat apartment rental also really some any i'm we're rent renting love somewhere ideally hoping find nice should can could get beside near above next there so " +
  "без не жодних жодного жодної жоден ніяких уникаю without no not avoid hate don't rather than").split(/\s+/u));
function words(value){
  return value.toLowerCase().normalize("NFKC").replace(/[’‘ʼ]/gu,"'").match(/[\p{L}\d]+(?:'[\p{L}]+)*/gu)||[];
}
function term(word){
  for(const [key,pattern] of vocabulary) if(pattern.test(word)) return key;
  if(/[а-яіїєґ]/u.test(word) && word.length>=4){
    return word.replace(/(?:ими|іми|ами|ями|ого|ому|ьою|ою|ею|ій|ий|их|ої|ах|ях|ом|ів|[аеиіоуяює])$/u,"");
  }
  return word.length>3 ? word.replace(/s$/u,"") : word;
}
function terms(value){
  return [...new Set(words(value).filter(word=>!neutralWords.has(word)).map(term))];
}
const evidenceIndex=[];
for(const flat of flats){
  photoDetails[flat.id].forEach((objects,photo)=>{
    for(const label of objects){
      const groups=label.flatMap(line=>line.toLowerCase().split(/\s+(?:над|під|на|біля|у|в|із|зі|з|та|with|and|above|on|by|beside|overlooking|in)\s+/u));
      evidenceIndex.push({id:flat.id,photo,label,tokens:new Set(label.flatMap(terms)),
        objects:groups.map(group=>new Set(terms(group)))});
    }
  });
}
const placeForms={
 a:/нивк[аиу]|нивках|nyvky/u, b:/лук'янів(?:ка|ці|ку)|lukianivka/u,
 c:/поділ|подол[іу]|podil/u, d:/оболон[ьі]|obolon/u, e:/солом'ян(?:ка|ці|ку)|solomianka/u,
 f:/русанів(?:ка|ці|ку)|rusanivka/u, g:/теремк(?:и|ах)|teremky/u, h:/позняк(?:и|ах)|pozniaky/u,
 i:/золот(?:і ворота|их воріт|их воротах)|zoloti vorota/u
};
function detailMatch(tokens,clause){
  // With an explicit relationship ("art above a sofa"), search the full observation.
  // Otherwise keep modifiers on their object ("red rug above a sofa" is not a red sofa).
  const relation=/\s(?:над|під|на|біля|поруч|із|зі|з|у|в|with|above|on|by|beside|overlooking|in)\s/u.test(clause);
  return evidenceIndex.filter(entry=>{
    const groups=relation ? [entry.tokens] : entry.objects;
    return groups.some(group=>tokens.every(token=>group.has(token)));
  });
}
function baseMatches(clause){
  const matches=[];
  for(const [key,dir,pattern] of phrases){
    // Colour adjectives describe the kitchen only when the kitchen is in this clause.
    if(key===1 && !/кух|фасад|kitchen|cabinet/u.test(clause)) continue;
    if(key===0 && /підло[гз]|floor/u.test(clause)) continue;
    for(const hit of clause.matchAll(pattern)){
      if(/[\p{L}\d]/u.test(clause[hit.index-1]||"") && !/^\s/u.test(hit[0])) continue;
      if(/[\p{L}\d]/u.test(clause[hit.index+hit[0].length]||"")) continue;
      matches.push({key,dir,start:hit.index,end:hit.index+hit[0].length});
    }
  }
  return matches.sort((a,b)=>a.start-b.start);
}
// These are parts of a supported expression ("coffee on the balcony"), not extra wishes.
const contextual = [
  /на\s+стінах|на\s+стіні|настінн[а-яіїєґ]*|(?:on\s+the\s+)?walls?/gu,
  /кух[а-яіїєґ]*|колір|кольор[а-яіїєґ]*|фасад[а-яіїєґ]*|kitchens?|colou?rs?|cabinets?/gu,
  /для сну|спати|sleep(?:ing)?(?:\s+(?:in|on))?|real|окрем[а-яіїєґ]*/gu,
  /для роботи|писати|працювати|work\s+at|writing/gu,
  /(?:пити|випити) каву|каву|coffee|для (?:моїх )?рослин|for (?:my )?plants/gu,
  /(?:приймати|прийняти|митися|купатися|купатись|увечері|для купання)|кабін[а-яіїєґ]*|for a long soak|stall|enclosure/gu
];
function parseRequest(raw){
  const normalized=raw.normalize("NFKC").toLowerCase().replace(/[’‘ʼ]/gu,"'")
    .replace(/,\s*(щоб|щоби)\s+/gu," $1 ").replace(/не хочу\s*щоб/gu,"не хочу щоб");
  const {budget,remainder}=extractBudget(normalized);
  const selected=new Map(), ignored=new Set();
  // The separators are kept so shared negation can apply to a coordinated list.
  const chunks=remainder.replace(/\brather than\b/gu,",not ").replace(/\sа не\s/gu,",не ")
    .split(/([,.;!?+&\n]+|\s+(?:але|проте|однак|but|however|though|та|і|й|або|ні|and|or)\s+)/iu);
  let previousNegative=false;
  function choose(key,criterion,indifferentHere){
    if(indifferentHere) selected.delete(key);
    else selected.set(key,criterion);
  }
  for(let n=0;n<chunks.length;n+=2){
    let clause=chunks[n].trim();
    if(!clause){previousNegative=false;continue}
    const conjunction=(chunks[n-1]||"").trim();
    const carry=previousNegative && /^(?:і|й|та|або|ні|and|or)$/u.test(conjunction)
      && !/^(?:я |хочу|потріб|мені |з |із |є |i |a |an |with |would |need )/u.test(clause);
    const indifferentHere=indifferent.test(clause);
    const negative=carry || /(?:^|\s)(?:без|жодн[а-яіїєґ]*|не|уникаю|without|no|not|avoid|hate|don't|is a dealbreaker|are a dealbreaker)(?:\s|$)/u.test(clause);
    previousNegative=negative && !indifferentHere;
    const dir=negative ? -1 : 1;
    for(const flat of flats){
      const place=clause.match(placeForms[flat.id]);
      if(!place) continue;
      choose("place:"+flat.id,{type:"place",id:flat.id,dir,label:flat.name},indifferentHere);
      clause=clause.replace(place[0]," ");
    }
    // Preserve independent location/policy requests alongside a visible item.
    clause=clause.replace(/(?:біля|поруч (?:із|з)|поблизу)\s+метро|near (?:the )?(?:metro|subway)|(?:з |із )?(?:котом|собакою|тваринами)|(?:pet[ -]friendly|with pets)/gu,part=>{
      if(!indifferentHere) ignored.add(part.trim());
      return " ";
    }).trim();
    if(!clause) continue;
    const found=baseMatches(clause);
    let residual=clause;
    for(const hit of [...found].reverse()){
      residual=residual.slice(0,hit.start)+" ".repeat(hit.end-hit.start)+residual.slice(hit.end);
    }
    for(const {key} of found) residual=residual.replace(contextual[key]," ");
    if(found.length && (!terms(residual).length || indifferentHere)){
      for(const {key,dir:baseDir} of found){
        const direction=baseDir*dir;
        if(indifferentHere){
          selected.delete("trait:"+key+":1");
          selected.delete("trait:"+key+":-1");
        }else{
          selected.set("trait:"+key+":"+direction,{type:"trait",key,dir:direction});
        }
      }
      continue;
    }
    const detailText=clause.replace(indifferent," ");
    const tokens=terms(detailText);
    if(!tokens.length) continue;

    const label=clause.replace(/^(?:(?:хочу|щоб|щоби|квартиру|прошу|мені|не|потрібен|потрібна|потрібні|був|була|було|були|без|з|із|і|ще|шукаю|i'd|i'm|i|looking|for|would|like|want|need|with|without|no|a|an|the)\s+)+/u,"").trim()||clause;
    const matches=detailMatch(tokens,label);
    if(matches.length){
      choose("detail:"+[...tokens].sort().join("/"),{type:"detail",dir,label,matches},indifferentHere);
    }else if(!indifferentHere){
      ignored.add(clause);
    }
  }
  return {criteria:[...selected.values()],budget,ignored:[...ignored]};
}
function evidenceFor(flat,criterion){
  if(criterion.type==="trait"){
    const [value,photo,label]=flat.facts[criterion.key];
    return {value:value*criterion.dir,photo,label};
  }
  if(criterion.type==="place"){
    return {value:(criterion.id===flat.id ? 1 : -1)*criterion.dir,photo:null,label:flat.name};
  }
  const match=criterion.matches.find(entry=>entry.id===flat.id);
  if(match) return {value:criterion.dir,photo:match.photo,label:match.label};
  return {value:0,photo:null,label:en("Фото не підтверджують «"+criterion.label+"»","Photos do not confirm “"+criterion.label+"”")};
}
