# OET Lab — plan aplikacji

Stan: **plan do zatwierdzenia** · 25.09.2026 · decyzje i uzasadnienia: [DECISIONS.md](DECISIONS.md)

Oznaczenia: ✅ ustalone z użytkownikiem · ❓ otwarte, niekrytyczne

**Stan realizacji (25.09.2026):** M0 ✅ — aplikacja działa pod https://kkorzeniowski85.github.io/oet-lab/ (0.3: instalację na S23
sprawdzasz Ty) · M1 ✅ — 1.2 czeka na Twój przegląd przypisań do grup · 1.7 test głosu na S23 · M2 ✅ — pobranie kopii
na S23 do sprawdzenia przez Ciebie · M3 ✅ (wersja 0.3.0) — przypadki Writing i karty role-play czekają na Twoją
weryfikację kliniczną · M4 następny

---

## 1. Cel

Aplikacja do przygotowania do egzaminu **OET (Medicine)**, podzielona na sekcje jak egzamin.
Zbiera zwroty, sposoby pisania i mówienia oraz daje ćwiczenia interaktywne. Działa na telefonie
(Galaxy S23) i na komputerach z Windows. Horyzont: kilka miesięcy, data egzaminu nieustalona.

## 2. Co już istnieje

- Folder `APLIKACJE\OET exam` był pusty.
- **Fiszki** (`Mój dysk\aplikacja fiszki`, repo `kkorzeniowski85/projekt-os-03`, działa na GitHub Pages):
  Next.js 16 + React 19 + Tailwind, PWA bez serwera, dane w IndexedDB, powtórki FSRS-6, testy Vitest,
  wdrożenie przez GitHub Actions. Treść: ok. 305 fiszek OET w 5 plikach (`oet-core` — zwroty do listu,
  `oet-skroty` — 76 skrótów klinicznych, `oet-nhs`, `oet-codziennosc`, `oet-terminologia`).
  Writing i Speaking są tam wspierane tylko przyciskiem, który kopiuje instrukcję oceny listu do czatu.
- **Co przenosimy z Fiszek:** `speech.ts` (głos en-GB, działa offline), wzorce z `backup.ts` i `phrase.ts`, opublikowaną treść słownika jako materiał startowy
  (`frontend/public/slownik/*.json`, już publiczna), format `fiszki/v1` jako format wysyłki do Fiszek.
- **Czego nie przenosimy:** Next.js, backend FastAPI, silnik FSRS (Fiszki zostają obok — ✅ D1).

## 3. Specyfikacja

### 3.1 Funkcjonalne — MVP ✅

**Struktura**
- Sekcje: **Listening, Reading, Writing, Speaking** + przekrojowe **Vocabulary** i **Abbreviations**.
- W każdej sekcji zakładki: **Material** (zwroty, wzory, zasady), **Practice** (ćwiczenia), **My notes**.
- Ekran startowy: skróty do sekcji, ostatnie listy, zwroty do przećwiczenia.

**Writing**
- Bank zwrotów listu według części: opening, purpose, history, findings, request, closing, łączniki, rejestr formalny.
- Wzory listów (fikcyjne przypadki) z zaznaczonymi zwrotami z banku.
- 6 kryteriów oceny z objaśnieniem i progami na B.
- **Timed Writing:** przypadek z banku (10–15 fikcyjnych) albo wklejony własny → **5 min czytania**
  (edytor zablokowany) → **40 min pisania** z licznikiem słów (cel 180–200) → checklista samooceny →
  **Copy evaluation prompt** → wklejenie oceny z czatu Claude → zapis przy liście.
- Historia listów: data, czas, liczba słów, ocena.

**Speaking**
- Bank zwrotów według etapu rozmowy: opening, gathering information, explaining, empathy, negotiating a plan, closing.
- Karty role-play (fikcyjne) z zegarem 5 min i checklistą samooceny.

**Listening i Reading** — Material i My notes: strategie dla części A/B/C, typowe pułapki. Bez nagrań i tekstów testowych.

**Vocabulary** — skrót do Fiszek; z dowolnego zwrotu **Send to Fiszki** (`fiszki/v1`); lista wysłanych.

**Abbreviations** — bank skrótów klinicznych w grupach, z oznaczeniem „nie używać w liście”.

**Ćwiczenia** — **Gap-fill** (luka w zdaniu przykładowym, wpisz albo wybierz; wyniki zapisywane; filtr „słabe”) i Timed Writing.

**Treść**
- Pakiet wbudowany: pliki JSON w repozytorium, przygotowywane z Tobą w Claude Code; docierają
  z nową wersją aplikacji i nie ruszają Twojego postępu.
