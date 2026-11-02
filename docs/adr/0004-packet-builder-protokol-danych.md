# ADR 0004: Centralizacja protokołu sieciowego w PacketBuilder

**Data:** 2026-11-01
**Status:** Zaakceptowany

## 1. Kontekst
Komunikacja WebSocket opiera się na wymianie JSON-ów w formacie "koperty": `{"type": "...", "payload": {...}}`. Ręczne wpisywanie klamerek JSON w kodzie stanów oraz hardkodowanie kluczy (Magic Strings) typu `"type": "ERROR"` utrudniało refaktoryzację i prowadziło do literówek i niestabilności protokołu między Backendem a Frontend-em.

## 2. Decyzja
Wydzieliliśmy całą strukturę wychodzących JSON-ów do jednego pliku **`PacketBuilder.hpp`**. Wszystkie wysyłane z serwera wiadomości muszą przechodzić przez statyczne/wbudowane funkcje (np. `Packets::makeTimeLeft(int seconds)`). Dodatkowo, obiekty przekazywane do funkcji używają lekkiego `std::string_view`, aby zminimalizować alokacje pamięci RAM.

## 3. Konsekwencje
**Pozytywne:**
* Logika biznesowa (`RoomStates`) jest czysta i pozbawiona surowych składni JSON.
* Jedno źródło prawdy: zmiana nazwy pola na Froncie wymaga edycji tylko jednej linijki w Backendzie.
* Kompilator chroni przed wysłaniem niepełnych danych (silne typowanie C++).

**Negatywne:**
* Każdy nowy pakiet sieciowy wymaga dopisania nowej funkcji w `PacketBuilder.hpp`.