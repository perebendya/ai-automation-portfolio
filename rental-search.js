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
function relatedObjects(tokens,scopes){
  const anchors=tokens.filter(token=>objectsForSuggestions.has(token));
  if(!anchors.length) return [];
  const bestByFlat=new Map();
  for(const entry of evidenceIndex){
    if(!scopes.every(scope=>entry.scopes.includes(scope))) continue;
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

// Prices, ordering and visual evidence have different semantics. Consume price expressions
// first so their words never become a requested object or a point in the photo score.
const UAH_AMOUNT=String.raw`(?:₴\s*|uah\s+)?\d+(?:[ ,.]\d{3})*(?:[.,]\d{1,2})?(?:\s*(?:тис(?:яч[уаі]?)?\.?|thousand|[кk]))?(?:\s*(?:грн\.?|гривень|гривні|hryvnias?|uah|₴))?`;
const foreignOrOtherUnit=/^\s*(?:[$€£]|usd|eur|gbp|долар|євро|bucks?|dollars?|euros?|хвилин|метр|кілометр|поверх|кімнат|minutes?|metres?|floors?|rooms?)/iu;
const moneyExpression=source=>new RegExp("(?<![\\p{L}\\d$€£])(?:"+source+")(?![\\p{L}\\d])","giu");
const rentRange=moneyExpression(
  String.raw`(?:(?:бюджет(?:ом)?|оренда|budget)\s+)?(?:від\s+|from\s+|between\s+)?(?<low>${UAH_AMOUNT})\s*(?:[–—-]|до|to|and(?=[\s₴\d]))\s*(?<high>${UAH_AMOUNT})`
);
const upper=String.raw`не дорожче(?:\s+(?:за|ніж))?|не більше(?:\s+(?:за|ніж))?|не вище|[ув]кластися\s+[ву]|дешевше(?:\s+(?:за|ніж))?|менше(?:\s+(?:ніж|за))?|максимум|до|under|less than|cheaper than|no more than|up to|at most|max(?:imum)?|budget(?: of)?|бюджет`;
const lower=String.raw`від|мінімум|не менше(?: ніж| за)?|дорожче\s+(?:за|ніж)|понад|at least|from|over|more than|above`;
const rentBound=moneyExpression(String.raw`(?:(?:мій бюджет|бюджет|ціна|оренда|my budget is|budget)\s+)?(?<op>${upper}|${lower})\s*[:=]?\s*(?<raw>${UAH_AMOUNT})(?:\s*(?:\/\s*(?:міс(?:яць)?|month)|на місяць|per month|a month))?`);
const rentCeiling=moneyExpression(String.raw`(?<raw>${UAH_AMOUNT})\s*(?:[-–—]\s*)?(?:(?:це|мій|моя|my|is)\s+)*(?:стеля|ліміт|максимум|limit|ceiling)`);
const rentOrdering=[
  ["asc", /від\s+(?:най)?дешев[а-яіїєґ]*\s+до\s+(?:най)?дорож[а-яіїєґ]*|(?:price|rent)?\s*low to high/gu],
  ["desc", /від\s+(?:най)?дорож[а-яіїєґ]*\s+до\s+(?:най)?дешев[а-яіїєґ]*|(?:price|rent)?\s*high to low/gu],
  ["asc", /(?:якнай|най|якомога\s+)?дешев(?:ше|ш[а-яіїєґ]*|[а-яіїєґ]*)|подешевше|недорог[а-яіїєґ]*|бюджетн(?:а|ий|у|е|і)|за зростанням ціни|(?:ціна|ціною) (?:за зростанням|по зростанню)|від нижчої ціни|(?:найменш[ау]|найнижч[ау]|мінімальн[ау]) (?:ціна|ціну|оренда|оренду)|(?:as )?cheap as possible|(?:the )?(?:cheapest|least expensive|most affordable|lowest (?:price|rent))|(?:cheap|affordable|budget-friendly)(?=\s+(?:flat|rent|apartment)\b|\s*$)/gu],
  ["desc", /(?:якнай|най)дорожч[а-яіїєґ]*|(?:спочатку|спершу)\s+дорожч[а-яіїєґ]*|за спаданням ціни|(?:ціна|ціною) (?:за спаданням|по спаданню)|(?:найвищ[ау]|максимальн[ау]) (?:ціна|ціну|оренда|оренду)|(?:the )?(?:most expensive|highest (?:price|rent)|priciest)/gu]
];
function readAmount(raw){
  const scaled=/(?:тис|thousand|[кk])/iu.test(raw);
  const marked=scaled || /₴|uah|грн|грив|hryvnia/iu.test(raw);
  const digits=raw.match(/\d[\d., ]*/u)[0].trim().replace(/\s/g,"").replace(/[.,](?=\d{3}(?:\D|$))/g,"").replace(",",".");
  return {value:Number(digits)*(scaled?1000:1),marked,scaled};
}
// Normalize written thousands only inside a money expression.
const moneyNumbers=[
  [1,"одна одну однієї one"],[2,"дві двох two"],[3,"три трьох three"],[4,"чотири чотирьох four"],
  [5,"п'ять п'яти five"],[6,"шість шести six"],[7,"сім семи seven"],[8,"вісім восьми eight"],[9,"дев'ять дев'яти nine"],
  [10,"десять десяти ten"],[11,"одинадцять одинадцяти eleven"],[12,"дванадцять дванадцяти twelve"],
  [13,"тринадцять тринадцяти thirteen"],[14,"чотирнадцять чотирнадцяти fourteen"],[15,"п'ятнадцять п'ятнадцяти fifteen"],
  [16,"шістнадцять шістнадцяти sixteen"],[17,"сімнадцять сімнадцяти seventeen"],[18,"вісімнадцять вісімнадцяти eighteen"],
  [19,"дев'ятнадцять дев'ятнадцяти nineteen"],[20,"двадцять двадцяти twenty"],[30,"тридцять тридцяти thirty"],
  [40,"сорок сорока forty"],[50,"п'ятдесят п'ятдесяти fifty"],[60,"шістдесят шістдесяти sixty"],
  [70,"сімдесят сімдесяти seventy"],[80,"вісімдесят вісімдесяти eighty"],[90,"дев'яносто дев'яноста ninety"],[100,"сто ста hundred"]
];
const writtenNumbers=new Map(moneyNumbers.flatMap(([n,forms])=>forms.split(" ").map(word=>[word,n])));
const numberForms=[...writtenNumbers.keys()].sort((a,b)=>b.length-a.length).join("|");
const counterWord="(?:тис|thousand)";
const writtenOperand="(?:"+numberForms+")";
const writtenMoney=new RegExp("(?<![\\p{L}])("+writtenOperand+")(?:(?: |-)("+writtenOperand+"))?"+
  "(?=\\s*(?:"+counterWord+"|(?:до|to|and)\\s+(?:[\\d]+|"+writtenOperand+"(?: "+writtenOperand+")?)\\s*"+counterWord+"))","gu");
function normalizeMoneyWords(query){
  return query.replace(writtenMoney,(full,first,second)=>{
    const value=writtenNumbers.get(first);
    if(!second) return String(value);
    const units=writtenNumbers.get(second);
    return value>=20 && value%10===0 && units<10 ? String(value+units) : full;
  });
}
function parsePrice(query){
  let budget=null,sort="match",anyRent=false;
  function setBound(side,amount,exclusive=false){
    budget??={minRent:0,maxRent:Infinity,lower:null,upper:null};
    const bound={amount,exclusive};
    if(side==="lower"){
      const value=amount+Number(exclusive);
      if(!budget.lower || value>budget.minRent){budget.lower=bound;budget.minRent=value}
    }else{
      const value=amount-Number(exclusive);
      if(value<budget.maxRent){budget.upper=bound;budget.maxRent=value}
    }
  }
  function inHryvnias(full,offset,input,amounts){
    if(foreignOrOtherUnit.test(input.slice(offset+full.length)) || /(?:[$€£]|usd|eur|gbp)\s*$/iu.test(input.slice(0,offset))) return false;
    return amounts.every(a=>Number.isSafeInteger(a.value)) && amounts.some(a=>a.marked || a.value>=1000);
  }
  let remainder=normalizeMoneyWords(query).replace(priceAside,()=>{anyRent=true;return ","});
  remainder=remainder.replace(rentRange,(full,left,right,offset,input)=>{
    const a=readAmount(left),b=readAmount(right);
    if(!inHryvnias(full,offset,input,[a,b])) return full;
    if(!a.marked && a.value<1000 && b.scaled) a.value*=1000;
    if(!b.marked && b.value<1000 && a.scaled) b.value*=1000;
    setBound("lower",a.value);setBound("upper",b.value);
    return " ";
  });
  remainder=remainder.replace(rentCeiling,(full,raw,offset,input)=>{
    const amount=readAmount(raw);
    if(!inHryvnias(full,offset,input,[amount])) return full;
    setBound("upper",amount.value);
    return " ";
  });
  remainder=remainder.replace(rentBound,(full,op,raw,offset,input)=>{
    const a=readAmount(raw);
    if(!inHryvnias(full,offset,input,[a])) return full;
    const floor=/^(?:від|мінімум|не менше|дорожче|понад|at least|from|over|more than|above)/u.test(op);
    const strict=/^(?:дешевше|менше|дорожче|понад|under|less than|cheaper than|over|more than|above)/u.test(op);
    setBound(floor?"lower":"upper",a.value,strict);
    return " ";
  });
  for(const [direction,pattern] of rentOrdering){
    remainder=remainder.replace(pattern,(match,offset,input)=>{
      const before=input.slice(0,offset),after=input.slice(offset+match.length);
      if(/[\p{L}\d]$/u.test(before) || /^[\p{L}\d]/u.test(after) || /(?:^|\s)(?:не|not)\s*$/u.test(before)) return match;
      if(/^\s*(?:за|ніж|than)?\s*[$€£\d]/u.test(after)) return match;
      if(/^\s+(?:диван|ремонт|стіл|мебл|килим|ліжк|sofa|couch|bed|rug|desk|furniture)/u.test(after)) return match;
      sort=direction;return " ";
    });
  }
  if(sort!=="match") remainder=remainder.replace(/(?<![\p{L}])(?:спочатку|спершу|варіант(?:и)?|краще|[іи]з таких|з таких|first|options?|one(?=\s+with|\s*$))(?![\p{L}])/gu," ");
  return {budget,sort,anyRent:anyRent && !budget,remainder};
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
  ["table", /^(?:стіл|стола|столу|столи|столів|столом|столами|tables?)$/u],
  ["coffee-table", /^(?:столик.*|столичок)$/u],
  ["chair", /^(?:стільц.*|стільчик.*|стілець|chairs?)$/u],
  ["bed", /^(?:ліж[кеч].*|beds?)$/u],
  ["wood", /^(?:дерев'ян.*|wooden|wood)$/u],
  ["plant", /^(?:вазон.*|рослин.*|plants?|houseplants?)$/u],
  ["flower", /^(?:квіт(?:и|ів|ами|ка|ки|ок|кою)|flowers?)$/u],
  ["window", /^(?:вікн.*|вікон|windows?)$/u],
  ["shower", /^(?:душ|душем|душ[оі].*|showers?)$/u],
  ["bath", /^(?:ванн[а-яії]*|bathtubs?|tubs?)$/u],
  ["kitchen", /^(?:кух[а-яіїєґ]+|фасад.*|шафк.*|kitchens?|cabinets?)$/u],
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
  ["parquet", /^(?:паркет.*|parquet)$/u],
  ["tray", /^(?:піддон.*|tray)$/u],
  ["low", /^(?:низьк.*|low)$/u],
  ["rectangular", /^(?:прямокутн.*|rectangular)$/u],
  ["folding", /^(?:складн.*|розкладн.*|folding)$/u],
  ["open", /^(?:відкрит.*|open)$/u],
  ["courtyard", /^(?:двір|двор[іуаом]+|courtyards?)$/u],
  ["city", /^(?:місто|міста|містом|city)$/u],
  ["tree", /^(?:дерева|деревами|дерев|trees?)$/u],
  ["worktop", /^(?:стільниц.*|worktop)$/u],
  ["wardrobe", /^(?:шаф[ауіою]|wardrobes?)$/u],
  ["drawer", /^(?:шухляд.*|ящик.*|drawers?)$/u],
  ["shoes", /^(?:взутт.*|shoes?)$/u],
  ["hook", /^(?:гач(?:ок|к.*)|hooks?)$/u],
  ["velvet", /^(?:оксамит.*|велюр.*|velvet)$/u]
];
const neutralWords=new Set(("теж саме влаштує висів також мені б оселилась оселитися оселитись жити коли про мрію хочу мати стоїть стоять висить висіли ростуть є була був вийти засинати спати ввечері увечері форми " +"я ми мені нам мене оренда оренду оренди район районі райончику хотілось хочеться можна знайти оселю треба можу дати потягну потрібен потрібна потрібне потрібні потрібний потрібно хочу тільки лише щось шось покажи показати підбери знайди давай максимально десь таке якомусь якомога от там реально просто прям прямо дуже хочеться хотіла хотів б би щоб щоби аби була був було були буде бути є мав мала мали має мають шукаю шукаємо зняти винайняти варіант варіанти варіантів однушку однокімнатну однокімнатна квартиру квартира квартирі квартири житло помешкання орендувати бажано подобається подобаються люблю вітаю привіт будь ласка ще також тільки тож і й та а з зі із на над у в до за під для біля поруч коло від при там де що який яка яке які цей ця це ці " +
  "i i'd i’d id would like want need looking for am we my me a an the it its with at on of in to by and or please that has have is be prefer options listings flat flats apartment apartments rental also really just something somewhere very some any i'm we're rent renting love somewhere ideally hoping find show give nice should can could get beside near above next there so " +
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
// Location comes from the gallery image, even when the caption only names the object.
const photoScopes=[
  ["kitchen", /(?:на|у|в) кухні|in the kitchen/gu, /кухня/u],
  ["bathroom", /(?:у|в) ванній(?: кімнаті)?|in the bathroom/gu, /санвузол|ванна|душова/u],
  ["hall", /(?:у|в) (?:передпокої|коридорі)|біля входу|in the hall(?:way)?/gu, /передпокій/u],
  ["bedroom", /(?:у|в) спальні|in the bedroom/gu, /спальня/u],
  ["room", /(?:у|в) кімнаті/gu, /спальня|вітальня/u],
  ["living", /(?:у|в) вітальні|in the living room/gu, /вітальня/u],
  ["balcony", /(?:на балконі|на лоджії)|on the balcony/gu, /балкон|лоджія|лоджії/u]
];
function photoScope(clause){
  let text=clause;
  const scopes=[];
  for(const [name,pattern] of photoScopes){
    text=text.replace(pattern,()=>{scopes.push(name);return " "});
  }
  // A wish like "coffee on the balcony" can consist of the location alone.
  return {text,scopes};
}
const evidenceIndex=[];
for(const flat of flats){
  photoDetails[flat.id].forEach((objects,photo)=>{
    const room=flat.photos[photo][0].toLowerCase();
    const scopes=photoScopes.filter(([, ,pattern])=>pattern.test(room)).map(([key])=>key);
    for(const label of objects){
      const groups=label.flatMap(line=>line.toLowerCase().split(/\s+(?:над|під|на|біля|у|в|із|зі|з|та|with|and|above|on|by|beside|overlooking|in)\s+/u));
      evidenceIndex.push({id:flat.id,photo,label,scopes,tokens:new Set(label.flatMap(terms)),
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
// Offer a correction from the catalogue only when one spelling concept fits.
const spellingWords=new Map();
for(const entry of [...evidenceIndex.map(e=>e.label),...flats.map(f=>f.name),...traits,...opposites]){
  for(const label of entry) for(const word of words(label)){
    const key=term(word);
    if(word.length>=5 && (vocabulary.some(([k])=>k===key) || colours.some(([k])=>k===key) ||
      Object.values(placeForms).some(pattern=>pattern.test(word)))) spellingWords.set(word,key);
  }
}
function oneEditApart(word,candidate){
  if(Math.abs(word.length-candidate.length)>1) return false;
  let i=0;
  while(i<word.length && word[i]===candidate[i]) i++;
  if(word.length<candidate.length) return word.slice(i)===candidate.slice(i+1);
  if(word.length>candidate.length) return word.slice(i+1)===candidate.slice(i);
  return word.slice(i+1)===candidate.slice(i+1) ||
    (word[i]===candidate[i+1] && word[i+1]===candidate[i] && word.slice(i+2)===candidate.slice(i+2));
}
function spellingSuggestion(raw){
  for(const hit of raw.matchAll(/[\p{L}]+(?:['’ʼ][\p{L}]+)*/gu)){
    const word=words(hit[0])[0];
    if(word.length<5 || spellingWords.has(word) || neutralWords.has(word) || indexedTerms.has(term(word))) continue;
    const near=[...spellingWords].filter(([candidate])=>oneEditApart(word,candidate));
    if(near.length && new Set(near.map(([,key])=>key)).size===1){
      return raw.slice(0,hit.index)+near[0][0]+raw.slice(hit.index+hit[0].length);
    }
  }
  return null;
}
function verticalRelation(text){
  const hit=/(?:^|\s)(над|під|above|below|under)\s+(.+)/u.exec(text.toLowerCase());
  if(!hit) return null;
  const isObject=t=>objectsForSuggestions.has(t) || t==="wardrobe";
  const [anchor,following]=terms(hit[2]).filter(isObject);
  const subject=terms(text.slice(0,hit.index)).filter(isObject).pop() || following;
  return anchor ? {anchor,subject,above:hit[1]==="над" || hit[1]==="above"} : null;
}
function detailMatch(tokens,clause,scopes){
  // With an explicit relationship ("art above a sofa"), search the full observation.
  // Otherwise keep modifiers on their object ("red rug above a sofa" is not a red sofa).
  const relation=/(?:^|\s)(?:де|where|над|під|на|біля|поруч|із|зі|з|у|в|with|above|on|by|beside|overlooking|in)\s/u.test(clause);
  const vertical=verticalRelation(clause);
  return evidenceIndex.filter(entry=>{
    if(vertical && !entry.label.some(label=>{
      const observed=verticalRelation(label);
      if(!observed) return false;
      if(observed.above===vertical.above) return observed.anchor===vertical.anchor;
      return observed.subject===vertical.anchor && observed.anchor===vertical.subject;
    })) return false;
    if(!scopes.every(scope=>entry.scopes.includes(scope))) return false;
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
  /стіни(?=\s+без)|на\s+стінах|на\s+стіні|настінн[а-яіїєґ]*|(?:on\s+the\s+)?walls?/gu,
  /кух[а-яіїєґ]*|колір|кольор[а-яіїєґ]*|фасад[а-яіїєґ]*|kitchens?|colou?rs?|cabinets?/gu,
  /для сну|спати|sleep(?:ing)?(?:\s+(?:in|on))?|real|окрем[а-яіїєґ]*/gu,
  /для роботи|писати|працювати|work\s+at|writing/gu,
  /(?:пити|випити) каву|каву|coffee|для (?:моїх )?рослин|for (?:my )?plants/gu,
  /(?:приймати|прийняти|митися|купатися|купатись|увечері|для купання)|кабін[а-яіїєґ]*|for a long soak|stall|enclosure/gu
];
// Convert activities and colloquial descriptions to observable concepts.
function conversationalTerms(text){
  return text
    .replace(/стіл (?:для роботи|для ноутбука)/gu,"письмовий стіл")
    .replace(/відкрит[ае] (?:місце|простір) на (балконі|лоджії)/gu,"відкритий балкон")
    .replace(/(?:варити|зварити) (?:каву|чай|їжу) на (?=(?:газовій|електричній|індукційній) плиті)/gu,"")
    .replace(/(?:винести|перенести|поставити|взяти) (?:ноут(?:бук)?|комп'ютер) на (балкон|лоджію)(?=\s+(?:де|щоб)\s+працювати там)/gu,
      (_,place)=>place==="балкон" ? "на балконі" : "на лоджії")
    .replace(/працювати\s+(?:(?:там|хочу|хочеться)\s+)*за\s+столом/gu,"письмовий стіл")
    .replace(/(?:полежати|лежати|відмокати|поніжитись|поніжитися|розслабитися)\s+[ув]\s+ванні/gu,"ванна")
    .replace(/(?:готувати|готую|готуватиму)\s+на\s+газ[уі]|газ\s+для\s+готування|на кухні (?:був |є )?газ(?![\p{L}])/gu,"газова плита")
    .replace(/(?<![\p{L}])(?:[ву]\s+)?душ(?:і|ем)?\s+(?:без піддон[ау]|(?:на рівні|врівень з) підлог[оию]+)/gu,"душ на рівні підлоги")
    .replace(/без засклення/gu,"відкритий")
    .replace(/(?:міститись|було куди|є куди|куди|місце (?:для|під))\s+(?:поставити |скласти )?взуття/gu,"полиця для взуття")
    .replace(/під ноги/gu,"на підлозі")
    .replace(/шоколадн[а-яіїєґ]* (?:кольору|відтінку)/gu,"коричневий")
    .replace(/(?:бачити|дивитися|дивитись|виглядати|було видно|видно було|виходить|виходив)\s+(?=(?:(?:з балкон[ау]|з вікна|на|у|в)\s+)*(?:вод[ау]|місто|дерева|двір|парк|озеро|річку|ліс)(?![\p{L}]))/gu,"вид ")
    .replace(/нормальне ліжко/gu,"ліжко")
    .replace(/(?:маю слабкість до|мрію про|(?:за )?квартиру дам|для сну|митися)/gu," ")
    .replace(/за вікном(?=\s+(?:хочу\s+)?вид)/gu," ");
}
function parseRequest(raw){
  const normalized=raw.normalize("NFKC").toLowerCase().replace(/[’‘ʼ]/gu,"'")
    .replace(/не хочу,?\s*щоб/gu,"не хочу щоб")
    .replace(/,\s*(де|що)(?=\s+(?:стоїть|стоять|ростуть|висить|виходить|видно))/gu," $1")
    .replace(/(на (?:лоджію|балкон))\s+(?:й|і|та)\s+(?=працювати там)/gu,"$1 щоб ");
  const {budget,sort,anyRent,remainder}=parsePrice(normalized.replace(asideWords," ").replace(/\s+/gu," ").trim());
  const selected=new Map(), ignored=new Set(), suggestions=new Map();
  // The separators are kept so shared negation can apply to a coordinated list.
  const chunks=remainder.replace(/\b(?:rather than|instead of)\b/gu,",not ").replace(/(?:^|\s)замість\s+/gu,",без ").replace(/\sа не\s/gu,",не ")
    .split(/([,.;!?+&\n]+|\s+(?:але|проте|однак|головне|а ще|but|however|though|та|і|й|або|ні|чи|and|or)\s+)/iu);
  let previousNegative=false, previousObject="";
  const segments=[];
  let segment;
  function record(key,criterion){
    selected.set(key,criterion);
    segment.keys.add(key);
  }
  function choose(key,criterion,indifferentHere){
    if(indifferentHere) selected.delete(key);
    else record(key,criterion);
  }
  for(let n=0;n<chunks.length;n+=2){
    segment={join:(chunks[n-1]||"").trim(),keys:new Set(),positive:false};
    segments.push(segment);
    const source=chunks[n].trim();
    let clause=conversationalTerms(source).trim();
    if(!clause){previousNegative=false;continue}
    if(previousObject) clause=clause.replace(/(над|під|біля|поруч із) (?:ним|нею|нього|неї)(?![\p{L}])/gu,"$1 "+previousObject);
    previousObject=clause.match(/(?:диван|канап|ліжк|стол|шаф)[а-яіїєґ]*/u)?.[0] || "";
    const conjunction=(chunks[n-1]||"").trim();
    const carry=previousNegative && /^(?:і|й|та|або|ні|and|or)$/u.test(conjunction)
      && !/^(?:я |хочу|потріб|мені |з |із |є |i |a |an |with |would |need )/u.test(clause);
    const indifferentHere=indifferent.test(clause);
    const negative=carry || /(?:^|\s)(?:без|жодн[а-яіїєґ]*|не|уникаю|without|no|not|avoid|hate|don't|is a dealbreaker|are a dealbreaker)(?:\s|$)/u.test(clause);
    previousNegative=negative && !indifferentHere;
    segment.positive=!negative && !indifferentHere;
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
    const scope=photoScope(clause);
    const scoped=scope.scopes.length>0 && terms(scope.text).length>0;
    const found=baseMatches(clause);
    // Objects connected by a preposition must occur together in one observation.
    const linked=found.length>1 && /(?:^|\s)(?:над|під|біля|на|поруч із|above|below|beside|on)\s/u.test(clause);
    const plainTrait=!linked && (!scoped ||
      found.every(hit=>hit.key===1 && scope.scopes.includes("kitchen")) ||
      found.every(hit=>hit.key===4 && scope.scopes.includes("balcony")));
    let residual=clause;
    for(const hit of [...found].reverse()){
      residual=residual.slice(0,hit.start)+" ".repeat(hit.end-hit.start)+residual.slice(hit.end);
    }
    for(const {key} of found) residual=residual.replace(contextual[key]," ");
    if(plainTrait && !abundance && found.length && (!terms(residual).length || indifferentHere)){
      for(const {key,dir:baseDir} of found){
        const direction=baseDir*dir;
        if(indifferentHere){
          selected.delete("trait:"+key+":1");
          selected.delete("trait:"+key+":-1");
        }else{
          record("trait:"+key+":"+direction,{type:"trait",key,dir:direction});
        }
      }
      continue;
    }
    const detailText=(scoped ? scope.text : clause).replace(indifferent," ");
    const tokens=terms(detailText);
    if(!tokens.length) continue;

    let label=source.replace(/^(?:(?:а|б|хочу|аби|щоб|щоби|покажи|підбери|щось|шось|квартиру|прошу|мені|не|потрібен|потрібна|потрібні|був|була|було|були|без|з|із|і|ще|шукаю|i'd|i'm|i|looking|for|would|like|want|need|with|without|no|a|an|the)\s+)+/u,"").trim()||clause;
    const requiredScopes=scoped ? scope.scopes : [];
    let matches=detailMatch(tokens,detailText,requiredScopes);
    let approximate=false;
    if(!matches.length && dir>0 && !indifferentHere){
      matches=relatedObjects(tokens,requiredScopes);
      approximate=matches.length>0;
    }
    if(shade && !abundance) label=/[а-яіїєґ]/u.test(requested) ? "відтінки "+shade[1] : shade[0];
    if(abundance) label=shade ? (/[а-яіїєґ]/u.test(requested) ? "багато "+shade[1] : "lots of "+shade[0]) : requested;
    if(matches.length){
      choose("detail:"+[...tokens,...requiredScopes.map(room=>"@"+room)].sort().join("/"),{type:"detail",dir,label,matches,approximate,abundance},indifferentHere);
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
  // Join only adjacent positive alternatives. "Without a bed or a desk" keeps two exclusions.
  let previousKey=null;
  for(const {join,keys,positive} of segments){
    const key=positive && keys.size===1 ? [...keys][0] : null;
    if(key && previousKey && key!==previousKey && /^(або|чи|or)$/u.test(join) && selected.has(key) && selected.has(previousKey)){
      const left=selected.get(previousKey);
      selected.set(previousKey,{type:"any",options:[...(left.options||[left]),selected.get(key)]});
      selected.delete(key);
    }else previousKey=key;
  }
  return {criteria:[...selected.values()],budget,sort,anyRent,ignored:[...ignored],suggestions:[...suggestions.values()].slice(0,3)};
}
function evidenceFor(flat,criterion){
  if(criterion.type==="any"){
    const alternatives=criterion.options.map(option=>evidenceFor(flat,option));
    return alternatives.reduce((best,item)=>item.value>best.value ? item : best);
  }
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

function rankRentals(plan){
  const {criteria,budget,sort}=plan;
  if(!criteria.length && !budget && sort==="match" && plan.ignored.length) return [];
  const rows=flats.filter(flat=>!budget || (flat.rent>=budget.minRent && flat.rent<=budget.maxRent)).map(flat=>{
    const evidence=criteria.map(c=>evidenceFor(flat,c));
    const inBudget=Number(Boolean(budget));
    return {flat,evidence,points:evidence.reduce((sum,f)=>sum+f.value,inBudget),
      matches:evidence.filter(f=>f.value===1).length+inBudget,
      support:evidence.reduce((sum,f)=>sum+(f.support||0),0)};
  });
  return rows.sort((a,b)=>{
    const relevance=b.points-a.points || b.matches-a.matches;
    if(relevance) return relevance;
    const rent=a.flat.rent-b.flat.rent;
    if(sort==="asc" || sort==="desc") return sort==="asc" ? rent : -rent;
    return b.support-a.support || rent;
  });
}