- **Quick add:** własny zwrot lub notatka do wybranej sekcji.

**Dane i przenoszenie**
- Wszystko lokalnie w przeglądarce urządzenia, bez serwera i bez kont.
- **Send progress** (telefon: Udostępnij; komputer: pobranie) → na drugim urządzeniu **Import (merge)**:
  dokłada brakujące, przy konflikcie wygrywa nowsza wersja, ponowny import tego samego pliku niczego nie zmienia.
  Odbiór na Androidzie także przez „Udostępnij → OET Lab”.
- Pełna kopia „wszystko albo nic” + przypomnienie o kopii.
- Ostrzeżenie „fictional cases only — never real patient data” przy pisaniu listu i dodawaniu notatek.

### 3.2 Później ✅
Ćwiczenie „colloquial → formal” · nagranie siebie z odsłuchem przy role-play · quiz ze skrótów ·
własne fiszki z powtórkami (tylko jeśli Fiszki obok zaczną przeszkadzać).
❓ Do decyzji: kolejne gotowe prompty do czatu Claude (bez API), np. role-play do trybu głosowego aplikacji
Claude albo podsumowanie postępów do analizy.

### 3.3 Niefunkcjonalne ✅
- **Platformy:** Chrome na Androidzie (S23), Chrome/Edge na Windows (oba komputery); PWA instalowalna; iOS pomijamy.
- **Offline:** po pierwszym otwarciu wszystko działa bez sieci. Sieć jest potrzebna tylko do pobrania nowej wersji.
  Aplikacja nie łączy się z żadną usługą zewnętrzną.
- **Hosting:** statyczny, GitHub Pages, publiczne repo, wdrożenie automatyczne po pushu, testy przed wdrożeniem.
- **Interfejs:** po angielsku (✅ D12), prosty język; telefon to ekran główny, komputer wykorzystuje szerokość
  (przy pisaniu listu notatki obok edytora); motyw jasny/ciemny według systemu.
- **Wydajność:** start poniżej 2 s na telefonie; skala: setki zwrotów, dziesiątki listów.
- **Trwałość:** dane są tak trwałe jak profil Chrome, dlatego kopia i przypomnienia to funkcje pierwszej klasy;
  scalanie jest idempotentne i przetestowane.
- **Bezpieczeństwo:** zero sekretów w repozytorium; tekst użytkownika zawsze renderowany bezpiecznie
  (zakaz `dangerouslySetInnerHTML`); Content-Security-Policy w `<meta>`.
- **Utrzymanie:** treść walidowana testem przy każdym wdrożeniu; testy logiki (scalanie, import/eksport,
  gap-fill, licznik słów, zegar); ręczna weryfikacja w przeglądarce i na S23 po każdym kamieniu milowym.

### 3.4 Poza zakresem ✅
Chmura i automatyczna synchronizacja · konta i logowanie · aplikacje natywne · oficjalne testy, nagrania
i teksty OET (prawa autorskie) · ocena wymowy · własny system powtórek w MVP · przenoszenie danych z Fiszek · iOS ·
**wywołania Claude API i innych płatnych usług AI z aplikacji** (D16).

### 3.5 Założenia i ich weryfikacja

| # | Założenie | Stan |
|---|---|---|
| Z1 | Struktura OET | **Sprawdzone na oet.com (25.09.2026):** Listening ok. 40 min, 42 pkt (A 24, B 6, C 12), w części A dokładnie te słowa, które słychać. Reading 60 min, 42 pkt (A 20 w sztywne 15 min, B 6, C 16), skróty niedozwolone, jeśli nie ma ich w tekście. B ≈ 30/42. Writing: 5 min czytania + 40 min pisania, 180–200 słów bez automatycznej kary, 6 kryteriów; na B 2/3 za Purpose i 5/7 za pozostałe. Speaking: ok. 20 min, 2 role-play po ok. 5 min, kryteria językowe i kliniczno-komunikacyjne; na B głównie 5/6 i 2/3. Nazwy i skale kryteriów Writing i Speaking potwierdzone z oficjalnych PDF-ów (M1); format części B i C z oficjalnych poradników OET. **Niesprawdzone:** czas przygotowania do role-play |
| Z2 | Wersja egzaminu: Medicine, przypadki pod lekarza z domieszką radiologii | założenie |
| Z3 | Treść startową banków można zbudować z Twoich talii Fiszek | założenie; mapowanie przejrzysz w kroku 1.2 |
| Z4 | Postęp w gap-fill to proste liczniki, bez algorytmu powtórek | założenie |
| Z5 | Motyw według ustawień systemu | założenie |
| Z6 | Treść wbudowana tylko do odczytu; własne dodatki obok | założenie |
| Z7 | Brak innych materiałów startowych (trackery, PDF-y) | założenie; jeśli są — podasz ścieżki |
| Z8 | Laptop ma Node i git (potrzebne do pracy nad kodem, nie do używania aplikacji) | do sprawdzenia przy pierwszej pracy na laptopie |

