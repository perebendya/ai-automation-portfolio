// For each feature in traits, store its observed direction, photo index and caption.
const en = (uk, english) => [uk, english];
const traits = [
 en("Без килимів на стінах","No rugs on the walls"),
 en("Кухня у спокійних кольорах","A kitchen in muted colours"),
 en("Ліжко з матрацом","A bed with a mattress"),
 en("Стіл для роботи","A desk I can work at"),
 en("Балкон","A balcony"),
 en("Ванна для купання","A bathtub")
];
const flats = [
 {id:"a", name:en("Нивки","Nyvky"), rent:18000,
  photos:[en("Кухня","Kitchen"),en("Спальня","Bedroom"),en("Санвузол","Bathroom"),en("Засклений балкон","Enclosed balcony")],
  facts:[
 [-1,1,en("Бордовий килим над ліжком","Burgundy rug above the bed")],
 [1,0,en("Кремові фасади й дерев’яна стільниця","Cream cabinet fronts and a wood-tone worktop")],
 [1,1,en("Видно ліжко з окремим матрацом","A bed frame and mattress are visible")],
 [0,1,en("Робочого столу в кадрі не видно","The photos do not show a work desk")],
 [1,3,en("На балконі є засклення","The flat has an enclosed balcony")],
 [1,2,en("На фото санвузла видно ванну","A bathtub is visible in the bathroom")]]},
 {id:"b", name:en("Лук’янівка","Lukianivka"), rent:16500,
  photos:[en("Кухня","Kitchen"),en("Вітальня","Living room"),en("Душова","Shower room"),en("Відкритий балкон","Open balcony")],
  facts:[
 [1,1,en("Видимі стіни в кімнаті й кухні без килимів","No wall rugs are visible in the living room or kitchen")],
 [-1,0,en("Лаймові фасади й яскраво-рожева плитка","Lime cabinets and a hot-pink backsplash")],
 [-1,1,en("На фото кімнати видно лише диван","The room photo shows only a sofa")],
 [1,1,en("Біля вікна є письмовий стіл зі стільцем","A desk and chair are visible by the window")],
 [1,3,en("Є відкритий балкон з огорожею","An open balcony with railings is visible")],
 [-1,2,en("У санвузлі видно душову кабіну","The bathroom photo shows a shower stall")]]},
 {id:"c", name:en("Поділ","Podil"), rent:21000,
  photos:[en("Кухня","Kitchen"),en("Санвузол","Bathroom"),en("Передпокій","Entrance hall"),en("Письмовий стіл","Desk")],
  facts:[
 [0,0,en("Стіни житлової кімнати поза кадром","The living room walls are outside the frame")],
 [1,0,en("Приглушені блакитні фасади кухні","The cabinet fronts are a muted blue")],
 [0,1,en("Спальне місце в кадр не потрапило","The photos do not show the sleeping area")],
 [1,3,en("Є письмовий стіл зі стільцем","A writing desk and chair are visible")],
 [0,2,en("Балкон у цій серії фото не показали","The photos do not show a balcony")],
 [1,1,en("Під скляною перегородкою видно борт ванни","The rim of a bathtub is visible under the glass screen")]]},
{id:"d", name:en("Оболонь","Obolon"), rent:19500,
  photos:[en("Кухня","Kitchen"),en("Вітальня","Living room"),en("Ванна","Bathtub"),en("Відкритий балкон","Open balcony")],
  facts:[
  [1,1,en("Світла стіна за диваном без килима","The pale wall behind the sofa is bare")],
  [1,0,en("Кухонні шафки приглушеного сіро-зеленого кольору","The kitchen cabinets are a muted grey-green")],
  [-1,1,en("У кімнаті видно диван, окремого ліжка в кадрі немає","The room shows a sofa with no separate bed in view")],
  [1,1,en("Біля вікна стоїть письмовий стіл зі стільцем","There is a writing desk and chair beside the window")],
  [1,3,en("На відкритому балконі стоять складні стільці","Folding chairs sit on the open balcony")],
  [1,2,en("Біля стіни з блакитною плиткою видно ванну","A bathtub sits against the blue-tiled wall")]]},
 {id:"e", name:en("Солом’янка","Solomianka"), rent:14700,
  photos:[en("Кухня","Kitchen"),en("Спальня","Bedroom"),en("Душова","Shower room"),en("Передпокій","Entrance hall")],
  facts:[
  [1,1,en("Над дерев’яним ліжком однотонна стіна без килима","The plain wall above the wooden bed has no rug")],
  [-1,0,en("На кухні глянцеві вишнево-червоні фасади","The kitchen has glossy cherry-red cabinets")],
  [1,1,en("На дерев’яному каркасі видно окремий матрац","A separate mattress is visible on the wooden bed frame")],
  [1,1,en("Поряд із ліжком є стіл зі стільцем і лампою","A desk with a chair and lamp stands beside the bed")],
  [0,3,en("Балкон на фото не показали","The photos do not show a balcony")],
  [-1,2,en("Скляна душова кабіна з низьким піддоном","A glass shower has a low tray")]]},
 {id:"f", name:en("Русанівка","Rusanivka"), rent:22500,
  photos:[en("Кухня","Kitchen"),en("Спальня","Bedroom"),en("Ванна","Bathtub"),en("Лоджія","Loggia")],
  facts:[
  [-1,1,en("Над узголів’ям висить червоний візерунчастий килим","A patterned red rug hangs above the headboard")],
  [-1,0,en("Сині кухонні фасади поєднані з жовтою плиткою","Blue kitchen cabinets sit against sunny yellow tiles")],
  [1,1,en("У кадрі дерев’яне ліжко із застеленим матрацом","The photo shows a wooden bed with a made-up mattress")],
  [0,1,en("Робочого місця на фото не видно","No work desk is visible in the photos")],
  [1,3,en("На заскленій лоджії видно вазони й вид на воду","The enclosed loggia has potted plants and a view of the water")],
  [1,2,en("Біла ванна стоїть уздовж стіни з м’ятною плиткою","A white bathtub runs along the mint-tiled wall")]]},
 {id:"g", name:en("Теремки","Teremky"), rent:13500,
  photos:[en("Кухня","Kitchen"),en("Вітальня","Living room"),en("Душова","Shower room"),en("Передпокій","Entrance hall")],
  facts:[
  [-1,1,en("За диваном висить великий візерунчастий килим","A large patterned rug hangs behind the sofa")],
  [1,0,en("Кухонні фасади кремового кольору","The kitchen cabinet fronts are cream")],
  [-1,1,en("У кімнаті коричневий диван, окремого ліжка не видно","The room shows a brown sofa and no separate bed")],
  [0,1,en("На фото кімнати не видно письмового столу","The room photo does not show a writing desk")],
  [0,3,en("Балкон у кадр не потрапив","A balcony is not pictured")],
  [-1,2,en("Видно скляну душову кабіну з білим піддоном","A glass shower enclosure has a white tray")]]},
 {id:"h", name:en("Позняки","Pozniaky"), rent:24500,
  photos:[en("Кухня","Kitchen"),en("Спальня","Bedroom"),en("Душова","Shower room"),en("Робоче місце на лоджії","Balcony workspace")],
  facts:[
  [1,1,en("На видимих стінах спальні немає килимів","The visible bedroom walls have no rugs")],
  [1,0,en("Матові сірі фасади поєднані зі світлим деревом","The kitchen pairs matte grey cabinets with pale wood")],
  [1,1,en("На низькому ліжку видно стьобаний матрац","A quilted mattress rests on a low bed frame")],
  [1,3,en("У ніші біля вікон є стіл і офісне крісло","A desk and an office chair fit into the window nook")],
  [1,3,en("Робоче місце облаштовано на заскленій лоджії","The workspace sits inside an enclosed balcony")],
  [-1,2,en("За скляною перегородкою видно душ на рівні підлоги","A glass screen encloses a level-access shower")]]},
 {id:"i", name:en("Золоті ворота","Zoloti Vorota"), rent:28000,
  photos:[en("Кухня","Kitchen"),en("Вітальня","Living room"),en("Ванна","Bathtub"),en("Балкон у двір","Courtyard balcony")],
  facts:[
  [1,1,en("Стіни вітальні вільні, килим лежить на підлозі","The living room walls are bare and the rug is on the floor")],
  [-1,0,en("Жовті шафки й бірюзова плитка над стільницею","Yellow cabinets stand against a teal backsplash")],
  [-1,1,en("У вітальні видно оксамитовий диван без окремого ліжка","The lounge shows a velvet sofa and no separate bed")],
  [0,1,en("Біля дивана журнальний столик, письмового столу не видно","The sofa has a coffee table, with no writing desk in view")],
  [1,3,en("За кованими перилами балкона видно внутрішній двір","The balcony’s iron railing overlooks a courtyard")],
  [1,2,en("Окремо стоїть глибока ванна на ніжках","A deep claw-foot bathtub stands against the wall")]]}
];

