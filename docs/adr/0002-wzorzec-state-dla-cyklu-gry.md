# ADR 0002: Zastosowanie wzorca State do zarządzania cyklem życia pokoju

**Data:** 2026-11-01
**Status:** Zaakceptowany

## 1. Kontekst
Zarządzanie grą polega na przechodzeniu przez ścisłe fazy: oczekiwanie w lobby, losowanie słowa, rysowanie/zgadywanie, podsumowanie rundy. Implementacja tego jako instrukcji `switch` lub `if-else` wewnątrz jednej metody `Room::handlePacket` szybko doprowadziłaby do "spaghetti code" i błędu pomieszania kontekstów.

## 2. Decyzja
Wdrożyliśmy strukturalny **wzorzec projektowy State**. Abstrakcyjny interfejs `IRoomState` definiuje metody `onEnter`, `handlePacket` i `handleDisconnect`. Klasa `Room` posiada wskaźnik na aktualny stan (`std::unique_ptr<IRoomState> currentState`) i deleguje do niego obsługę zdarzeń. Poszczególne stany to: `LobbyState`, `RoundStartState`, `WhileRoundState`, `RoundEndState` i `EndGameState`.

## 3. Konsekwencje
**Pozytywne:**
* Zasada jednej odpowiedzialności (SRP): logika każdego etapu gry jest zamknięta w osobnym pliku.
* Ignorowanie niewłaściwych pakietów: pakiety `DRAW_STROKE` wysłane w `LobbyState` są naturalnie odrzucane bez pisania dodatkowych warunków `if`.
* Łatwe dodawanie nowych stanów (np. `GameOverState`).

**Negatywne:**
* Większa fragmentacja plików (nagłówki i pliki źródłowe dla każdego stanu).
* Wymaga ostrożności przy przekazywaniu referencji `&room`, aby uniknąć cyklicznych zależności.