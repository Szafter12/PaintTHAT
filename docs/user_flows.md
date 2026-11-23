
## 2. Powiązanie kroków ze stanami i makietami High-Fi

| ID Makiety | Komponent / Widok | Rola i urządzenie | Powiązane kroki w User Flow | Kluczowe elementy interfejsu i interakcje |
| :--- | :--- | :--- | :--- | :--- |
| **HF-01** | `MenuView.tsx` (`/`) | Host (PC/TV) & Gracz (Mobile) | Punkt wejścia, powrót po odświeżeniu Hosta, powrót po zamknięciu pokoju. | Selektor avatara, pole nicku/PIN-u, opcjonalne logowanie Google OAuth (Host), przyciski wyboru roli (`Utwórz pokój` / `Dołącz`). |
| **HF-02** | `HostLobbyView.tsx` (`/host-room?id=PIN`) | Host (PC/TV) | Tworzenie pokoju, zarządzanie uczestnikami, konfiguracja gry, powrót po finale. | Duży kod PIN, dynamiczny kod QR (`RoomQrCode`) z linkiem `/room?id=PIN`, lista graczy z przyciskiem wyrzucania (`×`), ustawienia rund i czasu, edytor własnych haseł, przycisk `Start`. |
| **HF-03** | `PlayerMenuView.tsx` (`/room?id=PIN`) | Gracz (Mobile) | Wejście z menu głównego lub bezpośrednio po zeskanowaniu kodu QR z ekranu Hosta. | Pole kodu PIN (automatycznie wypełniane z parametru URL `?id=`), pole wpisania nicku, karuzela avatarów, przycisk zatwierdzenia dołączenia. |
| **HF-04** | `PlayerRoomView.tsx` (`/room?id=PIN`) | Gracz (Mobile) | Oczekiwanie w lobby przed grą oraz powrót po zakończeniu pełnego meczu (`GAME_OVER`). | Karta gracza (avatar + nick), numer pokoju, lista pozostałych połączonych graczy, przycisk opuszczenia pokoju. |
| **HF-05a/b/c** | `HostGameView.tsx` (stan `hostGame`) | Host (PC/TV) | Wybór słowa (`05a`), główna faza rysowania i zgadywania (`05b`), podsumowanie rundy (`05c`). | Górny pasek statusu (`Rysuje: [Nick]`, `Runda X/Y`, licznik czasu z alertem `<= 10s`), płótno `1024x768` renderujące kreski na żywo, boczna tabela wyników z ostatnimi typami graczy, modal podsumowania rundy (`+roundScore` i przycisk `Następna runda` / `Wyniki końcowe`). |
| **HF-06a/b** | `PlayerDrawView.tsx` (widok Rysownika) | Gracz — Rysownik (Mobile) | Wybór 1 z 3 haseł (`06a`), aktywne rysowanie na ekranie dotykowym (`06b`). | Karty wyboru z 3 wylosowanymi słowami; po wyborze: wskazówka obrotu telefonu, stały baner z wylosowanym hasłem, płótno dotykowe, paleta 16 kolorów + własny próbnik, suwak grubości, przyciski `Gumka` i `Wyczyść`. |
| **HF-07a/b/c** | `PlayerGuessView.tsx` (widok Zgadującego) | Gracz — Zgadujący (Mobile) | Oczekiwanie na hasło (`07a`), zgadywanie i podpowiedź o literówce (`07b`), potwierdzenie trafienia (`07c`). | Komunikat oczekiwania na rysownika, pole tekstowe na hasło z obsługą klawisza `Enter`, prywatny żółty baner `Prawie zgadłeś!` (przy odległości Levenshteina `<= 1`), ekran gratulacji po poprawnym odgadnięciu. |
| **HF-08** | `HostResultsView.tsx` (stan `hostResults`) | Host (PC/TV) | Finał rozgrywki po ostatniej rundzie lub przerwaniu gry z powodu braku graczy. | Animowane podium dla miejsc 1–3 z opóźnionym efektem dźwiękowym fanfar, pełna lista rankingowa ze zdjęciami i punktami, przycisk powrotu do lobby (`BACK_TO_LOBBY`). |
| **HF-09** | `NoticeHost.tsx` (nakładka globalna) | Host & Gracz (Wszystkie ekrany) | Obsługa błędów walidacji, rozłączeń krytycznych i zdarzeń przerywających rundę. | Nieblokujący lub modalny komunikat z tytułem, treścią błędu/informacji oraz przyciskiem zamknięcia przywracającym bezpieczny widok. |

---

## 3. Stany systemu (System States)

