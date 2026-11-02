# ADR 0001: Wybór technologii serwera

**Data:** 2026-11-01

**Status:** Zaakceptowany

## 1. Kontekst
Projekt wymaga stworzenia serwera dla wieloosobowej gry czasu rzeczywistego obsługującego ekrany TV oraz kontrolery mobilne. Serwer musi asynchronicznie przesyłać koordynaty rysowania, zarządzać stanem pokoi i komunikować się z klientami z minimalnym opóźnieniem.

## 2. Decyzja
Zdecydowaliśmy się na użycie języka **C++20** z mikro-frameworkiem **Crow**. Do komunikacji w czasie rzeczywistym używamy protokołu **WebSocket**, zachowując model Server-Driven UI.

## 3. Konsekwencje
**Pozytywne:**
* Wysoka wydajność i niskie zużycie pamięci w porównaniu do rozwiązań opartych na Node.js czy Pythonie.
* Crow zapewnia bardzo prostą obsługę WebSocketów (`.onopen`, `.onmessage`, `.onclose`) zintegrowaną w jednym porcie.
* Możliwość precyzyjnego zarządzania wątkami.

**Negatywne:**
* Konieczność ręcznego zarządzania bezpieczeństwem pamięci i blokadami.
* Brak gotowych, wysokopoziomowych mechanizmów "Room/Channel" znanych np. z Socket.IO.