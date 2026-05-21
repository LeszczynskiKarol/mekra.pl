// Centralized data for /oferta and /oferta/[slug] pages.
// Each variant mirrors a category from realizacje.json so we can pull gallery
// images by slug — keep slugs in sync with src/data/realizacje.json.

export type OfertaVariant = {
  slug: string;
  size: string;
  unit: string;
  name: string;
  tagline: string;
  shortDescription: string;
  heroIntro: string;
  heroImage: string;
  styles: string[];
  rooms: string[];
  highlights: { title: string; description: string }[];
  longDescription: string[];
  pros: string[];
  bestFor: string;
  notFor?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

export const ofertaVariants: OfertaVariant[] = [
  {
    slug: 'ramka-7mm',
    size: '7',
    unit: 'mm',
    name: 'Nowoczesna linia',
    tagline: 'Minimalistyczna ramka 7 mm',
    shortDescription:
      'Delikatne podkreślenie formy. Subtelna ramka, która nadaje frontom nowoczesny, minimalistyczny charakter.',
    heroIntro:
      'Najwęższa z naszych ramek. 7 mm to ledwie zauważalna linia, która zostawia całą scenę dekorowi płyty — idealna do kuchni minimalistycznych, skandynawskich i loftowych, gdzie liczy się czystość formy.',
    heroImage: '/img/ramka77mm.jpg',
    styles: ['Minimalizm', 'Skandynawski', 'Loftowy', 'Modern'],
    rooms: ['Kuchnia otwarta', 'Salon z aneksem', 'Pralnia', 'Łazienka'],
    highlights: [
      {
        title: 'Delikatna geometria',
        description:
          'Ramka 7 mm to subtelna linia, która porządkuje front bez przesłaniania struktury płyty. Świetnie wygląda zarówno w unikolorach, jak i w głębokich strukturach drewna.',
      },
      {
        title: 'Wąska, ale nadal ramka',
        description:
          'W przeciwieństwie do gładkich frontów płytowych dostajesz wyraźny rytm i charakter — bez ciężaru klasycznej, szerokiej ramki.',
      },
      {
        title: 'Pełna paleta dekorów',
        description:
          'Maty, akryle, struktura drewna, kamień, beton — dowolny dekor z oferty płyt laminowanych, matowych i akrylowych pasuje do tej ramki.',
      },
    ],
    longDescription: [
      'Ramka 7 mm powstała z myślą o klientach, którzy chcą frontu ramiakowego, ale nie chcą rezygnować z minimalistycznego języka kuchni. To rozwiązanie pośrednie między płytowym frontem a klasyczną ramką — wąska ramka delikatnie ogranicza środkową płycinę, dając wrażenie uporządkowania bez ciężkiej klasyki.',
      'W naszej technologii ramka, środkowa płycina i krawędzie są wykończone tym samym dekorem z obu stron. Front jest dwustronnie pokryty wybranym materiałem, więc widok od wewnątrz szafki jest tak samo estetyczny, jak od zewnątrz.',
      'Front ma grubość 21 mm i bezproblemowo pracuje na standardowych zawiasach Blum, Häfele i Hettich. Wszystkie krawędzie są oklejane klejem poliuretanowym PUR — wodoodpornym i odpornym na temperaturę.',
    ],
    pros: [
      'Najnowocześniejszy wygląd z całej oferty',
      'Wyczuwalna struktura materiału',
      'Dwustronny dekor — od wewnątrz tak samo jak od zewnątrz',
      'Klej PUR i odporność na wilgoć w standardzie',
      'Setki dekorów do wyboru',
    ],
    bestFor:
      'Kuchnie otwarte na salon, projekty w stylu skandynawskim i loftowym, mieszkania, gdzie front ma być obecny, ale dyskretny.',
    seo: {
      title: 'Fronty ramiakowe 7 mm — minimalistyczne fronty kuchenne',
      description:
        'Fronty ramiakowe z ramką 7 mm. Minimalistyczne, nowoczesne fronty kuchenne z płyty laminowanej. Setki dekorów, dwustronny dekor, klej PUR. Producent — Toruń.',
      keywords: [
        'fronty ramiakowe 7mm',
        'wąska ramka kuchnia',
        'fronty minimalistyczne',
        'nowoczesne fronty kuchenne',
        'fronty ramiakowe z płyty',
      ],
    },
  },
  {
    slug: 'ramka-18mm',
    size: '18',
    unit: 'mm',
    name: 'Współczesna elegancja',
    tagline: 'Uniwersalna ramka 18 mm',
    shortDescription:
      'Ramka w nowoczesnej formie z wyraźniejszym akcentem. Łączy współczesne wzornictwo z wyczuwalną strukturą materiału.',
    heroIntro:
      'Ramka 18 mm to nasz najbardziej uniwersalny wybór. Jest na tyle wyraźna, że nadaje frontowi charakter, ale na tyle wąska, żeby nie ciążyć w nowoczesnym wnętrzu. Sprawdza się w kuchni, w zabudowie pralni i w meblach na wymiar.',
    heroImage: '/img/ramka18mm.jpg',
    styles: ['Modern', 'Współczesny', 'Klasyka w odświeżonej formie', 'Japandi'],
    rooms: ['Kuchnia', 'Pralnia', 'Garderoba', 'Zabudowy meblowe'],
    highlights: [
      {
        title: 'Wyraźny rytm bez ciężaru',
        description:
          'Środkowa szerokość ramki to złoty środek — front jest geometrycznie czytelny, ale nie dominuje wnętrza.',
      },
      {
        title: 'Pasuje do większości projektów',
        description:
          'Jeśli nie wiesz, którą szerokość wybrać — 18 mm to bezpieczna decyzja, która wpasuje się w niemal każdy styl.',
      },
      {
        title: 'Skala faktury',
        description:
          'Na szerszej ramce wyraźniej widać strukturę głęboko strukturyzowanych płyt Saviola czy Forner Cleaf.',
      },
    ],
    longDescription: [
      'Ramka 18 mm to najczęściej wybierana szerokość w naszej ofercie. Łączy dwa światy: dyskrecję nowoczesnych frontów oraz wyraźny detal, którego brakuje w jednolitych płytach. To rozwiązanie dla osób, które chcą frontu z charakterem, ale nie chcą wchodzić w pełną klasykę farmhouse.',
      'W tej szerokości szczególnie pięknie wyglądają płyty o wyraźnej strukturze drewna oraz ultramaty pochłaniające światło. Ramka działa wtedy jak ramka obrazu — buduje kompozycję frontu.',
      'Grubość frontu 21 mm, kompatybilność z zawiasami Blum, Häfele, Hettich. Klej PUR, dwustronny dekor i odporność na wilgoć — wszystko w standardzie.',
    ],
    pros: [
      'Najbardziej uniwersalna szerokość',
      'Bezpieczny wybór do większości projektów',
      'Wyraźny detal bez ciężaru klasyki',
      'Idealna do struktur drewna i ultramatów',
      'Sprawdza się w kuchni i w zabudowach pomocniczych',
    ],
    bestFor:
      'Kuchnie współczesne z elementami klasyki, mieszkania w stylu japandi, zabudowy pomocnicze (pralnia, garderoba), projekty z głęboko strukturyzowanymi płytami.',
    seo: {
      title: 'Fronty ramiakowe 18 mm — uniwersalne fronty kuchenne',
      description:
        'Fronty ramiakowe z ramką 18 mm. Współczesna elegancja, uniwersalna szerokość ramki. Płyta laminowana, akryl, ultramat. Producent frontów — Toruń, kujawsko-pomorskie.',
      keywords: [
        'fronty ramiakowe 18mm',
        'ramka 18mm kuchnia',
        'fronty kuchenne uniwersalne',
        'fronty laminowane na wymiar',
        'fronty meblowe z ramką',
      ],
    },
  },
  {
    slug: 'ramka-36mm',
    size: '36',
    unit: 'mm',
    name: 'Klasyczny szyk',
    tagline: 'Charakterna ramka 36 mm',
    shortDescription:
      'Idziemy w stronę klasyku — kuchni farmerskich, skandynawskich, prowansalskich. Szersza ramka nadaje meblom charakteru i przytulności.',
    heroIntro:
      'Ramka 36 mm to nasz bestseller wśród klasycznych projektów. Szersza ramka buduje przytulny, ciepły charakter wnętrza — to wybór dla kuchni farmhouse, skandynawskich, prowansalskich i wszystkich tych, w których chcesz, żeby front był jednym z głównych bohaterów.',
    heroImage: '/img/ramka36mm.jpg',
    styles: ['Farmhouse', 'Skandynawski klasyczny', 'Prowansalski', 'Hampton', 'Vintage'],
    rooms: ['Kuchnia klasyczna', 'Spiżarnia', 'Wyspa kuchenna', 'Zabudowa kuchenna z okapem'],
    highlights: [
      {
        title: 'Charakter klasyki',
        description:
          'Szeroka ramka 36 mm to bezpośrednie nawiązanie do tradycyjnych frontów MDF lakierowanych — w wersji wielokrotnie odporniejszej i z dwustronnym dekorem.',
      },
      {
        title: 'Ciepło materiału',
        description:
          'Na szerszej ramce wyraźnie pracują struktury drewna i pasterskie dekory. Płyta pod palcami czuje się jak prawdziwe deska.',
      },
      {
        title: 'Świetna baza pod malowanie wizualne',
        description:
          'W połączeniu z uchwytami z mosiądzu lub czarnej stali front 36 mm buduje pełną stylizację farmhouse czy hamptonu.',
      },
    ],
    longDescription: [
      'Ramka 36 mm to najszersza klasyczna szerokość, którą rekomendujemy do projektów z aspiracjami stylistycznymi: farmhouse, skandynawski klasyk, hampton, prowansalski. Front działa wtedy jak rama obrazu, a środkowa płycina jak płótno — kompozycja jest pełna i samodzielna, nawet bez dodatkowych ozdobników.',
      'W tej szerokości dobrze wyglądają zarówno klasyczne, jasne dekory (biały Saviola, kremy, beż), jak i wyraźne struktury drewna (dąb, orzech). Połączenie z mosiężnymi uchwytami daje efekt pełnego, kompletnego mebla, którego nie odróżnisz od lakierowanego MDF, dopóki nie dotkniesz faktury.',
      'Tak jak we wszystkich naszych frontach: grubość 21 mm, klej PUR, dwustronny dekor, zgodność z systemami Blum, Häfele i Hettich. W ramce 36 mm szczególnie warto rozważyć płyty z kolekcji Saviola, Forner Cleaf i Egger — pełnia struktur drewna i naturalnych materiałów.',
    ],
    pros: [
      'Najwięcej charakteru z całej oferty',
      'Doskonała baza pod klasyczne stylizacje',
      'Pełne wybarwienie struktur drewna na szerokiej ramce',
      'Trwałość płyty laminowanej zamiast delikatnego lakieru',
      'Najczęściej wybierana ramka w naszych realizacjach (50 zdjęć w galerii)',
    ],
    bestFor:
      'Kuchnie farmhouse, skandynawski klasyk, projekty prowansalskie, kuchnie w domach jednorodzinnych, wyspy z mocnym akcentem, klasyczne zabudowy z okapem kominowym.',
    seo: {
      title: 'Fronty ramiakowe 36 mm — klasyczne fronty kuchenne farmhouse',
      description:
        'Fronty ramiakowe z ramką 36 mm. Klasyczny styl farmhouse, skandynawski, prowansalski. Charakterna ramka, struktury drewna, odporność płyty laminowanej. Producent — Toruń.',
      keywords: [
        'fronty ramiakowe 36mm',
        'kuchnia farmhouse fronty',
        'fronty klasyczne kuchenne',
        'kuchnia skandynawska fronty',
        'fronty styl prowansalski',
      ],
    },
  },
  {
    slug: 'ramka-60mm',
    size: '60',
    unit: 'mm',
    name: 'Pełna klasyka',
    tagline: 'Najszersza ramka 60 mm',
    shortDescription:
      'Standardowa, znana forma z frontów MDF lakierowanych — teraz w wersji z płyty laminowanej. Możliwość wpuszczenia lustra lub szkła w środek ramki.',
    heroIntro:
      'Ramka 60 mm to pełna klasyka — najszersza w naszej ofercie, dedykowana szafom, witrynkom i zabudowom z lustrem lub szkłem. Tylko w tej szerokości oferujemy wpuszczenie lustra lub szkła bezpośrednio w środek ramki, zamiast standardowego montażu od tyłu frontu.',
    heroImage: '/img/ramka60mm.jpg',
    styles: ['Klasyka', 'Hampton', 'Glamour', 'Eklektyka', 'Vintage z lustrem'],
    rooms: ['Garderoba', 'Sypialnia (szafy)', 'Witrynki w salonie', 'Wiatrołap', 'Łazienka (szafki z lustrem)'],
    highlights: [
      {
        title: 'Lustro i szkło w środku ramki',
        description:
          'Tylko ramka 60 mm pozwala wpuścić lustro lub szkło bezpośrednio w środek frontu. Efekt jest znacznie lepszy niż w tradycyjnym montażu od tyłu — front wygląda jak jedna spójna płaszczyzna.',
      },
      {
        title: 'Charakter szafy z duszą',
        description:
          'Szerokość 60 mm daje pełen, klasyczny look — idealny do garderoby, szaf w sypialni, witrynek z porcelaną i wszystkich projektów z aspiracjami stylowymi.',
      },
      {
        title: 'Alternatywa dla MDF lakierowanego',
        description:
          'Identyczna forma jak w klasycznym MDF lakierowanym — z wielokrotnie większą odpornością i dwustronnym dekorem.',
      },
    ],
    longDescription: [
      'Ramka 60 mm to nasz najszerszy wariant i jedyna szerokość, w której technicznie możliwe jest wpuszczenie lustra lub szkła w środek ramki. Standardowo w branży lustro montuje się od tyłu frontu — w naszej technologii 60 mm szkło lub lustro siedzi w wycięciu, dokładnie jak płycina w ramiaku. Efekt to gładka, spójna płaszczyzna bez wystających krawędzi.',
      'Ważne: ramka bez środkowej płyciny (np. pod lustro) jest składana inną technologią i posiada widoczną linię łączenia w pionie po obu stronach frontu. To cecha techniczna, którą warto znać przed wyborem.',
      'Ta szerokość ramki to bezpośrednia odpowiedź na fronty MDF lakierowane — ten sam wygląd, znacząco większa odporność, dwustronny dekor i bogatsza paleta wykończeń. Idealnie sprawdza się w garderobach, szafach sypialnianych, witrynkach i zabudowach łazienkowych.',
    ],
    pros: [
      'Jedyna ramka, w której wchodzi lustro/szkło w środek',
      'Pełen klasyczny look — alternatywa dla MDF lakier',
      'Doskonała do szaf, witrynek i garderób',
      'Szeroka ramka — wyraźny detal, klasyczna kompozycja',
      'Dwustronny dekor, klej PUR, kompatybilność z systemami premium',
    ],
    bestFor:
      'Garderoby, szafy w sypialni, witrynki w salonie, zabudowy łazienkowe z lustrem, klasyczne meble z aspiracjami stylowymi, alternatywa dla drogiego MDF lakierowanego.',
    notFor:
      'Minimalistycznych kuchni otwartych na salon, gdzie szukasz dyskrecji — tam lepsza będzie ramka 7 lub 18 mm.',
    seo: {
      title: 'Fronty ramiakowe 60 mm — szafy, witrynki, lustro w ramce',
      description:
        'Fronty ramiakowe z ramką 60 mm. Pełna klasyka, lustro lub szkło wpuszczane w środek ramki. Alternatywa dla MDF lakierowanego. Producent szaf i witrynek — Toruń.',
      keywords: [
        'fronty ramiakowe 60mm',
        'fronty do szafy z lustrem',
        'fronty witrynka klasyczna',
        'fronty garderoby na wymiar',
        'alternatywa MDF lakierowany',
      ],
    },
  },
  {
    slug: 'zabudowy',
    size: '★',
    unit: '',
    name: 'Zabudowy specjalne',
    tagline: 'Mebel zaprojektowany do pomieszczenia',
    shortDescription:
      'Zabudowy nietypowe — winiarnie, regały, meble pod konkretne pomieszczenie. Projektujemy razem z Tobą i dopasowujemy do milimetra.',
    heroIntro:
      'Czasem projekt nie mieści się w kategoriach „kuchnia" czy „szafa". Wtedy robimy zabudowy nietypowe: winiarnie z chłodzeniem, regały do gabinetów, ścianki TV, zabudowy pod skosami, meble na zamówienie pod konkretne pomieszczenie i jego ograniczenia.',
    heroImage: '/img/realizacje/zabudowy/zabudowa-wino-01.jpg',
    styles: ['Mebel na wymiar', 'Projekt unikatowy', 'Pod konkretne pomieszczenie'],
    rooms: ['Winiarnia w salonie', 'Gabinet domowy', 'Ścianka TV', 'Zabudowy pod skosami', 'Wnęki nietypowe'],
    highlights: [
      {
        title: 'Projekt pod pomieszczenie',
        description:
          'Wymiarujemy lub przyjmujemy Twoje wymiary i projektujemy mebel od zera. Nie wciskamy gotowych modułów — dopasowujemy się do milimetra.',
      },
      {
        title: 'Pełna swoboda materiałów',
        description:
          'Każda z ramek (7/18/36/60 mm) oraz pełna paleta dekorów płyt laminowanych, matowych, akrylowych — dobieramy do funkcji mebla.',
      },
      {
        title: 'Specjalne funkcje',
        description:
          'Chłodzenie wina, podświetlenie LED, szkło, lustro, sztywne półki na ciężkie kolekcje — łączymy stolarkę z technologią pod konkretną potrzebę.',
      },
    ],
    longDescription: [
      'Zabudowy specjalne to projekty, w których funkcja jest tak samo ważna, jak wygląd. Robiliśmy winiarnie z chłodzeniem zintegrowanym z meblem, regały do bibliotek, ścianki TV z ukrytą wentylacją sprzętu, zabudowy pod skosami w poddaszach, gdzie żaden gotowy moduł by się nie wpasował.',
      'Zaczynamy od rozmowy o funkcji — co ma trzymać, na co być odporne, jak się otwierać. Potem projektujemy konstrukcję, dobieramy ramkę i dekor pod estetykę pomieszczenia. Klient dostaje wizualizację przed produkcją.',
      'Niezależnie od nietypowości projektu — standard wykonania jest ten sam: grubość frontu 21 mm, klej PUR, dwustronny dekor, kompatybilność z zawiasami Blum, Häfele i Hettich.',
    ],
    pros: [
      'Mebel zaprojektowany od zera pod Twoje pomieszczenie',
      'Dowolna szerokość ramki w jednej zabudowie',
      'Specjalne funkcje (chłodzenie, LED, szkło) wbudowane w projekt',
      'Wizualizacja przed produkcją',
      'Wymiarowanie na miejscu w promieniu 100 km od Torunia',
    ],
    bestFor:
      'Winiarnie domowe, biblioteki i gabinety, ścianki TV, zabudowy pod skosami, wnęki nietypowe, każdy projekt, do którego gotowy moduł by nie pasował.',
    seo: {
      title: 'Zabudowy meblowe na wymiar — winiarnie, regały, projekty nietypowe',
      description:
        'Zabudowy meblowe na wymiar: winiarnie, regały, ścianki TV, zabudowy pod skosami. Projekt + wymiarowanie + produkcja. Toruń i kujawsko-pomorskie.',
      keywords: [
        'zabudowy meblowe Toruń',
        'meble na wymiar',
        'winiarnia domowa',
        'regały na wymiar',
        'zabudowy pod skosami',
        'ścianka TV na wymiar',
      ],
    },
  },
];

export function getOfertaVariant(slug: string): OfertaVariant | undefined {
  return ofertaVariants.find((v) => v.slug === slug);
}