### A. Stany ładowania (Loading States)
* **Inicjalizacja pokoju Hosta (`HF-01` → `HF-02`):** Po kliknięciu utworzenia pokoju aplikacja wysyła żądanie `POST /api/rooms/create` (z automatycznym przełączeniem na lokalny generator PIN-u w przypadku niedostępności API REST) oraz otwiera połączenie WebSocket (`HOST_INIT`).
* **Pobieranie puli losowych słów (`HF-02`):** W lobby Hosta pobranie haseł z endpointu `GET /api/words/random` blokuje przycisk generowania do czasu otrzymania odpowiedzi z serwera.
* **Przejście między lobby a rundą (`HF-04` → `HF-06`/`HF-07`):** Po odebraniu pakietu `GAME_STARTED`, zanim serwer wylosuje pierwszego rysownika (`CHOOSE_WORD` / `WAITING_FOR_WORD`), telefon gracza wyświetla dedykowany ekran przejściowy: *„Ładowanie rundy... Maszyna losująca wybiera rysownika...”*.
* **Oczekiwanie na decyzję rysownika (`HF-05a` & `HF-07a`):** Gdy rysownik wybiera hasło z 3 propozycji, na ekranie Hosta oraz wszystkich zgadujących prezentowany jest stan oczekiwania (`[Nick] wybiera słowo...`) z zablokowanym polem wpisywania odpowiedzi do momentu otrzymania pierwszego pakietu `TIME_LEFT`.

### B. Stany puste (Empty States)
* **Pusta poczekalnia Hosta (`HF-02`):** Gdy żaden gracz jeszcze nie zeskanował kodu QR ani nie wpisał PIN-u (`players.length === 0`), lista uczestników wyświetla stan oczekiwania na pierwszych graczy, a próba startu gry jest blokowana komunikatem walidacyjnym.
* **Brak listy słów u rysownika (`HF-06a`):** Jeśli widok `PlayerDrawView` wyrenderuje się przed nadejściem tablicy `wordOptions`, zamiast pustej przestrzeni wyświetlany jest komunikat zastępczy: *„Oczekiwanie na słowa od serwera...”*.
* **Brak wpisów na czacie / tabeli wyników (`HF-05b`):** Na początku każdej nowej rundy historia zgadywań (`chatMessages`) oraz statusy odgadnięcia (`isGuessed`) są czyszczone — przy graczach nie wyświetlają się żadne etykiety z poprzednich rund, a płótno `<canvas>` jest całkowicie wyczyszczone.
* **Podium przy niepełnej liczbie graczy (`HF-08`):** W widoku `HostResultsView` sloty podium (1, 2, 3) renderują się warunkowo (`if (!player) return null`), dzięki czemu przy 2 graczach 3. miejsce pozostaje puste bez błędów układu.

### C. Stany błędne i brzegowe (Error & Edge States)
* **Za mało graczy do startu lub kontynuacji gry (`NOT_ENOUGH_PLAYERS`):**
  * *W lobby (`HF-02`):* Kliknięcie startu przy `< 2` graczach wywołuje komunikat w `NoticeHost` (*„Potrzeba minimum 2 graczy, aby rozpocząć grę”*).
  * *W trakcie rozgrywki (`HF-05`):* Gdy opuszczenie pokoju przez gracza obniży liczbę uczestników poniżej 2, serwer przerywa odliczanie, wyświetla powiadomienie `NoticeHost` (*„Za mało graczy, aby kontynuować grę”*) i przenosi grę na ekran końcowy (`HF-08`).
* **Nieprawidłowy lub zajęty kod PIN (`ROOM_NOT_FOUND` / `ROOM_EXISTS`):** Wpisanie błędnego PIN-u przez gracza (`HF-03`) wyświetla komunikat *„Nie znaleziono pokoju”* w `NoticeHost` i zamyka gniazdo WebSocket, pozostawiając użytkownika w formularzu do poprawy kodu.
* **Opuszczenie gry przez Rysownika (`DRAWER_QUIT`):** Rozłączenie rysownika w trakcie wybierania słowa lub rysowania natychmiast zatrzymuje timer, wyświetla wszystkim uczestnikom powiadomienie *„Rysownik [Nick] opuścił pokój — runda została zakończona”* i przenosi widok do podsumowania rundy (`HF-05c`).
* **Zamknięcie pokoju / odświeżenie strony przez Hosta (`HOST_LEFT`):** Odświeżenie karty przeglądarki przez Hosta zamyka pokój na serwerze i cofa Hosta bezpiecznie do `MenuView` (`HF-01`), natomiast podłączeni gracze otrzymują komunikat *„Host opuścił pokój. Rozgrywka została zakończona”* i są przenoszeni do menu głównego.
* **Wyrzucenie gracza przez Hosta (`KICKED`):** Kliknięcie przycisku usunięcia gracza w `HF-02` rozłącza wskazanego klienta po stronie serwera, usuwa go z list wszystkich uczestników i wyświetla na jego telefonie modal *„Host usunął Cię z pokoju”* z powrotem do `HF-01`.
* **Nieinwazyjne opuszczenie pokoju przez zwykłego gracza (`PLAYER_CLOSE`):** Wyjście gracza niebędącego rysownikiem (gdy w pokoju pozostają co najmniej 2 osoby) aktualizuje listę uczestników i tabelę wyników po cichu bez przerywania rozgrywki wyskakującymi oknami.
