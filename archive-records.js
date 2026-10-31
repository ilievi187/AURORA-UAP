/* Shared, source-preserving normalization for public historical cases.
 * This file does NOT touch private D1 reports or publication decisions. */
"use strict";
(function (root) {
  const text = (value) => String(value ?? "").trim();
  const title = (item) => text(item.title?.en || item.title?.bg).normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ");
  const sourceUrl = (item) => {
    const raw = text(item.source?.url || item.provenance?.source_url);
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "https:") return "";
      parsed.hash = "";
      return parsed.toString();
    } catch { return ""; }
  };
  function identity(item) {
    const explicit = text(item.dedup_key);
    if (explicit) return "dedup:" + explicit;
    const url = sourceUrl(item);
    const externalId = text(item.provenance?.source_record_id);
    if (url && externalId) return "record:" + url + "|" + externalId;
    // Same source article, date and normalized case title identifies a repeat
    // without merging distinct incidents mentioned by the same publisher.
    if (url && item.date && title(item)) return "article:" + url + "|" + text(item.date) + "|" + title(item);
    return "local:" + text(item.id);
  }
  function hasCoordinates(item) {
    return Number.isFinite(item?.lat) && Number.isFinite(item?.lng) &&
      Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180;
  }

  // A source's long coordinate explanation is NOT the name of a city.
  // Keep that text intact as location_context, and show only the supported
  // geographic anchor in map cards and dossier headers. Approximate markers
  // continue to be explicitly approximate; redacted sites remain unplotted.
  const compactPlaces = {
   "uap-archive-aaro-eglin-uap-case":["Eglin Air Force Base area, Florida","районът на база Еглин, Флорида"],
   "uap-archive-aaro-southeast-asia-triangles-case":["Southeast Asia (broad region)","Югоизточна Азия (широк район)"],
   "uap-archive-aaro-western-united-states-case":["Western United States","Западни Съединени щати"],
   "uap-archive-jal-1628-1986":["Alaska, United States (broad region)","Аляска, САЩ (широк район)"],
   "uap-archive-navy-flir1-2004":["Pacific Ocean off southern California","Тихият океан край Южна Калифорния"],
   "uap-archive-navy-gimbal-2015":["Atlantic Ocean off the U.S. East Coast","Атлантическият океан край източното крайбрежие на САЩ"],
   "disclosure-six-spheres-2025":["Location redacted","Местоположението е заличено"],
   "disclosure-eastern-mediterranean-2024":["Eastern Mediterranean, north of Alexandria","Източното Средиземноморие, северно от Александрия"],
   "disclosure-north-aegean-2023":["North Aegean Sea","Северно Егейско море"],
   "disclosure-western-us-2023":["Undisclosed site, western United States","Неразкрит обект, западни САЩ"],
   "disclosure-test-site-2023":["Undisclosed test site, United States","Неразкрит изпитателен полигон, САЩ"],
   "disclosure-iraq-2022":["Northern Iraq, between Baghdad and Kirkuk","Северен Ирак, между Багдад и Киркук"],
   "disclosure-colorado-springs-2022":["Cheyenne Mountain, Colorado","Шайен Маунтин, Колорадо"],
   "disclosure-persian-gulf-2020":["Persian Gulf, west of Kharg Island","Персийски залив, западно от остров Харг"],
   "disclosure-san-diego-drones-2019":["Pacific Ocean off San Diego","Тихият океан край Сан Диего"],
   "disclosure-roosevelt-2014":["Atlantic Ocean off Virginia","Атлантическият океан край Вирджиния"],
   "disclosure-harare-2008":["Harare International Airport, Zimbabwe","Международно летище Хараре, Зимбабве"],
   "disclosure-belgian-wave-1990":["Central Belgium (regional anchor)","Централна Белгия (ориентировъчен район)"],
   "disclosure-jal1628-1986":["Flight route over interior Alaska","Полетен маршрут над вътрешността на Аляска"],
   "disclosure-hessdalen-1984":["Hessdalen valley, Norway","долината Хесдален, Норвегия"],
   "disclosure-trans-en-provence-1981":["Trans-en-Provence area, France","районът на Транс-ан-Прованс, Франция"],
   "disclosure-minot-afb-1968":["Minot Air Force Base, North Dakota","авиобаза Майнот, Северна Дакота"],
   "disclosure-himalaya-1968":["Himalayas, Ladakh to Nepal","Хималаи, от Ладак до Непал"],
   "disclosure-falcon-lake-1967":["Falcon Lake, Manitoba","езерото Фалкън, Манитоба"],
   "disclosure-exeter-1965":["Southwest of Exeter, New Hampshire","югозападно от Ексетър, Ню Хемпшир"],
   "disclosure-socorro-1964":["Southwest of Socorro, New Mexico","югозападно от Сокоро, Ню Мексико"],
   "disclosure-conde-1963":["Conde, Bahia, Brazil","Конде, Баия, Бразилия"],
   "disclosure-hill-1961":["Route 3 near Lincoln, New Hampshire","път 3 край Линкълн, Ню Хемпшир"],
   "disclosure-boianai-1959":["Boianai, Papua New Guinea","Боянай, Папуа Нова Гвинея"],
   "disclosure-levelland-1957":["Levelland area, Texas","районът на Левеланд, Тексас"],
   "disclosure-ubatuba-1957":["Ubatuba, São Paulo","Убатуба, Сао Пауло"],
   "disclosure-rb47-1957":["Southern United States flight route","полетен маршрут над южните САЩ"],
   "disclosure-lakenheath-1956":["RAF Lakenheath and Bentwaters, England","базите Лейкънхийт и Бентуотърс, Англия"],
   "disclosure-russell-1955":["Alyaty, Azerbaijan (train route)","Алят, Азербайджан (железопътен маршрут)"],
   "disclosure-kelly-hopkinsville-1955":["Kelly–Hopkinsville, Kentucky","Кели–Хопкинсвил, Кентъки"],
   "disclosure-newfoundland-1955":["Gulf of St. Lawrence, off Newfoundland","заливът Свети Лаврентий край Нюфаундленд"],
   "disclosure-tremonton-1952":["North of Tremonton, Utah","северно от Тремонтън, Юта"],
   "disclosure-lubbock-lights-1951":["Lubbock, Texas","Лъбок, Тексас"],
   "disclosure-oak-ridge-1950":["Oak Ridge, Tennessee","Оук Ридж, Тенеси"],
   "disclosure-mantell-1948":["Godman Field, Fort Knox, Kentucky","летище Годман край Форт Нокс, Кентъки"],
   "disclosure-maury-island-1947":["Maury Island, Puget Sound","остров Мори, Пюджет Саунд"],
   "disclosure-ghost-rockets-1946":["Sweden (regional reports)","Швеция (регионални наблюдения)"],
   "disclosure-foo-fighters-1944":["Alsace and neighboring regions, Europe","Елзас и съседни райони в Европа"]
  };
  const undisclosed=new Set(["Location not published","Not known"]);
  function displayPlace(item){
    const original=item?.city;
    const existing=typeof original==="string"?original:original?.en||"";
    const picked=compactPlaces[item.id];
    if(picked)return {...item,
      city:{...(typeof original==="object"?original:{}),en:picked[0],bg:picked[1]},
      location_context:original};
    if(!undisclosed.has(existing)&&existing.length<=75)return item;
    if(!Number.isFinite(item.lat)||!Number.isFinite(item.lng))return item;
    const region=String(item.location_precision||"").match(/(?:anchor:|reference:)\s*([^.;]{3,85})/i)?.[1];
    if(!region)return item;
    return {...item,city:{en:region,bg:region},location_context:original};
  }

  function cleanLegacyLanguage(item){
    const bg=String(item?.summary?.bg||"");
    const paragraphs=Array.isArray(item?.story?.bg)?item.story.bg:[];
    const template=/(?:е случай, описан в публичния каталог|Публикуваните сведения се отнасят|Маркерът, ако има такъв)/i.test(bg)||
     paragraphs.some(p=>/^EN\s*[·:]/.test(String(p))||/Следва оригиналното описание на английски/.test(String(p)));
    if(!template)return item;
    // Keep source English and source identifiers intact; never render a
    // paragraph labelled BG when the content is really EN.
    const summary={...item.summary},story={...item.story};
    delete summary.bg;delete story.bg;
    return {...item,summary,story,translation_status:"needs_full_translation"};
  }
  function prepareArchiveCases(records) {
    const keys = new Set(), ids = new Set(), result = [];
    for (const item of Array.isArray(records) ? records : []) {
      if (!item || typeof item !== "object" || !text(item.id)) continue;
      const key = identity(item), id = text(item.id);
      if (keys.has(key) || ids.has(id)) continue;
      keys.add(key); ids.add(id);
      if (hasCoordinates(item)) result.push(cleanLegacyLanguage(displayPlace({...item})));
      else result.push(cleanLegacyLanguage(displayPlace({...item, lat: null, lng: null,
        location_precision: text(item.location_precision) || "Coordinates not published"})));
    }
    return result;
  }
  root.AURORA_ARCHIVE = Object.freeze({identity, hasCoordinates, prepareArchiveCases});
})(globalThis);
