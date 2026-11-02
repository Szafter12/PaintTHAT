# ADR 0003: Zarządzanie czasem i współbieżnością

**Data:** 2026-11-01
**Status:** Zaakceptowany

## 1. Kontekst
Gra wymaga precyzyjnego odliczania czasu w trakcie rundy (np. 60 sekund). Blokowanie głównego wątku sieciowego (Crow) do odliczania czasu zawiesiłoby cały serwer. Potrzebowaliśmy asynchronicznego zegara, który bezpiecznie współpracuje z pakietami WebSocket modyfikującymi ten sam pokój.

## 2. Decyzja
Używamy **C++20 `std::jthread`** do izolowanego odliczania czasu. Wątek korzysta z `std::condition_variable_any` i `std::stop_token` do spania i przerywania.
Wdrożyliśmy strategię "Dwu zamków" (Two Mutexes):
1. `timerMutex`: blokowany na ułamek sekundy tylko dla uśpienia timera.
2. `roomMutex`: główna blokada stanu pokoju, zakładana w `onPacket` i podczas rozsyłania `broadcastAll` z timera.
   Wdrożono też weryfikację `this_thread::get_id()` zapobiegającą wyścigom i zakleszczeniom typu self-join.

## 3. Konsekwencje
**Pozytywne:**
* Zegar nie blokuje odbierania pakietów z sieci.
* Pełne bezpieczeństwo przed "Data Race" (wyścigami).
* `std::jthread` gwarantuje automatyczne zakończenie wątku przy niszczeniu pokoju (Host wychodzi).

**Negatywne:**
* Wysoki próg wejścia w rozwój mechanizmu dla nowych programistów w zespole.
* Błędy w zagnieżdżaniu mutexów mogą skutkować Deadlockiem.