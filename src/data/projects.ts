// Project metadata for /realizacje/[project] pages.
// Each project groups multiple photos from realizacje.json by projectSlug.
// Used to generate long-tail case-study landing pages.

export type Project = {
  slug: string;        // matches projectSlug in realizacje.json
  category: string;    // matches an OfertaVariant.slug
  title: string;
  subtitle: string;
  location?: string;   // city / region — local SEO win when set
  intro: string;       // 1-2 sentence lead
  body: string[];      // 2-4 paragraphs of context
  keywords: string[];
};

export const projects: Project[] = [
  {
    slug: 'ramka-18mm-rubinova',
    category: 'ramka-18mm',
    title: 'Kuchnia Rubinova — fronty ramiakowe 18 mm',
    subtitle: 'Współczesna kuchnia z dekorem Rubinova',
    intro:
      'Pełna kuchnia z frontami ramiakowymi 18 mm w dekorze Rubinova. 17 zdjęć z gotowej realizacji — meble pod sufit, wyspa, zabudowa kolumnowa.',
    body: [
      'Projekt Rubinova to pełna zabudowa kuchni z naszymi frontami ramiakowymi w wariancie 18 mm. Klient wybrał uniwersalną szerokość ramki, która równie dobrze pasuje do nowoczesnych i klasycznych aranżacji — bez ciężaru pełnej klasyki, ale z wyraźnym charakterem.',
      'Wszystkie fronty wykonaliśmy z płyty laminowanej w dekorze Rubinova. Standardowa grubość 21 mm, ramka 3 mm, klej PUR. Front jest dwustronnie pokryty dekorem — od wewnątrz szafki wygląda tak samo jak od zewnątrz.',
      'Zabudowa obejmuje kolumny pod zabudowę AGD, wyspę z frontami od dwóch stron, szafki górne pod sufit oraz panele maskujące. Wszystkie korpusy współpracują z zawiasami Blum.',
    ],
    keywords: ['kuchnia rubinova', 'fronty ramiakowe 18mm', 'kuchnia z wyspą', 'fronty laminowane Mekra'],
  },
  {
    slug: 'ramka-36mm-grudziadz',
    category: 'ramka-36mm',
    title: 'Kuchnia w Grudziądzu — fronty ramiakowe 36 mm farmhouse',
    subtitle: 'Klasyczna kuchnia farmhouse, realizacja Grudziądz',
    location: 'Grudziądz',
    intro:
      'Klasyczna kuchnia farmhouse z frontami ramiakowymi 36 mm — realizacja w Grudziądzu. 50 zdjęć z gotowej zabudowy: szafki górne, dolne, kolumny AGD, wyspa.',
    body: [
      'Klient z Grudziądza wybrał wariant 36 mm — szerszą ramkę, która buduje klasyczny charakter farmhouse z wyraźnym rytmem na frontach. To jeden z najczęściej wybieranych wariantów Mekra dla kuchni inspirowanych stylem skandynawskim, prowansalskim i wiejskim.',
      'Fronty wykonaliśmy z płyty laminowanej w jednolitym dekorze — bez przebicia struktury drewna. Krawędzie oklejone klejem poliuretanowym PUR, ramka i płycina dwustronnie pokryte tym samym dekorem.',
      'Pełna zabudowa obejmuje szafki dolne, górne pod sufit, zabudowę kolumnową pod piekarnik i lodówkę, wyspę z frontami od dwóch stron. Cała stolarka pracuje na zawiasach Blum, prowadnice pełnego wysuwu.',
      'Realizacja w Grudziądzu pokazuje, jak ramka 36 mm porządkuje duże powierzchnie frontów — bez efektu monotonii, ale ze spójnym, jednorodnym wyglądem.',
    ],
    keywords: ['kuchnia Grudziądz', 'fronty ramiakowe 36mm', 'kuchnia farmhouse', 'kuchnia klasyczna Grudziądz', 'meble kuchenne Grudziądz'],
  },
  {
    slug: 'ramka-60mm-lustra',
    category: 'ramka-60mm',
    title: 'Szafy z lustrem — ramka 60 mm',
    subtitle: 'Klasyczne szafy z lustrem wpuszczonym w ramkę',
    intro:
      'Szafy w wariancie ramki 60 mm z lustrem wpuszczonym w środek ramki. Klasyczne rozwiązanie — zamiast płyciny montujemy lustro lub szkło ozdobne.',
    body: [
      'Ramka 60 mm pozwala na wpuszczenie w środek frontu lustra lub szkła ozdobnego zamiast standardowej płyciny. To rozwiązanie typowe dla klasycznych szaf garderobianych, drzwi przesuwnych w sypialni oraz frontów w przedpokoju.',
      'Lustro jest mocowane od strony wewnętrznej, co daje płaską, jednolitą powierzchnię od strony użytkowania. Dwustronny dekor ramki oznacza, że szafa wygląda estetycznie również od strony wnętrza komory.',
      'Wariant z lustrami sprawdza się jako alternatywa dla pełnych frontów MDF lakierowanych — daje podobny klasyczny efekt, ale z większą odpornością na wilgoć i odkształcenia.',
    ],
    keywords: ['szafa z lustrem', 'fronty z lustrem ramiakowe', 'ramka 60mm lustro', 'szafa garderobiana', 'fronty z lustrem'],
  },
  {
    slug: 'ramka-60mm-szafa',
    category: 'ramka-60mm',
    title: 'Szafy klasyczne — ramka 60 mm',
    subtitle: 'Klasyczna szafa z frontem ramiakowym',
    intro:
      'Szafy z frontami ramiakowymi w wariancie 60 mm — pełny klasyczny charakter, najszersza ramka z oferty Mekra.',
    body: [
      'Ramka 60 mm to nasza najszersza forma — pełna klasyka, masywny rytm. Stosowana głównie w szafach garderobianych, witrynkach i frontach w klasycznych jadalniach.',
      'Standardowa płycina (zamiast lustra) daje pełne pole dekoru — laminowanego, matowego lub akrylowego. Wszystkie warianty dekoru, które mamy w ofercie płyt, są dostępne również dla ramki 60 mm.',
      'Klient otrzymuje front 21 mm na zawiasy Blum, dwustronnie pokryty dekorem, z krawędziami klejonymi PUR.',
    ],
    keywords: ['szafa klasyczna', 'fronty ramiakowe 60mm', 'szafa ramka 60mm', 'klasyczne fronty meblowe'],
  },
  {
    slug: 'ramka-60mm-witrynka',
    category: 'ramka-60mm',
    title: 'Witrynki ze szkłem — ramka 60 mm',
    subtitle: 'Witrynki kuchenne ze szkłem wpuszczonym w ramkę',
    intro:
      'Witrynki kuchenne i jadalniane z frontami ramiakowymi 60 mm — szkło lub szkło ozdobne wpuszczone w środek ramki, alternatywa dla MDF lakierowanego.',
    body: [
      'W tym wariancie zamiast standardowej płyciny w środek ramki 60 mm wpuszczamy szkło — bezbarwne, ornamentowe lub matowe. Najczęściej spotykane rozwiązanie w witrynkach kuchennych, kredensach i komodach.',
      'Konstrukcja jest identyczna jak w wariancie z lustrem — front 21 mm, ramka dwustronnie pokryta dekorem, szkło mocowane od strony wewnętrznej. Możliwe wykonanie z dowolnym dekorem ramki z naszej oferty.',
      'Witrynka ze szkłem to klasyk — dobrze pracuje w aranżacjach prowansalskich, farmhouse i klasycznych. Alternatywa dla witryn z MDF lakierowanego o większej trwałości i odporności na wilgoć.',
    ],
    keywords: ['witrynka kuchenna', 'witrynka ze szkłem', 'fronty witrynki', 'witrynka ramiakowa', 'witrynka klasyczna'],
  },
  {
    slug: 'ramka-7mm',
    category: 'ramka-7mm',
    title: 'Realizacje w wariancie 7 mm — minimalistyczne fronty',
    subtitle: 'Galeria realizacji z najwęższą ramką 7 mm',
    intro:
      '19 zdjęć z realizacji w wariancie ramki 7 mm — najwęższej w naszej ofercie. Minimalistyczna linia, idealna do kuchni nowoczesnych i skandynawskich.',
    body: [
      'Ramka 7 mm to nasza najbardziej minimalistyczna forma — ledwie zauważalna linia, która porządkuje front bez przesłaniania dekoru płyty. Wybierana najczęściej do kuchni w stylu skandynawskim, loftowym i nowoczesnym.',
      'W tej galerii znajdziesz realizacje w różnych dekorach — od jednolitych unikolorów po struktury drewna i akryle. Każda z nich pokazuje, jak 7 mm ramki potrafi nadać charakter bez efektu "klasycznej" stolarki.',
      'Konstrukcja jest taka sama jak we wszystkich naszych frontach ramiakowych: 21 mm grubości, dwustronny dekor, klej PUR, kompatybilność z systemami Blum, Häfele i Hettich.',
    ],
    keywords: ['fronty ramiakowe 7mm', 'kuchnia minimalistyczna', 'kuchnia skandynawska', 'wąska ramka kuchenna', 'fronty 7mm realizacje'],
  },
  {
    slug: 'zabudowa-wino',
    category: 'zabudowy',
    title: 'Zabudowa pod wino — winiarnia na wymiar',
    subtitle: 'Zabudowa specjalna: domowa winiarnia z frontami ramiakowymi',
    intro:
      'Zabudowa pod wino na wymiar — przykład naszej realizacji w kategorii zabudów specjalnych. Półki na butelki, oświetlenie LED, fronty ramiakowe.',
    body: [
      'Domowa winiarnia to jedna z naszych ulubionych zabudów specjalnych. Klient otrzymuje pełną zabudowę dopasowaną do pomieszczenia — z półkami na butelki w pozycji poziomej, miejscem na kieliszki, oświetleniem LED w środku komór.',
      'Fronty ramiakowe nadają zabudowie klasyczny charakter — sprawdzają się równie dobrze w wydzielonej winiarni, jak i w mebloziabudowie kuchennej z dedykowaną szafką na wino.',
      'Każda zabudowa pod wino projektowana jest indywidualnie — wymiarujemy pomieszczenie, projektujemy wnętrze (układ półek, podziały, kolumny pod butelki), produkujemy i montujemy. Wszystkie fronty z dwustronnym dekorem, klejem PUR, na zawiasach Blum.',
    ],
    keywords: ['zabudowa pod wino', 'winiarnia domowa', 'szafa na wino', 'meble do winiarni', 'zabudowa specjalna wino'],
  },
];