### 3.6 Otwarte, niekrytyczne ❓
- Nazwa: **OET Lab** (przyjęta roboczo).
- Wygląd: duch minimalistyczny jak w Fiszkach, nowa paleta, żeby na telefonie od razu odróżnić aplikacje.
- Czytanie zwrotów na głos w MVP — tak (tanie, moduł jest gotowy).

---

## 4. Architektura

### 4.1 Warianty (skrót) ✅

| Wariant | Werdykt |
|---|---|
| A. Stos Fiszek (Next.js 16, eksport statyczny) | odrzucony: framework serwerowy bez serwera, ręczny service worker |
| **B. Vite + React + TypeScript + vite-plugin-pwa** | **wybrany** |
| C. Bez frameworka (HTML/JS) | odrzucony: najwięcej własnego kodu, najsłabsze testy |

Uzasadnienie: [DECISIONS.md → D5](DECISIONS.md).

### 4.2 Stos — wersje sprawdzone w rejestrze npm 25.09.2026 ✅

| Rola | Pakiet | Wersja |
|---|---|---|
| budowanie | `vite`, `@vitejs/plugin-react` | 8.3.1, 6.1.1 |
| interfejs | `react`, `react-dom`, `@types/react` | 19.3.0 |
| język | `typescript` | **6.0.3** (nie 7.x — D6) |
| wygląd | `tailwindcss`, `@tailwindcss/vite` | 4.3.3 |
| PWA | `vite-plugin-pwa` (Workbox 7.4), strategia `injectManifest` | 1.3.0 |
| nawigacja | `wouter` (`wouter/use-hash-location`) | 3.11.0 |
| baza | `idb` | 8.0.3 |
| testy | `vitest`, `fake-indexeddb` | 5.0.1, 6.2.5 |
| lint | `eslint`, `typescript-eslint` (obsługuje TS < 6.1) | 9.x/10.x, 8.70.1 |

Zgodność sprawdzona: wtyczki PWA, Tailwind, React i Vitest deklarują obsługę Vite 8; Vite wymaga Node
^20.19 lub ≥22.12 (lokalnie 24.17 ✓). Wersje przypinamy dokładnie w `package.json`.

### 4.3 Moduły

```
content/                  treść wbudowana (JSON), źródło prawdy, w repo
src/
  app/                    układ, nawigacja, ekran startowy, baner nowej wersji
  sections/               listening, reading, writing, speaking, vocabulary, abbreviations
  features/
    timed-writing/        fazy 5+40, edytor, autozapis, licznik słów, samoocena, prompt oceny
    gapfill/              silnik luk (czysta funkcja) + ekran
    roleplay/             karta, zegar, samoocena
    notes/  quick-add/    własne notatki i zwroty
    backup/  transfer/    kopia, eksport, scalanie, Udostępnij, odbiór pliku
    fiszki-export/        wysyłka do Fiszek (fiszki/v1)
  content/                wczytywanie, typy i walidacja treści
  data/                   baza (idb), repozytoria, merge.ts
  lib/                    speech.ts, wordcount, time, share, prompt
  sw.ts                   service worker: offline, aktualizacje, odbiór plików
```

### 4.4 Model danych

**Treść wbudowana** (`content/*.json`, tylko do odczytu, każdy element ma stały `id`):

| Typ | Pola kluczowe |
|---|---|
| `Phrase` | id, section, group, en, pl, examples[], register, formal?, tags |
| `Abbreviation` | id, abbr, expansion, pl?, group, avoidInLetter |
| `WritingCase` | id, title, recipient, task, notes[{heading, lines[]}], modelLetter? (znaczniki zwrotów), tags |
| `RolePlay` | id, title, setting, candidateCard[], otherPartyCard[], focusPhraseIds[] |
| `Guide` | id, section, part?, title, blocks[] (akapity, listy — bez HTML) |
| `Criterion` | id, subtest, name, scaleMax, bThreshold, description, checklist[] |

**Dane użytkownika** (IndexedDB `oet-lab`, wersja 1). Każdy rekord ma `id` (UUID) i `updatedAt`, a rekord edytowalny także `deletedAt?`:

| Magazyn | Zawartość | Scalanie |
|---|---|---|
| `letters` | przypadek, tekst, faza, znaczniki czasu, słowa, samoocena, ocena wklejona z czatu | nowsza wersja wygrywa |
| `customCases`, `notes`, `customPhrases` | własne przypadki, notatki, zwroty | nowsza wersja wygrywa |
| `roleplaySessions` | karta, czas, samoocena | nowsza wersja wygrywa |
| `attempts` | gap-fill: element, wynik, odpowiedź, czas | suma bez duplikatów |
| `fiszkiExports` | dziennik wysyłek do Fiszek | suma bez duplikatów |
| `settings` | nazwa urządzenia, daty kopii, preferencje | **nie jest przenoszone** |
| `snapshots` | migawka sprzed ostatniego importu (Undo) | nie jest przenoszone |

### 4.5 Plik przenoszenia i scalanie ✅

- Format: `{ format: "oet-lab/v1", schema: 1, exportedAt, device, data: {…magazyny…} }`.
- Ten sam plik ma dwie akcje: **Import (merge)** i **Restore (replace all)**.
- Rozszerzenie: przez Udostępnij `.txt` (Chrome nie udostępnia `.json`), przy pobraniu `.json`; import przyjmuje oba (D4).
- Scalanie to czysta funkcja `merge(local, incoming)`:
  - rekord edytowalny: wygrywa większy `updatedAt`; przy remisie rozstrzyga deterministyczne porównanie treści,
    więc oba urządzenia dochodzą do tego samego stanu;
  - usunięcie przechodzi jako rekord z `deletedAt` (znacznik usunięcia, ukryty w interfejsie);
  - dzienniki: suma po `id`;
  - plik z wyższym `schema` → odmowa z wyjaśnieniem.
- Przed scaleniem migawka stanu → przycisk **Undo last import**. Po scaleniu raport: dodano / zaktualizowano / bez zmian.

### 4.6 Przepływ danych

1. **Treść:** `content/*.json` → test integralności → budowanie → GitHub Pages → service worker zapisuje całość → offline.
2. **Praca:** ekran = treść wbudowana + Twoje dane z IndexedDB; zapis od razu, szkic listu co kilka sekund.
3. **Przeniesienie:** Send progress → plik → drugie urządzenie → scalenie → raport.
4. **Ocena listu:** Copy evaluation prompt → czat Claude (Twoja subskrypcja) → wklejenie wyniku.
5. **Fiszki:** wybrane zwroty → `fiszki/v1` → Udostępnij jako tekst (tak Fiszki przyjmują dziś) albo pobranie przy dużej partii.

### 4.7 Zależności zewnętrzne
GitHub (repo, Actions, Pages) i Twój czat Claude (kopiuj–wklej). Nic więcej: żadnych kont, API ani analityki.

### 4.8 Ryzyka

| Ryzyko | Zabezpieczenie |
|---|---|
| Utrata danych po wyczyszczeniu przeglądarki | `navigator.storage.persist()`, przypomnienie o kopii, eksport jednym przyciskiem; kopia już w M2 |
| Błąd scalania psuje dane | czysta funkcja z testami (idempotencja, niezależność od kolejności, usunięcia), migawka Undo, raport |
| Utrata listu w trakcie pisania | autozapis co kilka sekund; zegar liczony ze znaczników czasu (przeżyje uśpienie telefonu); aktualizacja tylko po kliknięciu |
| Złe zegary urządzeń | akceptowalne (zegary synchronizowane z siecią); raport pokazuje nadpisania |
| Udostępnianie plików działa różnie na różnych urządzeniach | wybór pliku działa zawsze; Udostępnij to wygoda; test na S23 i Windows |
| Jakość i legalność treści | wyłącznie własne, fikcyjne przypadki; weryfikujesz wiarygodność kliniczną |
| Narzędzia się rozjeżdżają (TS 7, duże wersje) | przypięte wersje; aktualizacje świadomie, jako osobny krok |
| 21 tys. plików `node_modules` na Google Drive | kod poza Drive: `D:\OET-Lab` (D10) |

---

## 5. Claude w aplikacji — rozważone i odrzucone

Integracja Claude'a w aplikacji (ocena listu, rozmowa z pacjentem, trener) wymagałaby płatnego Claude API.
Subskrypcja Claude go nie obejmuje. **Użytkownik zrezygnował 25.09.2026** (D16).

Zostaje droga bez API: aplikacja przygotowuje gotowy prompt (**Copy evaluation prompt**), Ty wklejasz go do czatu
Claude w ramach subskrypcji, a wynik wklejasz z powrotem do aplikacji.

