// ============================================================
// DEMO ADATOK – Minőségügyi Segéd
// ============================================================

const PRODUCTS = {
  "VALTO-04X": {
    id: "VALTO-04X",
    name: "Váltóhajtómű 4X",
    type: "Váltóhajtómű",
    client: "MÁV",
    clientLogo: "🚂",
    drawing: "WD-2026-A",
    revision: "Rev. 3",
    color: "#e63946",
    checklist: [
      {
        id: "v04x_01",
        order: 1,
        title: "Ház épsége és festés minősége",
        description: "Vizsgáld meg a ház felszínét: nincs-e repedés, korrózió, vagy festékleválás.",
        type: "boolean",
        requires: [],
        info: {
          text: "A festékfelületnek egyenletesnek kell lennie. Elfogadható: kisebb karcolás (max 2mm). Nem elfogadható: rozsdafolt, buborékos festék.",
          goodExample: "Egyenletes, sötétszürke felszín, maximum 1-2 kis karcolással.",
          goodImg: "https://dummyimage.com/400x250/10b981/ffffff&text=OK+-+Tiszta+fel%C3%BClet",
          badExample: "Rozsdafolt a saroknál, vagy leváló festék.",
          badImg: "https://dummyimage.com/400x250/ef4444/ffffff&text=NOK+-+Rozsdafoltos"
        }
      },
      {
        id: "v04x_02",
        order: 2,
        title: "Rögzítőcsavarok nyomatéka",
        description: "Mérd meg a 4 db M12-es csavar nyomatékát nyomatékkulccsal.",
        type: "measurement",
        unit: "Nm",
        min: 42,
        max: 48,
        target: 45,
        requires: ["v04x_01"],
        info: {
          text: "Az M12-es csavarokhoz előírt nyomaték: 45 Nm ± 3 Nm. Használj kalibrált nyomatékkulcsot.",
          goodExample: "44-46 Nm között minden csavar.",
          badExample: "40 Nm alatt, vagy 50 Nm felett."
        }
      },
      {
        id: "v04x_03",
        order: 3,
        title: "Belső kábelezés útvonala",
        description: "Ellenőrizd, hogy a kábelkötegek a WD-2026-A rajzon jelölt útvonalon futnak-e. Nincs-e szorulás, törés, vagy éles sarok.",
        type: "boolean",
        requires: ["v04x_01"],
        info: {
          text: "A kábelkötegek minimális hajlítási sugara: 50mm. A rögzítőklipszek távolsága max 150mm legyen.",
          goodExample: "Rendezett, szabályos ívű kábelköteg, minden klipsz a helyén.",
          badExample: "Éles törés a kábelköteknél, vagy hiányzó rögzítőklipsz."
        }
      },
      {
        id: "v04x_04",
        order: 4,
        title: "Szigetelési ellenállás mérése",
        description: "Mérj 500V DC méréssel a fővezérlő csatlakozó és a ház között.",
        type: "measurement",
        unit: "MΩ",
        min: 10,
        max: 9999,
        target: 100,
        requires: ["v04x_02", "v04x_03"],
        info: {
          text: "Minimum elfogadható érték: 10 MΩ (IEC 61439 szerint). Az optimális érték 100 MΩ felett van.",
          goodExample: "Mért érték: 250 MΩ – kiváló.",
          badExample: "Mért érték: 8 MΩ – az előírt minimum alatt, SELEJT."
        }
      },
      {
        id: "v04x_05",
        order: 5,
        title: "Működési próba – Alapállás",
        description: "Kapcsold be a hajtóművet és ellenőrizd az alapállásba való visszatérést.",
        type: "boolean",
        requires: ["v04x_04"],
        info: {
          text: "A hajtóműnek 3 másodpercen belül alapállásba kell visszatérnie. Ellenőrizd a végállás-kapcsoló jelzőfényét.",
          goodExample: "Sima mozgás, zöld LED jelzés, 2-3 másodperc alatt alapállás.",
          badExample: "Akadozó mozgás, sárga LED (hiba) vagy időtúllépés."
        }
      },
      {
        id: "v04x_06",
        order: 6,
        title: "Hézag mérés – Fogasléc",
        description: "Mérd meg a fogasléc és a fogaskerék közötti hézagot.",
        type: "measurement",
        unit: "mm",
        min: 0.1,
        max: 0.3,
        target: 0.2,
        requires: ["v04x_05"],
        info: {
          text: "Az előírt hézag 0,1–0,3 mm. Tapintómérővel mérj legalább 3 ponton.",
          goodExample: "0,15–0,25 mm minden ponton.",
          badExample: "0,05 mm alatt (szorulás), vagy 0,4 mm felett (játék)."
        }
      },
      {
        id: "v04x_07",
        order: 7,
        title: "Jelölés és azonosítás",
        description: "Ellenőrizd, hogy a típustábla, sorozatszám és a vevői logó (MÁV) helyesen van-e felszerelve.",
        type: "boolean",
        requires: ["v04x_01"],
        info: {
          text: "A típustáblának jól olvashatónak kell lennie. A sorozatszámnak egyeznie kell a munkalappal.",
          goodExample: "Tisztán olvasható, sérületlen típustábla, helyes sorozatszám.",
          badExample: "Hiányzó tábla, olvashatatlan szám, rossz logó."
        }
      },
      {
        id: "v04x_08",
        order: 8,
        title: "Csomagolás és kiszállítási állapot",
        description: "Ellenőrizd a védőcsomagolást, a rozsdagátló folyadék felvitelét és a szállítási dokumentumokat.",
        type: "boolean",
        requires: ["v04x_07"],
        info: {
          text: "Minden nyitott csatlakozót le kell takarni. A rozsdagátló spray felvitele kötelező a külső acélfelületekre.",
          goodExample: "Minden csatlakozó lefedve, rozsdagátló felvive, dokumentumok mellékelve.",
          badExample: "Fedetlen csatlakozók, hiányzó dokumentumok."
        }
      }
    ]
  },

  "RELAY-BB2": {
    id: "RELAY-BB2",
    name: "Jelfogó egység BB2",
    type: "Jelfogó",
    client: "ÖBB",
    clientLogo: "🇦🇹",
    drawing: "SC-2025-B",
    revision: "Rev. 1",
    color: "#2a9d8f",
    checklist: [
      {
        id: "rbb2_01",
        order: 1,
        title: "Alaplap vizuális ellenőrzése",
        description: "Vizsgáld meg az alaplapot: nincs-e égett alkatrész, korrózió, vagy törött forrasztás.",
        type: "boolean",
        requires: [],
        info: {
          text: "Különösen figyelj a nagyobb alkatrészek (kondenzátorok, relék) lábainál a forrasztásra.",
          goodExample: "Ezüstös, fényes forrasztási felületek, sérülésmentes alkatrészek.",
          badExample: "Sötét, égett folt bármely alkatrésznél, vagy repedt forrasztás."
        }
      },
      {
        id: "rbb2_02",
        order: 2,
        title: "Jelfogók működési teszt",
        description: "Teszteld mind a 4 relét vezérlőárammal. Ellenőrizd a mechanikus zárást és az akusztikus jelzést.",
        type: "boolean",
        requires: ["rbb2_01"],
        info: {
          text: "Minden relénél kattanó hangnak kell hallani aktiváláskor. A LED jelzőnek ki kell gyulladnia.",
          goodExample: "Erős, tiszta kattanás, LED azonnal reagál.",
          badExample: "Gyenge vagy hiányzó kattanás, LED nem gyullad ki."
        }
      },
      {
        id: "rbb2_03",
        order: 3,
        title: "Üzemi feszültség mérés",
        description: "Mérd az üzemi feszültséget a fő tápcsatlakozón terheléssel.",
        type: "measurement",
        unit: "V",
        min: 23.5,
        max: 26.5,
        target: 24,
        requires: ["rbb2_02"],
        info: {
          text: "Az ÖBB előírás szerint: 24V DC ± 2,5V. Mérj legalább 5 másodpercig folyamatos terheléssel.",
          goodExample: "23,8–24,2 V stabil feszültség.",
          badExample: "Ingadozó, vagy 23 V alá eső feszültség terhelés alatt."
        }
      },
      {
        id: "rbb2_04",
        order: 4,
        title: "Csatlakozók rögzítése",
        description: "Ellenőrizd, hogy a 3 db D-sub csatlakozó biztonságosan rögzített és a reteszelő csavarok be vannak-e húzva.",
        type: "boolean",
        requires: ["rbb2_01"],
        info: {
          text: "A D-sub csatlakozó reteszelő csavarjait ujjal kell húzni, majd 0,5 Nm nyomatékkal.",
          goodExample: "Minden csatlakozó erősen rögzítve, csavarok behúzva.",
          badExample: "Laza csatlakozó, hiányzó reteszelő csavar."
        }
      },
      {
        id: "rbb2_05",
        order: 5,
        title: "Védelmi osztály ellenőrzés (IP54)",
        description: "Ellenőrizd a tömítő gumikat a ház peremén és a kábelbemeneteknél.",
        type: "boolean",
        requires: ["rbb2_04"],
        info: {
          text: "Az IP54 védelmi osztályhoz minden tömítő guminak sértetlennek és megfelelően elhelyezettnek kell lennie.",
          goodExample: "Rugalmas, sérülésmentes gumitömítések, egyenletesen leszorítva.",
          badExample: "Repedezett, kiugrott, vagy hiányzó tömítő gumi."
        }
      },
      {
        id: "rbb2_06",
        order: 6,
        title: "Átmeneti ellenállás mérés (csatlakozókon)",
        description: "Mérd az átmeneti ellenállást a D-sub csatlakozók minden érintkezőjén.",
        type: "measurement",
        unit: "mΩ",
        min: 0,
        max: 10,
        target: 5,
        requires: ["rbb2_03", "rbb2_05"],
        info: {
          text: "Maximálisan elfogadható átmeneti ellenállás: 10 mΩ érintkezőnként (DIN VDE 0470).",
          goodExample: "3-7 mΩ minden érintkezőn.",
          badExample: "10 mΩ feletti érték bármely érintkezőn – csatlakozócsere szükséges."
        }
      }
    ]
  },

  "VALTO-07D": {
    id: "VALTO-07D",
    name: "Váltóhajtómű 7D",
    type: "Váltóhajtómű",
    client: "Deutsche Bahn",
    clientLogo: "🇩🇪",
    drawing: "DB-WD-2026-C",
    revision: "Rev. 2",
    color: "#e76f51",
    checklist: [
      {
        id: "v07d_01",
        order: 1,
        title: "Ház integritás és korrózióvédelem",
        description: "Vizsgáld meg a teljes házat korrózió és mechanikai sérülés szempontjából.",
        type: "boolean",
        requires: [],
        info: {
          text: "DB szabvány szerint: festési vastagság min. 60 mikrométer (DIN 55928).",
          goodExample: "Egyenletes festék, sérülés nélkül.",
          badExample: "Rozsdafolt, kopott vagy leváló festék."
        }
      },
      {
        id: "v07d_02",
        order: 2,
        title: "Fő rögzítőcsavarok – M16",
        description: "Ellenőrizd a 6 db M16-os rögzítőcsavar nyomatékát.",
        type: "measurement",
        unit: "Nm",
        min: 88,
        max: 98,
        target: 93,
        requires: ["v07d_01"],
        info: {
          text: "M16-os csavar, 8.8-as szilárdságú: előírt nyomaték 93 Nm ± 5 Nm.",
          goodExample: "90-96 Nm minden csavar.",
          badExample: "85 Nm alatt, vagy 100 Nm felett."
        }
      },
      {
        id: "v07d_03",
        order: 3,
        title: "Motorblokk rögzítés",
        description: "Ellenőrizd a motorblokk 4 tartócsavarját és a rezgéscsillapítók állapotát.",
        type: "boolean",
        requires: ["v07d_01"],
        info: {
          text: "A rezgéscsillapítóknak tömörnek kell lenniük, nem lehet kiszáradás vagy repedés.",
          goodExample: "Rugalmas, sérülésmentes rezgéscsillapítók, szoros csavarok.",
          badExample: "Kemény, repedt rezgéscsillapító, laza csavar."
        }
      },
      {
        id: "v07d_04",
        order: 4,
        title: "Kenőanyag szint ellenőrzés",
        description: "Ellenőrizd a sebességváltó kenőolaj szintjét az olajszintjelzőn.",
        type: "boolean",
        requires: ["v07d_03"],
        info: {
          text: "Az olajszintnek a MIN és MAX jelzések között kell lennie. A DB előírás: Mobilgear SHC 460 olaj.",
          goodExample: "Olajszint a jelzések közepén, olaj tiszta, aranyszín.",
          badExample: "Olaj a MIN jel alatt, sötét/szennyezett olaj."
        }
      },
      {
        id: "v07d_05",
        order: 5,
        title: "Tengelykapcsoló axiális hézag",
        description: "Mérd a tengelykapcsoló axiális hézagát tolómérővel.",
        type: "measurement",
        unit: "mm",
        min: 0.5,
        max: 1.5,
        target: 1.0,
        requires: ["v07d_02", "v07d_04"],
        info: {
          text: "DB-WD-2026-C rajz: axiális hézag 1,0 mm ± 0,5 mm. Mérj legalább 3 szimmetrikus ponton.",
          goodExample: "0,8–1,2 mm egyenletesen.",
          badExample: "0,4 mm alatt (túl szoros), 1,6 mm felett (túl lazó)."
        }
      },
      {
        id: "v07d_06",
        order: 6,
        title: "Villamos bekötés és szigetelés",
        description: "Ellenőrizd a villamos bekötést a kapcsolási rajz szerint, majd mérj szigetelési ellenállást.",
        type: "measurement",
        unit: "MΩ",
        min: 100,
        max: 9999,
        target: 500,
        requires: ["v07d_05"],
        info: {
          text: "DB előírás: min. 100 MΩ, 1000V DC méréssel (stricter mint MÁV). IEC 60227 szerint.",
          goodExample: "500 MΩ felett – kiváló szigetelés.",
          badExample: "100 MΩ alatt – nem megfelelő, vizsgálat szükséges."
        }
      },
      {
        id: "v07d_07",
        order: 7,
        title: "Terheléses működési próba",
        description: "Végezd el a terheléses működési próbát: 10 teljes átállási ciklus, mérj erőt és időt.",
        type: "measurement",
        unit: "s",
        min: 2.0,
        max: 4.0,
        target: 3.0,
        requires: ["v07d_06"],
        info: {
          text: "Az átállási időnek 3,0 másodperc ± 1 másodperc kell lennie terhelt állapotban.",
          goodExample: "2,5–3,5 s minden ciklusnál, egyenletes mozgás.",
          badExample: "2 s alatt (túl gyors, szorulás kizárva?), 4 s felett (lassú, kenési probléma?)."
        }
      },
      {
        id: "v07d_08",
        order: 8,
        title: "Zajszint mérés üzemelés közben",
        description: "Mérj zajszintet a hajtómű mellett 1 méteres távolságból.",
        type: "measurement",
        unit: "dB",
        min: 0,
        max: 72,
        target: 65,
        requires: ["v07d_07"],
        info: {
          text: "DB maximálisan megengedett zajszint: 72 dB(A) üzemelés közben.",
          goodExample: "60-68 dB – normál tartomány.",
          badExample: "73 dB felett – rendellenes zaj, vizsgálandó."
        }
      },
      {
        id: "v07d_09",
        order: 9,
        title: "Típustábla és DB jelölések",
        description: "Ellenőrizd a Deutsche Bahn jelölési előírásait: típustábla, CE jelölés, sorozatszám, gyártási dátum.",
        type: "boolean",
        requires: ["v07d_01"],
        info: {
          text: "DB Technische Anforderungen szerint minden jelölésnek indelible (nem eltávolítható) tintával kell lennie.",
          goodExample: "Minden jelölés látható, jól olvasható, DB logó helyes.",
          badExample: "Hiányzó CE jelölés, olvashatatlan sorozatszám."
        }
      },
      {
        id: "v07d_10",
        order: 10,
        title: "Végső csomagolás és szállítási dokumentáció",
        description: "Ellenőrizd a csomagolást, a DB FAT (Factory Acceptance Test) dokumentumokat és a szállítólevelet.",
        type: "boolean",
        requires: ["v07d_09"],
        info: {
          text: "FAT dokumentumnak a mérési adatokkal aláírtnak kell lennie a QA vezető által. Minden dokumentum DB logóval ellátva.",
          goodExample: "Teljes FAT csomag, aláírva, DB-specifikus csomagolás.",
          badExample: "Hiányzó FAT aláírás, helytelen csomagolóanyag."
        }
      }
    ]
  }
};

