# Diagnostyka OET Lab — 25.09.2026, wersja 0.4.0

## Werdykt

Aplikacja jest **stabilna, bezpieczna i nadaje się do codziennej nauki**. Nie ma problemów krytycznych ani wysokiej wagi. Do naprawy: **5 błędów średniej wagi w kodzie** (łącznie ok. 2 godziny pracy), kilkanaście drobnych, **5 sprzeczności w przypadkach do Writing** oraz lista wątpliwości w treści, o których zdecydujesz Ty jako lekarz.

## Jak sprawdzałem

| Obszar | Metoda | Wynik |
|---|---|---|
| Kod | 149 testów w 17 plikach, ESLint, TypeScript, budowanie produkcyjne | wszystko przechodzi |
| Zależności | `npm audit` | 0 podatności; wersje przypięte, tylko `vitest` ma nowszą łatkę (5.0.2) |
| Produkcja (github.io) | 24 adresy, service worker, lista plików offline (9), manifest, CSP, pobieranie kopii, `#/transfer/shared` bez pliku, czas ładowania | wszystko działa; 0 błędów w konsoli; DOM gotowy po 19 ms z cache; HTTPS wymuszone |
| Treść | skrypt: wiek vs data urodzenia vs data zadania, daty i adresat we wzorach listów, duplikaty, przykłady, źródła faktów | wzory listów spójne z notatkami; 3 grupy zwrotów zbyt chude |
| Niezależne przeglądy | 4 osobne przeglądy (poprawność, bezpieczeństwo/PWA, treść i angielski, użyteczność/dostępność); każde istotne ustalenie sprawdziłem sam w kodzie lub w JSON | ustalenia poniżej |

Nie dało się sprawdzić bez telefonu: Udostępnij (plik i tekst), „Udostępnij → OET Lab”, głos brytyjski, praca offline na S23, schowek w zainstalowanej aplikacji.

## A. Błędy w kodzie

### Średnie (naprawić w pierwszej kolejności)

**A1. „Discard” może przywrócić usunięty list.** `src/features/timed-writing/LetterSession.tsx:80-94` — jeśli w ciągu ostatnich 0,8 s przed „Discard” coś wpisałeś, licznik autozapisu wciąż żyje. Po usunięciu ekran się zamyka, a sprzątanie (`:69-78`) wywołuje `save()`, który zapisuje list bez znacznika usunięcia (`src/data/records.ts:35-48`). List wraca jako aktywna sesja. Naprawa: przy „Discard” skasować licznik i zablokować zapis; w `saveRecord` nie nadpisywać rekordu, który ma `deletedAt`.

**A2. Podwójne stuknięcie „Start” tworzy dwa listy.** `src/features/timed-writing/TimedWriting.tsx:116,135` — przycisk nie ma blokady; dwa stuknięcia w ułamku sekundy zapisują dwa rekordy. Widać jeden; drugi pojawia się po zakończeniu pierwszego jako pusta sesja. Ten sam efekt daje scalenie pliku z niedokończonym listem z drugiego urządzenia. Naprawa: wyłączyć „Start” na czas zapisu; „Continue writing” z listy ma prowadzić do konkretnego listu (adres z `id`).

**A3. List w toku po usunięciu własnego przypadku — tylko „Discard” bez potwierdzenia.** `TimedWriting.tsx:149-160` — gdy usuniesz własny przypadek, dla którego trwa list, ekran daje wyłącznie „Discard the letter” (bez pytania; do 40 minut pisania przepada). Naprawa: potwierdzenie i przycisk „Finish and keep” (list zostaje w historii jako „Case deleted”).

**A4. „Restore from a backup” nie ma cofnięcia, a stara migawka importu może nadpisać przywrócone dane.** `src/features/backup/Backup.tsx:46-53`, `src/data/transfer.ts:37-43` — przywrócenie zastępuje wszystko po jednym potwierdzeniu; migawka z wcześniejszego importu zostaje, więc „Undo last import” dni później podmieni przywrócone dane. Naprawa: migawka także przed przywróceniem, „Undo last restore”, wyczyszczenie starej migawki.