---

## 6. Plan realizacji

**Zasady pracy**
- Każdy krok to osobny, mały commit z testem lub opisaną ręczną weryfikacją.
- Testy uruchamiają się przed każdym wdrożeniem; czerwony test zatrzymuje wdrożenie.
- Po każdym kamieniu milowym: sprawdzenie w przeglądarce (szerokość telefonu i komputera) i na S23.
- Nie zaczynam M0 bez Twojej wyraźnej zgody.
- Wysłanie zmian na GitHub (= nowa wersja na telefonie) po każdym kamieniu milowym, za Twoją zgodą (D18).

### M0 — Fundament: działająca pusta aplikacja w sieci

**0.1 Repozytorium i narzędzia**
- Cel: projekt Vite + React + TS z przypiętymi wersjami, Tailwind, Vitest, ESLint.
- Pliki: `D:\OET-Lab\` — `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `src/main.tsx`, `.gitignore`, `README.md`.
- Akceptacja: `npm run dev` pokazuje stronę; `npm test`, `npm run lint` i `npm run build` przechodzą.
- Weryfikacja: polecenia w terminalu + podgląd w przeglądarce.

**0.2 GitHub i wdrożenie** ✅ 25.09.2026: publiczne repo i Pages; zepsuty test na tymczasowej gałęzi zatrzymał wdrożenie (D18)
- Cel: repo `oet-lab`, workflow: testy → budowanie → Pages (`base: /oet-lab/`).
- Pliki: `.github/workflows/deploy.yml`, `vite.config.ts`.
- Akceptacja: push na `main` publikuje stronę pod `kkorzeniowski85.github.io/oet-lab`; czerwony test blokuje wdrożenie.
- Weryfikacja: otwarcie adresu na PC i S23; celowo zepsuty test → wdrożenie nie rusza.

**0.3 PWA: instalacja, offline, aktualizacje**
- Cel: manifest, ikony, service worker (`injectManifest`), baner „New version available — Reload”.
- Pliki: `src/sw.ts`, `public/manifest` (przez wtyczkę), `src/app/UpdateBanner.tsx`, CSP w `index.html`.
- Akceptacja: instalacja na S23 i w Chrome na Windows; tryb samolotowy → działa; nowe wdrożenie pokazuje baner i **nie** przeładowuje strony samo.
- Weryfikacja: ręcznie na S23 i PC.

**0.4 Szkielet nawigacji**
- Cel: nawigacja `#/…`, dolny pasek na telefonie i boczny na komputerze, 6 sekcji × 3 zakładki (puste), Home, Settings; interfejs po angielsku; motyw jasny/ciemny.
- Pliki: `src/app/*`, `src/sections/*/index.tsx`.
- Akceptacja: każda trasa działa, przycisk Wstecz działa, link `#/writing/practice` otwiera właściwy ekran; szerokość 360 px bez przewijania w bok.
- Weryfikacja: test tras + podgląd w przeglądarce przy szerokości telefonu i komputera.

**0.5 Porządek w dokumentach** (zgoda 25.09.2026)
- Cel: PLAN.md i DECISIONS.md przenoszą się do repo (`docs/`); w folderze `APLIKACJE\OET exam` na Drive zostaje README ze wskazaniem, gdzie jest kod; wiersz „OET Lab” w tabeli w `APLIKACJE\CLAUDE.md`; `CLAUDE.md` w repo z kluczowymi zasadami (sesje otwarte w `D:\OET-Lab` nie widzą pliku z Drive); `.claude/launch.json` do podglądu.
- Akceptacja: jedno źródło prawdy dla planu (repo), bez duplikatów.
- Weryfikacja: przegląd plików.

### M1 — Treść i przeglądanie (zakładki Material)

**Wykonanie (25.09.2026) — różnice względem opisu kroków:**
- 1.1: typy przypadków Writing i kart role-play oraz sprawdzenie „zwrot występuje w zdaniu z luką” przeniesione do M3, gdzie powstają przypadki i gap-fill.
- 1.2: `oet-core` i `oet-terminologia` → Writing (49), Speaking (16), Vocabulary (78); `oet-codziennosc` i `oet-nhs` → Vocabulary („Everyday British English”, „Hospital talk”), a nie Speaking. Dopisane 15 zwrotów Speaking ze źródłem `oet-lab` (brakowało otwarcia rozmowy). Przegląd: `przeglad-grup.md` wysłany 25.09.2026.
- 1.3–1.5: Vocabulary też dostało bank zwrotów. Źródło każdego faktu o egzaminie jest przy nim w aplikacji (D20), nie w DECISIONS.md.
- 1.6: zamiast etykiety „nie używać w liście” — zasada z oficjalnych kryteriów (D19).
- 1.7: na komputerze stacjonarnym podgląd ma tylko polskie głosy, więc przycisk jest ukryty (tak ma działać). Głos en-GB sprawdzimy na S23 po publikacji.