// ============================================================
// DEMO STATISZTIKÁK (Dashboard-hoz)
// ============================================================

const DEMO_INSPECTIONS = [
  { id: "INS-2026-001", product: "VALTO-04X", inspector: "Kovács János", date: "2026-05-28", result: "MEGFELELŐ", defects: 0, duration: 22 },
  { id: "INS-2026-002", product: "RELAY-BB2", inspector: "Szabó Péter", date: "2026-05-28", result: "HIBÁS", defects: 1, duration: 31 },
  { id: "INS-2026-003", product: "VALTO-07D", inspector: "Kovács János", date: "2026-05-29", result: "MEGFELELŐ", defects: 0, duration: 45 },
  { id: "INS-2026-004", product: "VALTO-04X", inspector: "Nagy Éva", date: "2026-05-29", result: "MEGFELELŐ", defects: 0, duration: 20 },
  { id: "INS-2026-005", product: "RELAY-BB2", inspector: "Szabó Péter", date: "2026-05-30", result: "MEGFELELŐ", defects: 0, duration: 28 },
  { id: "INS-2026-006", product: "VALTO-04X", inspector: "Nagy Éva", date: "2026-05-30", result: "HIBÁS", defects: 2, duration: 38 },
  { id: "INS-2026-007", product: "VALTO-07D", inspector: "Kovács János", date: "2026-05-31", result: "MEGFELELŐ", defects: 0, duration: 42 },
  { id: "INS-2026-008", product: "RELAY-BB2", inspector: "Nagy Éva", date: "2026-05-31", result: "MEGFELELŐ", defects: 0, duration: 25 }
];

const DEMO_USERS = [
  { id: "u1", name: "Kovács János", role: "inspector", pin: "1234", avatar: "KJ" },
  { id: "u2", name: "Nagy Éva", role: "inspector", pin: "2345", avatar: "NÉ" },
  { id: "u3", name: "Szabó Péter", role: "inspector", pin: "3456", avatar: "SP" },
  { id: "u4", name: "Horváth Gábor", role: "manager", pin: "9999", avatar: "HG" }
];

// QR kódok (demo: a szkenner ezeket fogadja el manuális bevitelben is)
const QR_CODES = {
  "QR-VALTO-04X-2026-001": "VALTO-04X",
  "QR-RELAY-BB2-2026-042": "RELAY-BB2",
  "QR-VALTO-07D-2026-015": "VALTO-07D",
  // Rövid kódok a gyors demo teszteléshez:
  "V04X": "VALTO-04X",
  "RBB2": "RELAY-BB2",
  "V07D": "VALTO-07D"
};