**A5. Pojedyncze słowo dodane jako własny zwrot może w lukach trafić w inne słowo.** `src/features/gapfill/engine.ts:70-75` — dopasowanie z odmianą (`care` → `car[a-z]*`) łapie „Cardiac”, `pale` łapie „Palpitations”. Treść wbudowana jest czysta (sprawdzone na wszystkich 706 przykładach); dotyczy tylko zwrotów dodanych ręcznie. Naprawa: najpierw dokładne słowo, dopiero potem odmiana.

### Niskie

- **Aktualizacja przeładowuje wszystkie karty** (także tę, w której kliknięto „Later”); przy każdym przeładowaniu przepada ≤ 0,8 s pisania — dodać zapis przy `pagehide` i ukrywać baner w trakcie pisania listu. `src/app/UpdateBanner.tsx:45`, `LetterSession.tsx:69-78`.
- **Druga karta po zmianie wersji bazy** przestaje zapisywać po cichu (`src/data/db.ts:130-132`; błąd `VersionError` przy ponownym otwarciu). Ujawni się dopiero przy kolejnej zmianie wersji bazy. Naprawa: komunikat „otwarto nowszą wersję — przeładuj” albo przeładowanie.
- **Wyścig autozapisu z przełączeniem fazy** (`LetterSession.tsx:53-58`): zapis buduje rekord z wartości sprzed sekundy; przy bardzo wolnym zapisie mógłby cofnąć fazę „writing” do „reading”. W praktyce okno to kilka milisekund. Naprawa: zapisy typu „odczytaj–zmień–zapisz” zamiast pełnego rekordu.
- **Lista Fiszki trzyma usunięte zwroty** (`src/features/fiszki/SendToFiszki.tsx:21-28`): bank pokazuje „Fiszki list: 1 phrase”, a ekran wysyłki „list is empty” bez przycisku Clear.
- **Raport scalania liczy usunięcia jako „Adds”** (`src/data/merge.ts:51-61`).
- **`#/transfer/shared` zostaje w adresie** — po przeładowaniu „No shared file was found”. Naprawa: po odebraniu pliku przejść na `#/transfer`.
- **Ciche błędy zapisu**: autozapis, Merge i Restore nie pokazują błędu, gdy IndexedDB odmówi (brak miejsca).
- **Odmienione formy w lukach**: w trzech zwrotach (`core-m130`, `m136`, `m175`) luka to „syncopal”, „pyrexial”, „deterioration”; wpisanie formy słownikowej daje „close”.
- **Samoocena zapisywana po numerze pozycji** — zmiana kolejności checklisty w treści przesunie zaznaczenia; dwa szybkie stuknięcia w liście Fiszki mogą zgubić jedno.
- Bez testów: komponenty React (brak środowiska DOM), hooki, silnik luk na tekście własnym, Undo po zmianach zrobionych po imporcie.

## B. Bezpieczeństwo, prywatność, PWA

**Bez ustaleń wysokiej wagi.** Sprawdzone i w porządku: CSP (każda dyrektywa zgodna z tym, co aplikacja robi; brak skryptów i stylów inline), brak `innerHTML` — cały tekst użytkownika renderowany jako tekst, walidacja plików importu (obcy format, nowszy schemat, uszkodzone rekordy — odrzucane bez zmian), zapisy w jednej transakcji, service worker (offline, aktualizacje, POST do `share-target` nie jest połykany), manifest (`start_url`, `scope`, `share_target`), zależności przypięte, `package-lock.json` w repo, linki zewnętrzne z `rel="noopener noreferrer"`, brak jakichkolwiek połączeń z sieci poza własną domeną.

**Średnie — prywatność w publicznym repo.** Ścieżki z nazwą użytkownika Windows i folderem Google Drive: `CLAUDE.md:38`, `scripts/import-fiszki.mjs:7`, `docs/PLAN.md:24`. Są w historii od pierwszego commita publicznego repo. Opcje: (a) poprawić w bieżącej wersji i zaakceptować historię — zalecane, informacja jest mało wrażliwa; (b) powtórzyć procedurę z D18 (nowa historia, nowe repo).

