# OET Lab — decyzje

Kluczowe decyzje z uzasadnieniem. Plan: [PLAN.md](PLAN.md).
Status: **przyjęta** (potwierdzona przez użytkownika) · **propozycja** (czeka na decyzję) · **zastąpiona**.

---

### D1 — Nowa aplikacja obok Fiszek, nie zamiast
**Status:** przyjęta, 25.09.2026
- **Decyzja:** OET Lab to osobna aplikacja. Fiszki dalej służą do powtórek słówek; OET Lab nie ma własnego systemu powtórek, tylko wysyła zwroty do Fiszek.
- **Dlaczego:** Fiszki działają i mają sprawdzony silnik powtórek. Przepisywanie go do nowej aplikacji dałoby dwa miejsca z tym samym celem.
- **Konsekwencja:** brak przenoszenia danych z Fiszek; integracja przez format `fiszki/v1` (D14).

### D2 — Wszystko lokalnie, bez chmury; przenoszenie plikiem
**Status:** przyjęta, 25.09.2026 (zastępuje wcześniejszą propozycję Firebase)
- **Decyzja:** dane żyją w przeglądarce każdego urządzenia (IndexedDB). Między telefonem a komputerem przenosisz je ręcznie plikiem, ze **scalaniem** zamiast nadpisywania.
- **Dlaczego:** użytkownik nie chce chmury ani kont. Scalanie rozwiązuje główną wadę Fiszek („wszystko albo nic”) przy nauce na dwóch urządzeniach.
- **Odrzucone:** Firebase (konto Google, dane u Google), plik na Google Drive przez API (logowanie, słabo działa offline), własny serwer (koszt i utrzymanie — odrzucone już w Fiszkach, ADR 0006).

### D3 — Zasady scalania
**Status:** przyjęta, 25.09.2026
- **Decyzja:** rekordy edytowalne: wygrywa nowszy `updatedAt`, a remis rozstrzyga deterministyczne porównanie treści. Usunięcia przechodzą jako znacznik `deletedAt`. Dzienniki (próby, wysyłki) są sumowane po `id`. Ustawienia urządzenia nie są przenoszone. Przed importem powstaje migawka, więc działa Undo.
- **Dlaczego:** proste, przewidywalne i testowalne. Ponowny import niczego nie zmienia, a kolejność importów nie ma znaczenia. Deterministyczny remis sprawia, że oba urządzenia dochodzą do tego samego stanu.
- **Znane ograniczenie:** zależność od zegarów urządzeń. Akceptowalna, bo zegary synchronizują się z siecią, a raport z importu pokazuje nadpisania.

### D4 — Plik przenoszenia: JSON; `.txt` przy udostępnianiu
**Status:** przyjęta, 25.09.2026
- **Decyzja:** zawartość to zawsze JSON `oet-lab/v1`. Przez systemowe Udostępnij plik ma rozszerzenie `.txt`, przy pobraniu `.json`. Import przyjmuje oba.
- **Dlaczego:** Chrome nie udostępnia plików `.json` przez `navigator.share` (dozwolone są m.in. `.txt`, `.csv`, `.pdf`) — źródło: MDN, `navigator.share`.

### D5 — Stos: Vite + React + TypeScript + vite-plugin-pwa (wariant B)
**Status:** przyjęta, 25.09.2026
- **Decyzja:** Vite 8, React 19, Tailwind 4, `vite-plugin-pwa` (strategia `injectManifest`), `wouter`, `idb`, Vitest.
- **Dlaczego:** narzędzie dopasowane do aplikacji bez serwera. Ten sam React/TS/Tailwind/Vitest co w Fiszkach, więc moduły przechodzą bez przepisywania. Wtyczka PWA generuje service worker i ma tryb „zapytaj przed aktualizacją” (D8).
- **Odrzucone:** A — Next.js jak w Fiszkach: framework serwerowy użyty bez serwera, ręczny service worker, cięższe budowanie. C — bez frameworka: najwięcej własnego kodu i najsłabsze testy, co przy pracy wyłącznie przez Claude'a oznacza więcej błędów.

### D6 — TypeScript 6.0.3, nie 7
**Status:** przyjęta, 25.09.2026
- **Decyzja:** przypinamy `typescript@6.0.3`.
- **Dlaczego:** `typescript-eslint` 8.70.1 obsługuje TypeScript `>=4.8.4 <6.1.0` (npm, 25.09.2026). Wracamy do tematu, gdy narzędzia zaczną obsługiwać TS 7.

### D7 — Adresy z `#` (hash routing)
**Status:** przyjęta, 25.09.2026
- **Decyzja:** `wouter` z `useHashLocation` (adresy typu `#/writing/practice`).
- **Dlaczego:** GitHub Pages nie przekierowuje nieznanych ścieżek na `index.html`. Adres z `#` działa zawsze — przy pierwszym wejściu, po odświeżeniu i offline — bez sztuczek z `404.html`.

