# OET Lab — zasady dla Claude'a

Aplikacja do przygotowania do egzaminu OET (Medicine). Plan: `docs/PLAN.md` (kamienie milowe i stan realizacji).
Decyzje z uzasadnieniem: `docs/DECISIONS.md`. Przed zmianą czegoś, co opisuje decyzja, przeczytaj ją.

## Użytkownik

Radiolog. Sam nie programuje, wszystko buduje z Claude Code. Pisze po polsku i często dyktuje, więc literówki
z rozpoznawania mowy są normalne. Chce propozycji w punktach z domyślną odpowiedzią i pytania o zgodę przed
większymi zmianami.

## Zasady

- **Interfejs aplikacji po angielsku**, prostym językiem (D12). Dokumentacja, komentarze do zmian i commity po polsku.
- **Żadnych danych pacjentów** — tylko fikcyjne przypadki (D13).
- **Żadnego Claude API ani płatnych usług AI w aplikacji.** Gdzie pomaga Claude, aplikacja buduje prompt do
  skopiowania do czatu Claude (D16).
- **Repo `kkorzeniowski85/oet-lab` jest publiczne**, aplikacja: https://kkorzeniowski85.github.io/oet-lab/.
  `git push` na `main` = nowa wersja na telefonie. Wysyłaj po każdym kamieniu milowym, po zapytaniu (D18).
- W repo nie opisuj, co leży na dyskach użytkownika ani gdzie są dane zawodowe — repo jest publiczne.
- Aplikacja działa bez serwera i bez sieci; dane użytkownika tylko w IndexedDB na urządzeniu (D2).
- Wersje zależności przypięte dokładnie (`.npmrc`: `save-exact`). Nowa zależność tylko wtedy, gdy naprawdę
  potrzebna; jej wersję i zgodność sprawdź w rejestrze npm, nie z pamięci.
- Zakaz `dangerouslySetInnerHTML` — tekst użytkownika zawsze renderowany jako tekst.

## Praca

- Przed commitem: `npm test`, `npm run lint`, `npm run build`.
- Zmiany w interfejsie sprawdź w przeglądarce przy szerokości 360 px i na szerokim ekranie
  (konfiguracje w `.claude/launch.json`).
- Jeden krok planu = jeden commit. Git nie ma globalnej tożsamości — ustaw ją tylko dla polecenia:
  `GIT_AUTHOR_NAME=kkorzeniowski85 GIT_AUTHOR_EMAIL=kkorzeniowski85@gmail.com GIT_COMMITTER_NAME=kkorzeniowski85 GIT_COMMITTER_EMAIL=kkorzeniowski85@gmail.com git commit ...`
- W Git Bash ścieżki w zmiennych zaczynające się od `/` są przerabiane (np. `BASE_PATH=/oet-lab/`) — dodaj
  `MSYS_NO_PATHCONV=1`.

## Inne projekty użytkownika (tylko do odczytu, gdy zadanie tego wymaga)

- Fiszki: `C:\Users\HyperWorks\Mój dysk\aplikacja fiszki` — źródło treści startowej i format `fiszki/v1`.
- Nie przeszukuj reszty „Mojego dysku” — to prywatne pliki użytkownika.