**Niskie**
- Workflow daje `pages: write` i `id-token: write` także krokowi budowania (`.github/workflows/deploy.yml:15-18`) — przenieść do kroku `deploy`; akcje przypięte do wersji, nie do SHA.
- Brak limitu rozmiaru pliku importu (300 MB plik zawiesi kartę; baza nietknięta) i luźna walidacja: `id` bez ograniczeń znaków, `updatedAt` sprawdzane tylko jako tekst — wartość „z” wygrywałaby każde scalanie. Naprawa: limit ~20 MB, `id` `[\w-]{1,64}`, `updatedAt` jako poprawna data.
- `share-target` przyjmuje POST z dowolnej strony — skutek ograniczony do podglądu importu (Merge wymaga stuknięcia, jest Undo). Wzmocnienie opcjonalne, do sprawdzenia na telefonie.
- `img-src data:` w CSP zbędne. Manifest bez pola `id`; `theme_color` (teal) inny niż kolor strony (ekran startowy na chwilę teal).
- Brak pliku licencji (domyślnie „wszelkie prawa zastrzeżone” — Twoja decyzja).
- **Wspólny origin z Fiszkami** (`kkorzeniowski85.github.io`): obie aplikacje dzielą limit pamięci i „Wyczyść dane witryny” w Chrome usuwa obie naraz. Bazy i cache są rozdzielone nazwami, więc nie kolidują.

## C. Treść

### Błędy do poprawy
| Gdzie | Co jest | Co powinno być |
|---|---|---|
| `wc-claudication-referral` | Management: „atorvastatin increased 20 → 80 mg”, ale w wywiadzie nie ma atorwastatyny | dopisać „Atorvastatin 20 mg ON” do Medical history |
| `wc-foot-ulcer-district-nurse` | wywiad: glargine 24 j.; przebieg: „↑ 20 → 24” | w wywiadzie 20 j. |
| `wc-pneumonia-discharge` | doksycyklina „until 23/09 (7 days in total)” przy przyjęciu 16/09 = 8 dni | „until 22/09” (także we wzorze listu) |
| `wc-pneumonia-discharge` | „CURB-65 score 2” — z notatek wynika tylko 1 punkt (wiek) | dopisać np. mocznik ≥ 7 mmol/l — do decyzji lekarza |
| `wc-biliary-drain` | kolestyramina „take 1 h before/4 h after other meds” — odwrócone | inne leki 1 h przed lub 4–6 h po kolestyraminie |
| `wc-back-pain-physio` | „3 weeks ago” przy prezentacji 21/08 i zadaniu 11/09 — data urazu niejasna | podać datę urazu |
| `abbr-strzalki` | „Δ = change” | w notatkach UK Δ = diagnosis, ΔΔ = differential; strzałki osobno |
| `rp-new-diabetes` | „HbA1c 62, which confirms” — u bezobjawowego potrzebne powtórzenie | „A repeat HbA1c of 62 mmol/mol confirms…” |
| `rp-disc-conservative` | „has sciatica … for five weeks” | „has had sciatica …” |
| `guides.json` (Listening) | fakt o pisowni łączy dwa źródła; poradnik OET mówi, że drobne odstępstwa mogą być uznane | rozdzielić na dwa fakty z właściwymi źródłami, złagodzić |
| `src/data/backup.ts:120` | „sending to Fiszki” | „export to Fiszki” |
| `src/features/transfer/Transfer.tsx:136` | „before it, including changes you made since” | „before the import, including any changes made since” |

### Tłumaczenia do rozważenia (Twoja decyzja — pochodzą z Fiszek)
`core-m171` „zostać włączonym na (lek)” → „mieć włączony lek / rozpocząć leczenie”; `core-m185` „zostać wypisanym z…” → „…z zaleceniem/receptą na…”; `term-m9` „Przy założeniu…” nie znaczy „in keeping with” → „zgodny z / przemawiający za”; `core-m222` „wywiad chorobowy przebyty” → „przebyte choroby”; `core-m227` „diagnostyka różnicowa” → „rozpoznanie różnicowe”; `core-m150` rebound tenderness to sam objaw Blumberga → „objaw Blumberga”; `everyday-l13` „draka” → „niezły kłopot”; `everyday-l22` „nie wyjść po bożemu” → „pójść nie tak”; `everyday-l30` „nie mam zdania” ≠ „I'm not bothered” → „wszystko mi jedno”; `ward-n6` „zebrać zgodę” → „uzyskać zgodę”; `core-m197` „ochrona osób wrażliwych” → „ochrona osób narażonych”.