const examples = [
  {
    label: en("Спокійні кольори", "Muted colours"),
    query: en("Хочу кухню у спокійних кольорах, ванну й жодних килимів на стінах.", "I’d like a muted kitchen, a bathtub and no rugs on the walls.")
  },
  {
    label: en("Працюю з дому", "I work from home"),
    query: en("Працюю з дому, тож потрібен письмовий стіл. Хочу спати на ліжку й митися в душовій кабіні.", "I work from home and need a desk. I’d like a bed to sleep in and a shower stall.")
  },
  {
    label: en("Кава на балконі", "Coffee on the balcony"),
    query: en("Хочу пити каву на балконі, спати на ліжку й увечері приймати ванну.", "I want coffee on the balcony, a bed to sleep in and a bathtub for a long soak.")
  },
  {
    label: en("До 15 000 грн", "Up to ₴15,000"),
    query: en("До 15 000 грн. Хочу диван для сну й душову кабіну.", "Up to ₴15,000. I’d like a sofa to sleep on and a shower stall.")
  },
  {
    label: en("Вінтаж і рослини", "Vintage and houseplants"),
    query: en("Подобаються яскраві кухні й килими на стінах. Ще хочу балкон для рослин.", "I like bright kitchens and rugs on the walls. I’d also like a balcony for my plants.")
  },
  {
    label: en("Колір і прості стіни", "Colour and bare walls"),
    query: en("Хочу яскраву кухню, ванну для купання і без килимів на стінах.", "I want a bright kitchen, a bathtub and no rugs on the walls.")
  }
];
// Each entry describes one visible object or relationship in one gallery photo.
// A qualified request must match a single entry, so colours and materials stay with their object.
const photoDetails = {
  a: [
    [en("Кремові кухонні шафи з дерев’яною стільницею","Cream kitchen cabinets with a wooden worktop"), en("Вазони на підвіконні кухні","Potted plants on the kitchen windowsill"), en("Біла плита з духовкою","White cooker with an oven")],
    [en("Бордовий візерунчастий килим на стіні над дерев’яним ліжком","Burgundy patterned wall rug above the wooden bed"), en("Темна дерев’яна шафа біля ліжка","Dark wooden wardrobe beside the bed")],
    [en("Біла ванна зі шторкою з блакитними квітами","White bathtub with a blue floral shower curtain"), en("Дзеркало над умивальником","Mirror above the bathroom sink")],
    [en("Засклений балкон із кімнатними рослинами","Enclosed balcony with houseplants")]
  ],
  b: [
    [en("Лаймова кухня з рожевою плиткою","Lime-green kitchen with pink tiles"), en("Круглий дерев’яний обідній стіл","Round wooden dining table"), en("Холодильник біля кухонних шаф","Fridge beside the kitchen cabinets")],
    [en("Бірюзовий диван із подушками","Teal sofa with cushions"), en("Дві картини в рамках на стіні над диваном","Two framed pictures on the wall above the sofa"), en("Дерев’яний письмовий стіл біля вікна з лампою","Wooden desk by the window with a lamp"), en("Кімнатні рослини біля дивана","Houseplants beside the sofa"), en("Світлий килим на підлозі","Light-coloured floor rug")],
    [en("Скляна душова кабіна","Glass shower enclosure"), en("Дзеркальна шафка над умивальником","Mirrored cabinet above the sink")],
    [en("Відкритий балкон із металевими перилами та видом на місто","Open balcony with metal railings and a city view")]
  ],
  c: [
    [en("Приглушена блакитна кухня з дерев’яною стільницею","Muted blue kitchen with a wooden worktop"), en("Ваза з квітами на стільниці","Vase of flowers on the worktop")],
    [en("Ванна зі скляною перегородкою","Bathtub with a glass screen"), en("Оливкова плитка на стінах ванної кімнати","Olive-green wall tiles in the bathroom"), en("Прямокутне дзеркало над умивальником","Rectangular mirror above the sink")],
    [en("Настінні гачки для одягу в передпокої","Wall-mounted coat hooks in the hallway"), en("Блакитні вхідні двері","Blue front door")],
    [en("Дерев’яний письмовий стіл із шухлядами та лампою","Wooden writing desk with drawers and a lamp")]
  ],
  d: [
    [en("Сіро-зелена кухня з газовою плитою","Grey-green kitchen with a gas stove"), en("Вазони на підвіконні","Potted plants on the windowsill")],
    [en("Бірюзовий диван із пледом","Teal sofa with a throw"), en("Дерев’яний письмовий стіл біля вікна з лампою","Wooden desk by the window with a lamp"), en("Дерев’яна паркетна підлога","Wooden parquet flooring")],
    [en("Біла ванна зі шторкою","White bathtub with a shower curtain"), en("Блакитна візерунчаста плитка у ванній кімнаті","Blue patterned bathroom tiles")],
    [en("Відкритий балкон зі складними стільцями та видом на дерева","Open balcony with folding chairs overlooking trees")]
  ],
  e: [
    [en("Червона глянцева кухня","Glossy red kitchen cabinets"), en("Газова плита з духовкою","Gas stove with an oven"), en("Білий холодильник біля вікна","White fridge by the window")],
    [en("Дерев’яне ліжко з матрацом","Wooden bed with a mattress"), en("Письмовий стіл біля вікна з лампою","Desk by the window with a lamp"), en("Килим на підлозі біля ліжка","Floor rug beside the bed")],
    [en("Скляна душова кабіна з низьким піддоном","Glass shower stall with a low tray"), en("Дзеркало над умивальником","Mirror above the sink")],
    [en("Дерев’яна полиця для взуття","Wooden shoe rack"), en("Гачки для одягу біля вхідних дверей","Coat hooks beside the front door")]
  ],
  f: [
    [en("Синя кухня з жовтою плиткою","Blue kitchen cabinets with yellow tiles"), en("Газова плита з духовкою","Gas stove with an oven"), en("Вазон на підвіконні","Potted plant on the windowsill")],
    [en("Червоний візерунчастий килим на стіні над дерев’яним ліжком","Red patterned wall rug above the wooden bed"), en("Дерев’яна шафа біля ліжка","Wooden wardrobe beside the bed")],
    [en("Біла ванна зі шторкою","White bathtub with a shower curtain"), en("М’ятна плитка на стіні у ванній кімнаті","Mint-green bathroom wall tiles")],
    [en("Засклений балкон з рослинами та видом на воду","Enclosed balcony with houseplants and a water view"), en("Крісло біля вазонів на лоджії","Armchair beside potted plants on the loggia")]
  ],
  g: [
    [en("Кремові кухонні шафи","Cream kitchen cabinets"), en("Газова плита з духовкою","Gas stove with an oven")],
    [en("Коричневий тканинний диван","Brown fabric sofa"), en("Візерунчастий рудий килим на стіні над диваном","Rust-coloured patterned wall rug above the sofa"), en("Дерев’яна паркетна підлога","Wooden parquet flooring")],
    [en("Скляна душова кабіна з білим піддоном","Glass shower enclosure with a white tray"), en("Арочне дзеркало над умивальником","Arched mirror above the sink")],
    [en("Полиця для взуття у передпокої","Shoe rack in the hallway"), en("Високе настінне дзеркало","Tall wall mirror")]
  ],
  h: [
    [en("Матова сіра кухня з дерев’яною стільницею","Matte grey kitchen with a wooden worktop"), en("Дерев’яний обідній стіл біля вікна","Wooden dining table by the window"), en("Вбудована духовка","Built-in oven")],
    [en("Низьке дерев’яне ліжко з матрацом","Low wooden bed with a mattress")],
    [en("Душ зі скляною перегородкою на рівні підлоги","Walk-in shower with a glass screen"), en("Велика кругла душова лійка","Large round shower head")],
    [en("Письмовий стіл на заскленому балконі з видом на місто","Desk on an enclosed balcony with a city view"), en("Чорне офісне крісло біля панорамних вікон","Black office chair by panoramic windows")]
  ],
  i: [
    [en("Жовта кухня з бірюзовою плиткою","Yellow kitchen with teal tiles"), en("Круглий дерев’яний обідній стіл","Round wooden dining table"), en("Вбудована духовка","Built-in oven")],
    [en("Вінтажний оливковий оксамитовий диван із різьбленими дерев’яними ніжками","Vintage olive velvet sofa with carved wooden legs"), en("Червоний візерунчастий килим на підлозі","Red patterned floor rug"), en("Круглий журнальний столик із вазою квітів","Round coffee table with a vase of flowers"), en("Велика кімнатна рослина біля вікна","Large houseplant beside the window")],
    [en("Біла ванна на ніжках","White claw-foot bathtub"), en("Плетений кошик у ванній кімнаті","Wicker basket in the bathroom")],
    [en("Відкритий балкон із кованими перилами та видом у двір","Open balcony with wrought-iron railings and a courtyard view"), en("Круглий столик зі скляною стільницею на балконі","Round glass-topped table on the balcony")]
  ]
};