**1.1 Schemat treści i walidacja**
- Cel: typy TS dla 6 rodzajów treści, wczytywanie, test integralności (unikalne `id`, wymagane pola, istniejące odwołania, zwrot faktycznie występuje w zdaniu z luką).
- Pliki: `src/content/types.ts`, `src/content/load.ts`, `src/content/integrity.test.ts`, `content/*.json` (próbka).
- Akceptacja: celowo zepsuty plik → czerwony test → wdrożenie zablokowane.
- Weryfikacja: test automatyczny.

**1.2 Treść startowa z Fiszek**
- Cel: skrypt przenosi zwroty (`oet-core` → Writing, część `oet-nhs`/`oet-codziennosc` → Speaking), skróty (`oet-skroty`) i przykłady; raport pozycji nieprzypisanych.
- Pliki: `scripts/import-fiszki.mjs`, `content/phrases.*.json`, `content/abbreviations.json`.
- Akceptacja: test integralności przechodzi; raport nieprzypisanych jest pusty albo przejrzany przez Ciebie.
- Weryfikacja: przeglądasz próbkę 20 pozycji i przypisanie grup.

**1.3 Writing → Material**
- Cel: bank zwrotów według grup z wyszukiwaniem (EN i PL), strona 6 kryteriów z progami na B, przewodnik po strukturze listu.
- Pliki: `src/sections/writing/*`, `content/criteria.json`, `content/guides.writing.json`.
- Akceptacja: wyszukiwanie znajduje zwrot po angielsku i po polsku; wygodne na telefonie.
- Weryfikacja: podgląd w przeglądarce + S23.

**1.4 Speaking → Material**
- Cel: zwroty według etapu rozmowy; kryteria (nazwy **potwierdzone z oficjalnego PDF** — domyka założenie Z1); przewodnik po formacie role-play.
- Pliki: `src/sections/speaking/*`, `content/phrases.speaking.json`, `content/criteria.json`.
- Akceptacja: nazwy kryteriów zgodne ze źródłem; źródło wpisane do DECISIONS.md.
- Weryfikacja: porównanie z PDF + podgląd.

**1.5 Listening i Reading → Material**
- Cel: strategie dla części A/B/C na podstawie sprawdzonych faktów (punkty, dokładne słowa w Listening A, pisownia, skróty w Reading).
- Pliki: `content/guides.listening.json`, `content/guides.reading.json`, `src/sections/{listening,reading}/*`.
- Akceptacja: każda informacja o formacie ma źródło w DECISIONS.md.
- Weryfikacja: przegląd treści przez Ciebie.

**1.6 Abbreviations**
- Cel: skróty w grupach, wyszukiwanie, zasada użycia skrótów w liście i w Reading (D19).
- Pliki: `src/sections/abbreviations/*`.
- Akceptacja: wszystkie 76 skrótów widoczne i wyszukiwalne.
- Weryfikacja: podgląd.

**1.7 Czytanie na głos**
- Cel: przycisk odtwarzania przy zwrocie i przykładzie (moduł `speech.ts` z Fiszek).
- Pliki: `src/lib/speech.ts`.
- Akceptacja: głos en-GB na S23 w trybie samolotowym; bez dostępnego głosu przycisk znika, a aplikacja nie wysypuje się.
- Weryfikacja: ręcznie na S23 i PC.

### M2 — Twoje dane: baza, notatki, kopia

**Wykonanie (25.09.2026) — różnice względem opisu kroków:**
- 2.1: baza ma na razie magazyny `notes`, `customPhrases` i `settings`. Pozostałe (`letters`, `attempts` itd.) dojdą razem z funkcjami, które ich używają, w kolejnych wersjach bazy z przetestowaną migracją.
- 2.3: przycisk „+ Add” dodaje zwrot albo notatkę. Stan otwarcia okna trzyma sam element `<dialog>` — wersja z kopią stanu w React przestawała działać po zamknięciu klawiszem Esc lub gestem Wstecz.
- 2.4: kopia zawiera też znaczniki usunięć (potrzebne w M4). Pobranie sprawdzone w przeglądarce z przechwyceniem pliku; zapis do „Pobranych” na S23 sprawdzasz Ty.

