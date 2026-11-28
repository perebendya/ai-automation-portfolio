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
// Remove a price aside as a unit: its indifference applies to rent alone.
const priceTopic = "(?:ціна|ціну|ціни|ціною|бюджет(?:у|ом)?|вартість|вартістю|гроші|грошах|price|rent|cost|budget|money)";
const doesntMatter = "(?:похуй|пофіг(?:у)?|байдуже|все одно|без різниці|не\\s*важлив[а-яіїєґ]*|не\\s*принципов[а-яіїєґ]*|не має значення|неважливо|не хвилює|не цікавить|не питання|не грає ролі)";
const priceAside = new RegExp([
  "(?:мені\\s+)?(?:взагалі\\s+|абсолютно\\s+)?"+doesntMatter+"\\s+(?:(?:яка|який|які|на|за|скільки|це|коштує|воно)\\s+){0,4}"+priceTopic,
  "(?:мені\\s+)?(?:взагалі\\s+|абсолютно\\s+)?"+doesntMatter+"\\s+(?:за\\s+скільки|скільки\\s+(?:(?:це|вона)\\s+)?коштує)",
  "(?:(?:за|на)\\s+)?"+priceTopic+"\\s*(?:[-–—]\\s*)?(?:мені\\s+)?(?:взагалі\\s+|абсолютно\\s+)?"+doesntMatter,
  "(?:за будь-як[а-яіїєґ]*\\s+(?:ціну|гроші)|незалежно від (?:ціни|вартості)|без обмежень (?:за ціною|по бюджету)|бюджет без обмежень)",
  "(?:(?:i )?(?:don't|do not) (?:care|mind)(?: about)? (?:the )?(?:price|rent|cost|budget)|(?:the )?(?:price|rent|cost|budget) (?:doesn't|does not) matter|(?:at |for )?any price|whatever (?:the )?(?:price|rent|cost)|regardless of (?:the )?(?:price|rent|cost)|no budget (?:cap|limit)|money is no object)"
].join("|"), "giu");
const asideWords = /(?<![\p{L}\d])(?:бля(?:дь|ть)?|блін|бл[яі]н|капєц|короче|ну|типу|кароч|пліз|будь ласка|як би|чесно кажучи|damn|fucking|honestly|please|you know)(?![\p{L}\d])/gu;
const manyWords = /(?<![\p{L}\d])(?:якнайбільше|якомога більше|побільше|(?:більше|more)(?!\s+(?:ніж|за|than|\d))|(?:дуже |прямо? )?багато|купа|купу|безліч|чимало|as much|(?:a )?lot(?:s)? of|plenty of|loads of|a ton of|many)(?![\p{L}\d])/gu;
const colours = [
  ["pink", "рожевого", /^(?:рожев|рожевеньк|розов)[а-яіїєґ]*$|^pink(?:ish)?$/u],
  ["green", "зеленого", /^зелен[а-яіїєґ]*$|^green$/u],
  ["red", "червоного", /^червон[а-яіїєґ]*$|^red$/u],
  ["blue", "синього", /^син(?:ій|і|я|є|ього|ьої|ім|ю|ьою|іх)$|^blue$/u],
  ["yellow", "жовтого", /^жовт[а-яіїєґ]*$|^yellow$/u],
  ["white", "білого", /^біл(?:ий|а|і|е|ого|ої|ій|у|ою|ими|их|им|ому)$|^white$/u],
  ["black", "чорного", /^чорн[а-яіїєґ]*$|^black$/u],
  ["grey", "сірого", /^сір[а-яіїєґ]*$|^gr[ae]y$/u],
  ["teal", "бірюзового", /^бірюзов[а-яіїєґ]*$|^(?:teal|turquoise)$/u],
  ["brown", "коричневого", /^коричнев[а-яіїєґ]*$|^brown$/u]
];
const colourDecor = /(?<![\p{L}\d])(?:кольор[а-яіїєґ]*|колір|тон(?:и|ах|ів)|відтінк[а-яіїєґ]*|інтер'єр[а-яіїєґ]*|довкола|навколо|decor|interior|tones?|shades?|colou?rs?)(?![\p{L}\d])/gu;
const objectsForSuggestions = new Set("sofa picture balcony desk table coffee-table chair bed plant flower window shower bath kitchen rug mirror fridge stove oven".split(" "));

// An incomplete description can still point to the requested object. Keep it
// separate from exact matches and never use it to infer that a negated item is absent.
function relatedObjects(tokens){
  const anchors=tokens.filter(token=>objectsForSuggestions.has(token));
  if(!anchors.length) return [];
  const bestByFlat=new Map();
  for(const entry of evidenceIndex){
    for(const group of entry.objects){
      if(!anchors.every(token=>group.has(token))) continue;
      const covered=tokens.filter(token=>group.has(token)).length;
      if(covered>(bestByFlat.get(entry.id)?.covered||0)){
        bestByFlat.set(entry.id,{...entry,covered});
      }
    }
  }
  return [...bestByFlat.values()];
}

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
  ["tile", /^(?:плитк[а-яіїєґ]*|плитці|tiles?|tiled)$/u],
  ["backsplash", /^(?:фартух[а-яіїєґ]*|backsplash(?:es)?)$/u],
  ["fridge", /^(?:холодильник.*|fridges?|refrigerators?)$/u],
  ["oven", /^(?:духов(?:к|ц).*|ovens?)$/u],
  ["water", /^(?:вод[аиуіою]|канал.*|water|canal)$/u],
  ["view", /^(?:вид|видом|краєвид.*|краєвид|views?|overlooking)$/u],
  ["frame", /^(?:рам[кц].*|рамі|framed|frames?)$/u],
  ["velvet", /^(?:оксамит.*|велюр.*|velvet)$/u]
];
const neutralWords=new Set(("я ми мені нам мене оренда оренди район районі райончику хотілось хочеться можна знайти оселю треба потрібен потрібна потрібне потрібні потрібний потрібно хочу щось шось покажи показати підбери знайди давай максимально десь таке якомусь якомога от там реально просто прям прямо дуже хочеться хотіла хотів б би щоб щоби аби була був було були буде бути є мав мала мали має мають шукаю шукаємо квартиру квартира квартирі житло помешкання орендувати бажано подобається подобаються люблю вітаю привіт будь ласка ще також тільки тож і й та а з зі із на над у в до за під для біля поруч коло від при там де що який яка яке які цей ця це ці " +
  "i i'd i’d id would like want need looking for am we my me a an the it its with at on of in to by and or please that has have is be prefer flat apartment rental also really just something somewhere very some any i'm we're rent renting love somewhere ideally hoping find show give nice should can could get beside near above next there so " +
  "без не жодних жодного жодної жоден ніяких уникаю without no not avoid hate don't rather than").split(/\s+/u));