### D8 — Aktualizacja tylko po kliknięciu + autozapis
**Status:** przyjęta, 25.09.2026
- **Decyzja:** `registerType: 'prompt'` — nowa wersja pokazuje baner i czeka na kliknięcie. Szkic listu zapisuje się co kilka sekund, a zegar liczy się ze znaczników czasu.
- **Dlaczego:** automatyczne przeładowanie w połowie 40-minutowego listu byłoby najgorszym możliwym błędem tej aplikacji.

### D9 — Treść wbudowana w aplikację, nie kopiowana do bazy
**Status:** przyjęta, 25.09.2026
- **Decyzja:** treść (`content/*.json`) jest częścią aplikacji i aktualizuje się razem z nią. Dane użytkownika odwołują się do treści przez stałe `id`.
- **Dlaczego:** treść jest tylko do odczytu, więc mechanizm z Fiszek (manifest, odciski, dowożenie do IndexedDB — ADR 0007) nie jest potrzebny. Mniej kodu, mniej przypadków brzegowych.
- **Konsekwencja:** `id` treści są niezmienne. Zmiana `id` osierociłaby Twoje wyniki, a test integralności tego pilnuje.

### D10 — Kod poza Google Drive
**Status:** przyjęta, 25.09.2026
- **Decyzja:** repozytorium w `D:\OET-Lab` (komputer stacjonarny) i osobna kopia na laptopie. Oba komputery wymieniają kod przez GitHub. W `APLIKACJE\OET exam` zostaje README ze wskazaniem, gdzie jest kod.
- **Dlaczego:** Google Drive nie potrafi wykluczać folderów według wzorca, a `node_modules` ma ok. 21 tys. plików (pomiar w Fiszkach). To ten sam problem, dla którego CLAUDE.md zabrania `.venv` na Drive.

### D11 — Publiczne repo, wyłącznie własna treść
**Status:** przyjęta, 25.09.2026
- **Decyzja:** repo `oet-lab` jest publiczne (GitHub Pages za darmo). Treść to wyłącznie własne, fikcyjne przypadki i zwroty — bez kopiowania oficjalnych testów, nagrań i tekstów OET.
- **Dlaczego:** prawa autorskie. Poza tym publiczne repo nie może zawierać niczego prywatnego — Twoje dane nigdy nie trafiają do repo.

### D12 — Interfejs po angielsku
**Status:** przyjęta, 25.09.2026 — **świadome odstępstwo** od zasady „interfejs po polsku” z `APLIKACJE\CLAUDE.md`
- **Decyzja:** interfejs po angielsku, prostym językiem. Treść po angielsku (pisownia brytyjska) z krótkimi polskimi objaśnieniami tam, gdzie pomagają. Dokumentacja projektu po polsku.
- **Dlaczego:** decyzja użytkownika — zanurzenie w języku egzaminu.

### D13 — Zero danych pacjentów
**Status:** przyjęta, 25.09.2026
- **Decyzja:** wszystkie przypadki i notatki są fikcyjne. Interfejs przypomina o tym przy pisaniu listu i dodawaniu notatek.
- **Dlaczego:** plik przenoszenia wędruje mailem i przez Drive, a list do oceny trafia do czatu Claude.

### D14 — Integracja z Fiszkami przez `fiszki/v1`
**Status:** przyjęta, 25.09.2026
- **Decyzja:** „Send to Fiszki” tworzy `fiszki/v1` i udostępnia go jako tekst. Fiszki przyjmują udostępniony tekst przez `share_target` (GET, parametr `udostepnione`). Przy dużej partii tworzony jest plik do importu.
- **Dlaczego:** Fiszki już to obsługują — zero zmian po ich stronie.

### D15 — Timed Writing: 5 + 40 minut
**Status:** przyjęta, 25.09.2026
- **Decyzja:** najpierw 5 min czytania z zablokowanym edytorem, potem 40 min pisania; cel 180–200 słów.
- **Źródło:** oet.com/ready/writing (sprawdzone 25.09.2026). Korekta wcześniejszego założenia „45 min ciągiem”.