**2.1 Warstwa danych**
- Cel: baza IndexedDB z magazynami z 4.4, repozytoria, konwencja `id`/`updatedAt`/`deletedAt`, prośba o trwałe przechowywanie.
- Pliki: `src/data/db.ts`, `src/data/repos/*.ts`, testy z `fake-indexeddb`.
- Akceptacja: zapis, odczyt, miękkie usunięcie i lista działają w testach.
- Weryfikacja: testy automatyczne.

**2.2 My notes**
- Cel: notatki w każdej sekcji: dodaj, edytuj, usuń, szukaj; ostrzeżenie „fictional only”.
- Pliki: `src/features/notes/*`.
- Akceptacja: notatka przeżywa przeładowanie i restart telefonu.
- Weryfikacja: ręcznie + test repozytorium.

**2.3 Quick add**
- Cel: własny zwrot (sekcja, grupa, EN, PL, przykład) dostępny z każdego ekranu; pojawia się w banku z oznaczeniem „mine”.
- Pliki: `src/features/quick-add/*`.
- Akceptacja: dodany zwrot jest w banku i w wyszukiwaniu.
- Weryfikacja: ręcznie.

**2.4 Kopia zapasowa (wszystko albo nic)**
- Cel: eksport całości do pliku i przywrócenie z potwierdzeniem; przypomnienie po 7 dniach bez kopii. Ustawienia urządzenia nie trafiają do pliku.
- Pliki: `src/features/backup/*`, `src/data/exportFormat.ts`.
- Akceptacja: eksport → wyczyszczenie danych → przywrócenie = identyczny stan; plik z wyższym `schema` odrzucony z wyjaśnieniem.
- Weryfikacja: test automatyczny „w tę i z powrotem” + ręcznie na S23.

### M3 — Ćwiczenia

**Wykonanie (25.09.2026) — różnice względem opisu kroków:**
- Zakładka Practice jest tylko w Writing, Speaking i Vocabulary; Listening, Reading i Abbreviations mają Material i My notes.
- Baza w wersji 2 (magazyny `letters`, `customCases`, `attempts`, `roleplaySessions`); migrację z wersji 1 sprawdza test i przejście aktualizacji w przeglądarce na danych z M2.
- 3.1: luka wychodzi w 240 z 244 zwrotów (odmiana czasowników, a/an/the, „someone”, wielokropek jako miejsce na słowa); reszta nie trafia do ćwiczenia. Do wpisywania tylko odpowiedzi do 6 słów, dłuższe w trybie wyboru.
- 3.4 i 3.5 w jednym commicie. Writing → Practice otwiera się na Timed writing; każdy list ma swój adres (`#/writing/practice/letters/<id>`). Prompt oceny pozwala wybrać język odpowiedzi (angielski/polski); gdy schowek jest zablokowany, pokazuje tekst do ręcznego skopiowania.
- 3.6: 3 minuty przygotowania to ustawienie ćwiczenia, nie informacja o egzaminie (niesprawdzone, Z1). Sesja zapisuje się po zakończeniu, nie w trakcie.
- Treść do przejrzenia przez Ciebie: `przypadki-writing.md` i `karty-roleplay.md` (wysłane 25.09.2026).

**3.1 Silnik gap-fill**
- Cel: wybór zdania, luka w miejscu zwrotu, sprawdzanie odpowiedzi (bez względu na wielkość liter, interpunkcję i spacje; pokazanie różnicy).
- Pliki: `src/features/gapfill/engine.ts` + testy.
- Akceptacja: testy na zwrotach wielowyrazowych, z apostrofem i z ukośnikiem.
- Weryfikacja: testy automatyczne.

**3.2 Gap-fill — ekran**
- Cel: runda 10 pozycji z sekcji/grupy albo „weak” (skuteczność poniżej 70%); wpisywanie albo 4 opcje; podsumowanie; zapis prób.
- Pliki: `src/features/gapfill/*`.
- Akceptacja: „weak” wybiera faktycznie słabe pozycje; wyniki widoczne w podsumowaniu.
- Weryfikacja: ręcznie + test wyboru słabych.

**3.3 Przypadki do Writing (treść)**
- Cel: 10–15 fikcyjnych przypadków (Medicine, część radiologicznych): adresat, zadanie, notatki; część z wzorem listu.
- Pliki: `content/writing-cases.json`.
- Akceptacja: test integralności przechodzi; każdy przypadek przejrzany przez Ciebie pod kątem wiarygodności klinicznej.
- Weryfikacja: Twój przegląd.