function words(value){
  return value.toLowerCase().normalize("NFKC").replace(/[’‘ʼ]/gu,"'").match(/[\p{L}\d]+(?:'[\p{L}]+)*/gu)||[];
}
function term(word){
  for(const [key,,pattern] of colours) if(pattern.test(word)) return key;
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
const indexedTerms=new Set(evidenceIndex.flatMap(entry=>[...entry.tokens]));
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
  let anyRent=false;
  const visualRequest=normalized.replace(priceAside,()=>{
    anyRent=true;
    return ",";
  }).replace(asideWords," ").replace(/\s+/gu," ").trim();
  const {budget,remainder}=extractBudget(visualRequest);
  const selected=new Map(), ignored=new Set(), suggestions=new Map();
  // The separators are kept so shared negation can apply to a coordinated list.
  const chunks=remainder.replace(/\brather than\b/gu,",not ").replace(/\sа не\s/gu,",не ")
    .split(/([,.;!?+&\n]+|\s+(?:але|проте|однак|головне|а ще|but|however|though|та|і|й|або|ні|and|or)\s+)/iu);
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
    const requested=clause;
    let abundance=false;
    clause=clause.replace(manyWords,()=>{abundance=true;return " "}).trim();
    if(abundance) clause=clause.replace(/\s+as possible$/u,"");
    // "Pink tones" and "a lot of pink in the interior" describe the colour itself.
    const withoutDecor=clause.replace(colourDecor," ");
    const content=terms(withoutDecor);
    const shade=content.length===1 && colours.find(([key])=>key===content[0]);
    if(shade) clause=withoutDecor;
    const found=baseMatches(clause);
    let residual=clause;
    for(const hit of [...found].reverse()){
      residual=residual.slice(0,hit.start)+" ".repeat(hit.end-hit.start)+residual.slice(hit.end);
    }
    for(const {key} of found) residual=residual.replace(contextual[key]," ");
    if(!abundance && found.length && (!terms(residual).length || indifferentHere)){
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

    let label=clause.replace(/^(?:(?:хочу|аби|щоб|щоби|покажи|підбери|щось|шось|квартиру|прошу|мені|не|потрібен|потрібна|потрібні|був|була|було|були|без|з|із|і|ще|шукаю|i'd|i'm|i|looking|for|would|like|want|need|with|without|no|a|an|the)\s+)+/u,"").trim()||clause;
    let matches=detailMatch(tokens,label);
    let approximate=false;
    if(!matches.length && dir>0 && !indifferentHere){
      matches=relatedObjects(tokens);
      approximate=matches.length>0;
    }
    if(shade && !abundance) label=/[а-яіїєґ]/u.test(requested) ? "відтінки "+shade[1] : shade[0];
    if(abundance) label=shade ? (/[а-яіїєґ]/u.test(requested) ? "багато "+shade[1] : "lots of "+shade[0]) : requested;
    if(matches.length){
      choose("detail:"+[...tokens].sort().join("/"),{type:"detail",dir,label,matches,approximate,abundance},indifferentHere);
    }else if(!indifferentHere){
      ignored.add(requested);
      if(dir>0){
        for(const word of words(clause)){
          const key=term(word);
          if(!neutralWords.has(word) && indexedTerms.has(key)) suggestions.set(key,word);
        }
      }
    }
  }
  return {criteria:[...selected.values()],budget,anyRent:anyRent && !budget,ignored:[...ignored],suggestions:[...suggestions.values()].slice(0,3)};
}
function evidenceFor(flat,criterion){
  if(criterion.type==="trait"){
    const [value,photo,label]=flat.facts[criterion.key];
    return {value:value*criterion.dir,photo,label};
  }
  if(criterion.type==="place"){
    return {value:(criterion.id===flat.id ? 1 : -1)*criterion.dir,photo:null,label:flat.name};
  }
  const observations=criterion.matches.filter(entry=>entry.id===flat.id);
  const match=observations[0];
  if(match){
    if(criterion.abundance || criterion.approximate){
      // Seeing an item proves presence. Its presence alone does not establish quantity.
      if(criterion.dir<0) return {value:0,photo:null,label:en("Кількість за фото не визначити","The photos do not establish the amount")};
      return {value:0.5,photo:match.photo,label:match.label,
        support:criterion.approximate ? match.covered : new Set(observations.map(entry=>entry.photo)).size};
    }
    return {value:criterion.dir,photo:match.photo,label:match.label};
  }
  return {value:0,photo:null,label:en("Фото не підтверджують «"+criterion.label+"»","Photos do not confirm “"+criterion.label+"”")};
}