### Wątpliwości kliniczne (do potwierdzenia przez Ciebie)
- `wc-tia-referral`: „nie prowadzić do wizyty w TIA clinic” — DVLA: miesiąc bez prowadzenia po TIA.
- `wc-heart-failure-discharge`: po zawale ze stentem (2016) brak ACE-I i beta-blokera przy przyjęciu; „CT coronary angiogram” u pacjenta ze stentem — zwykle koronarografia.
- `wc-incidental-renal-mass`: eGFR pod „CT findings” (przenieść), brak PMH/leków/alergii — dopisać „not known to radiology”.
- `wc-colorectal-referral`: wzór listu pomija NKDA i brak wywiadu rodzinnego; „at your earliest convenience” za słabe dla ścieżki 2-tygodniowej → „under the urgent suspected cancer pathway”.
- `rp-contrast-anxiety`: karta pacjenta mówi o wcześniejszej reakcji na kontrast, karta kandydata tego nie podejmuje — dodać punkt o postępowaniu (środki ostrożności, premedykacja, opcja bez kontrastu).
- `rp-angry-relative` każe przeprosić, a bank Speaking nie ma zwrotów przeprosin — dodać „I'm sorry that…”, „I can see why you're upset”.
- `rp-back-pain-scan-request`: zwrot „Is now a good time to talk?” nie pasuje do umówionej wizyty — zamienić na „What were you hoping we could do for you today?”.
- `core-m114` „kindly advise” — rejestr biznesowy/indyjski, w UK „I would be grateful for your advice on…”; `core-m143` „diaphoresis”, synonimy „chief complaint”, „attending physician” — amerykańskie, oznaczyć.

### Duplikaty, przypisania, luki
- Bliskie duplikaty (z osobnych talii): `core-m183`/`term-m5` (co-morbidities/comorbidity), `core-m178`/`term-m2`, `term-m9`/`term-m10`, `core-m210`/`term-m7`, `core-m122`/`core-m163`, `core-m230`/`ward-n24`, `everyday-l1`/`ward-n18`, `everyday-l4`/`l20`, `l51`/`l56`, `l52`/`l53`, `core-m198`/`ward-n22`.
- Nie na miejscu: `term-m16`, `term-m17` (język badań, nie „przebieg choroby”); `everyday-l42`, `l44`, `l45` nie są potocznym brytyjskim; `abbr-fracture` „#” → Diagnoses; `abbr-dnacpr` → Case-note shorthand.
- Niespójności: „out-patient/in-patient” vs „outpatient”; wielkie litery w `term-*`; „...” vs „…”; „6kg” → „6 kg”; „38.6°C” → „38.6 °C”; `term-m12` „continues/undergoes” → „continue/undergo”.
- Zbyt chude grupy: **Purpose (2 zwroty)**, **Empathy (3)**, **Closing (3)** — warto dopisać po 4–6.
- Skróty użyte w przypadkach, których nie ma na liście: ON, PR, WCC, SpO2, JVP, GTN, PCA, HbA1c, BMI, ABPI, ERCP, DVLA, TIA, ED, IR.

Potwierdzone jako poprawne: brytyjska pisownia w całej treści, 12 zadań w rubryce OET, wzory 185–194 słów, wiek zgodny z datą urodzenia, kryteria (nazwy, skale, progi na B) zgodne z oficjalnymi PDF-ami, fakty o egzaminie zgodne ze źródłami.

## D. Użyteczność i dostępność

Kontrast tekstu: wszystkie pary kolorów motywu przechodzą WCAG AA (jasny 4,8–5,7:1; ciemny 5,9–7,8:1).