**3.4 Timed Writing — pisanie**
- Cel: wybór przypadku → 5 min czytania (edytor zablokowany) → 40 min pisania; licznik słów na żywo; autozapis co 5 s; zakończenie wcześniej; na komputerze notatki obok edytora.
- Pliki: `src/features/timed-writing/*`, `src/lib/wordcount.ts`, `src/lib/time.ts`.
- Akceptacja: przeładowanie w trakcie przywraca tekst i właściwy stan zegara; uśpienie telefonu na 5 min nie psuje zegara; licznik słów zgodny z testami.
- Weryfikacja: testy (licznik, zegar) + ręcznie na S23.

**3.5 Timed Writing — po napisaniu**
- Cel: checklista 6 kryteriów, **Copy evaluation prompt** (list + notatki + kryteria), wklejenie oceny, historia listów; wklejenie własnego przypadku.
- Pliki: `src/features/timed-writing/*`, `src/lib/prompt.ts`.
- Akceptacja: prompt zawiera list, notatki i kryteria; ocena zapisuje się przy liście; historia sortuje się po dacie.
- Weryfikacja: test budowania promptu + próba z czatem Claude.

**3.6 Role-play bez AI**
- Cel: karta, zegar przygotowania, zegar 5 min, samoocena; 10 fikcyjnych kart w treści.
- Pliki: `src/features/roleplay/*`, `content/roleplays.json`.
- Akceptacja: sesja zapisuje się w historii.
- Weryfikacja: ręcznie.

### M4 — Przenoszenie między urządzeniami

**4.1 Scalanie**
- Cel: czysta funkcja `merge` według 4.5.
- Pliki: `src/data/merge.ts` + testy.
- Akceptacja: testy idempotencji (A+B+B = A+B), niezależności od kolejności, usunięć, remisów, dzienników i odmowy nowszego schematu.
- Weryfikacja: testy automatyczne.

**4.2 Import ze scaleniem**
- Cel: wybór pliku (`.json`/`.txt`), podgląd raportu, zastosowanie, migawka i **Undo last import**.
- Pliki: `src/features/transfer/*`.
- Akceptacja: import na „czystym” urządzeniu = kopia; ponowny import = „bez zmian”; Undo przywraca stan sprzed importu.
- Weryfikacja: testy + ręcznie PC ↔ S23.

**4.3 Send progress**
- Cel: telefon: Udostępnij (`.txt`); komputer: pobranie (`.json`); gdy Udostępnij niedostępne — pobranie.
- Pliki: `src/lib/share.ts`, `src/features/transfer/*`.
- Akceptacja: plik wysłany Gmailem lub przez Drive z S23 wczytuje się na PC i odwrotnie.
- Weryfikacja: ręcznie, pełny obieg w obie strony.

**4.4 Odbiór przez „Udostępnij → OET Lab”**
- Cel: `share_target` z plikiem (POST) obsłużony w `sw.ts` → ekran importu.
- Pliki: `src/sw.ts`, manifest.
- Akceptacja: na S23 z Gmaila/Drive „Udostępnij → OET Lab” otwiera import z plikiem.
- Weryfikacja: ręcznie na S23 (zainstalowana aplikacja).

**4.5 Send to Fiszki**
- Cel: wybór zwrotów → `fiszki/v1` → Udostępnij jako tekst do Fiszek; przy większej partii pobranie pliku; dziennik wysyłek.
- Pliki: `src/features/fiszki-export/*`.
- Akceptacja: Fiszki na S23 otwierają import z przesłanymi zwrotami; test zgodności z formatem `fiszki/v1`.
- Weryfikacja: test + ręcznie na S23.

### Po M4 (lista „później”)
Colloquial → formal · quiz ze skrótów · nagranie siebie z odsłuchem · kolejne pakiety treści ·
ewentualnie kolejne prompty do czatu Claude (❓ 3.2).

---

## 7. Źródła

- OET: [Writing](https://oet.com/ready/writing), [Speaking](https://oet.com/ready/speaking), [Listening](https://oet.com/ready/listening), [Reading](https://oet.com/ready/reading)
- MDN: [navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share), [share_target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- vite-plugin-pwa: [prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html), [React](https://vite-pwa-org.netlify.app/frameworks/react.html), [injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest.html)
- Anthropic: [subskrypcja a API](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console) (powód D16)
- Google Drive: [brak wykluczeń według wzorca](https://discuss.google.dev/t/ability-to-exclude-specific-subfolders-from-google-drive-for-desktop-sync/257296)
- Wersje pakietów: rejestr npm (`npm view`), 25.09.2026