### D16 — Bez Claude'a w aplikacji; prompty do czatu zamiast API
**Status:** przyjęta, 25.09.2026 — decyzja użytkownika
- **Decyzja:** aplikacja nie łączy się z Claude API ani z żadną płatną usługą AI. Tam, gdzie pomaga Claude (ocena listu), aplikacja przygotowuje gotowy prompt do skopiowania. Użytkownik wkleja go do czatu Claude w ramach subskrypcji, a wynik wkleja z powrotem.
- **Dlaczego:** integracja wymagałaby płatnego Claude API — subskrypcja Claude go nie obejmuje (osobne konto w Console i osobne rozliczenie; źródło: support.claude.com, artykuł 9876003). Użytkownik nie chce tego kosztu ani konfiguracji.
- **Rozważone i odrzucone (25.09.2026):** SDK `@anthropic-ai/sdk` wołane z przeglądarki z własnym kluczem, model Sonnet 5. Miało służyć do oceny listu, rozmowy z pacjentem (mowa przez przeglądarkę, bo API nie przyjmuje dźwięku) i trenera. Szacowany koszt: ok. $5–10 miesięcznie.
- **Konsekwencja:** aplikacja nie ma sekretów ani połączeń z usługami zewnętrznymi. Rozpoznawanie mowy (`listen.ts`) wypada z zakresu, bo służyło rozmowie z Claude'em.

### D17 — Co bierzemy z Fiszek
**Status:** przyjęta, 25.09.2026
- **Decyzja:** przenosimy `speech.ts`, wzorce z `backup.ts` i `phrase.ts` oraz opublikowaną treść słownika jako materiał startowy. Nie przenosimy Next.js, backendu FastAPI, silnika FSRS ani `listen.ts` (D16).
- **Dlaczego:** moduły w czystym TypeScript są przetestowane i niezależne od frameworka.

### D18 — Publikacja: publiczne repo z oczyszczoną historią; wysyłka po każdym etapie za zgodą
**Status:** przyjęta, 25.09.2026 — decyzje użytkownika (najpierw repo prywatne, po M1 upublicznienie)
- **Stan:** repo `kkorzeniowski85/oet-lab` jest publiczne, a aplikacja działa pod https://kkorzeniowski85.github.io/oet-lab/. Nowa wersja trafia na telefon po wysłaniu zmian na GitHub; wysyłam po każdym kamieniu milowym, po zapytaniu.
- **Oczyszczenie przed upublicznieniem:** `CLAUDE.md` zawierał zdanie o prywatnych plikach użytkownika, które nie powinno być publiczne. Historia została przepisana lokalnie, a publiczne repo założone od nowa, bez wymuszonego nadpisania (force push zostawiłby ślad starych commitów w publicznym dzienniku aktywności). Poprzednie prywatne repo przemianowane na `oet-lab-archiwum` — zostaje prywatne; można je usunąć ręcznie w ustawieniach GitHuba.
- **Zasada na przyszłość:** w repo nie opisujemy, co leży na dyskach użytkownika ani gdzie są dane zawodowe.
- **Wdrożenie:** workflow sprawdza lint, testy i budowanie; dopóki repo byłoby prywatne, krok Pages jest pomijany. Blokada sprawdzona 25.09.2026: zepsuty test na tymczasowej gałęzi zatrzymał build, a wdrożenie zostało pominięte.

### D19 — Skróty w liście: zasada z kryteriów zamiast zakazu
**Status:** przyjęta, 25.09.2026 — korekta planu
- **Decyzja:** lista skrótów nie oznacza pozycji jako „nie używać w liście”. Zamiast tego pokazuje dwie zasady ze źródłem: w liście skróty stosuje się na tyle, na ile odbiorca je zrozumie; w Reading skrót jest przyjmowany tylko wtedy, gdy występuje w tekście.
- **Dlaczego:** oficjalne kryteria Writing (Genre & Style) dopuszczają rozsądne użycie skrótów przy lekarzu tej samej dziedziny, a więcej wyjaśnień zalecają przy GP lub innej specjalności. Zakaz, przyjęty wcześniej w Fiszkach, był zbyt mocny i uczyłby nieprawdy.
- **Źródła:** https://cdn-aus.aglty.io/oet/pdf-files/Writing%20assessment%20criteria.pdf · https://oet.com/ready/reading

### D20 — Kryteria i przewodniki: własne słowa, fakty ze źródłem
**Status:** przyjęta, 25.09.2026
- **Decyzja:** opisy kryteriów i przewodniki są napisane własnymi słowami, krócej niż oryginał, z odnośnikiem do oficjalnego PDF. Każde zdanie o formacie egzaminu to w treści blok typu `fact` z adresem źródła, pokazywanym w aplikacji. Porady to osobny typ `tip`, bez udawania faktów. Walidator odrzuca fakt bez źródła.
- **Dlaczego:** oficjalne deskryptory OET są chronione prawem autorskim (repo jest docelowo publiczne — D11). Rozdzielenie faktów od porad pozwala sprawdzić każdą informację o egzaminie.
- **Sprawdzone źródła (25.09.2026):** oet.com/ready/{listening,reading,writing,speaking}; oficjalne PDF-y z kryteriami Writing i Speaking; poradniki OET „The Complete Guide” do Listening A/B/C i Reading A/B/C.