**Średnie**
- Obramowania pól formularzy w jasnym motywie mają kontrast 1,3:1 (`src/index.css:19`, `--line`); widać tylko placeholder. Osobny kolor obramowań pól (~3:1).
- Długi tekst bez spacji (URL wklejony do notatki, linia „-----” w ocenie z Claude'a) rozciąga stronę w bok na 360 px — brak `break-words` w `NotesView.tsx:66`, `Letters.tsx:128,176,193`, `CaseNotes.tsx:12`.
- Timed Writing na telefonie z klawiaturą: lepki nagłówek ~130 px + pole na list mierzone przed klawiaturą → widać ~170 px tekstu. `interactive-widget=resizes-content` w `index.html` i zwężenie nagłówka do jednego wiersza podczas pisania.
- Małe cele dotykowe (~20 px): Edit/Delete/Remove/Later/Delete letter/Delete case; **„Discard” 8 px od „Finish”** (`LetterSession.tsx:130`) — przesunąć.
- „Clear list” (Fiszki) bez potwierdzenia ani cofnięcia.
- Komunikaty statusu wstawiane do strony zamiast aktualizowane — czytniki ekranu często ich nie odczytają; błędy powinny mieć `role="alert"`.
- Liczniki na filtrach grup przy `opacity-70` mają 3,0:1; zablokowany edytor w fazie czytania przyciemnia instrukcję do 1,9:1.

**Niskie**
- Narzędzia (Vocabulary, Abbreviations, Send to Fiszki, Settings) na telefonie tylko z ekranu głównego/nagłówka — rozważyć piątą zakładkę „More”.
- Okno „+ Add” bez nagłówka i przycisku zamknięcia; po zapisie fokus ginie.
- Fokus nie przenosi się na nowy ekran (Start → sesja, Finish → przegląd).
- Nazewnictwo: „My notes/My letters/mine” vs „Your cases/Your letter” — ujednolicić; „Choosing from four” → „Multiple choice”; „Language” (role-play) vs „Linguistic criteria”; Listening i Reading mają identyczny opis.
- Style przycisków powielone w 8 plikach — wspólne komponenty w `ui/controls.tsx`.

## E. Co działa dobrze
Model danych (znaczniki czasu, usunięcia jako znaczniki, scalanie idempotentne i niezależne od kolejności, migawka + Undo); jedna transakcja przy przywracaniu i scalaniu; migracje bazy addytywne i testowane; zegary liczone ze znaczników czasu (uśpienie, przeładowanie); prompt oceny zgodny z kryteriami; natywny `<dialog>`; etykiety na wszystkich polach; „Fictional cases only” w każdym miejscu wpisywania tekstu; PWA: 9 plików offline, aktualizacja tylko po kliknięciu, bezpieczny obszar dolnej nawigacji; brak jakichkolwiek usług zewnętrznych.

## F. Proponowana kolejność napraw

1. **Kod — pakiet 1 (ok. 2 h):** A1–A5, zapis przy `pagehide` i baner poza sesją pisania, lista Fiszki bez usuniętych zwrotów, usunięcia osobno w raporcie scalania, `#/transfer` po odebraniu pliku, limit rozmiaru i walidacja `id`/dat w imporcie, `img-src` bez `data:`, `id` w manifeście, uprawnienia workflow tylko dla `deploy`, `break-words`, obramowania pól, „Discard” z dala od „Finish”, zabezpieczenie `saveRecord` przed nadpisaniem usuniętego rekordu.
2. **Treść — pakiet 2:** tabela błędów z C, brakujące skróty, zwroty przeprosin oraz uzupełnienie grup Purpose/Empathy/Closing. Tłumaczenia i wątpliwości kliniczne — po Twoich decyzjach.
3. **Prywatność — pakiet 3:** neutralne odwołania do Fiszek zamiast ścieżek (w bieżącej wersji), skrypt importu bez domyślnej ścieżki; ewentualnie nowa historia repo.
4. **UX — pakiet 4:** klawiatura w Timed Writing, cele dotykowe, fokus, nagłówek okna „+ Add”, komunikaty statusu, nazewnictwo, wspólne komponenty przycisków.
