# Specyfikacja Projektu: Party Game

## 1. Cel projektu
Celem projektu jest stworzenie lokalnej internetowej gry towarzyskiej polegającej na rysowaniu i zgadywaniu haseł w czasie rzeczywistym. System działa w architekturze hybrydowej z podziałem na aplikację Hosta (ekran główny) oraz aplikacje mobilne Graczy (kontrolery).

---

## 2. Aktorzy
- **Host:** Organizator gry. Operuje na dużym ekranie (np. komputer/telewizor). Jego celem jest stworzenie pokoju i zarządzanie rozgrywką. Wymaga konta w systemie.
- **Gracz:** Uczestnik gry. Używa smartfona jako kontrolera/narzędzia do rysowania. Zależy mu na błyskawicznym dołączeniu do pokoju bez konieczności zakładania konta.

---

## 3. User Stories

### US-01: Niestandardowe pule słów
**Jako** host gry, **chcę** móc dodawać niestandardowe słowa do puli haseł, **aby** urozmaicić rozgrywkę ze znajomymi.
- **Given** Host jest zalogowany do systemu i znajduje się w menu tworzenia nowego pokoju.
- **When** Host wpisze własne słowa oddzielone przecinkami w pole "Własna pula słów" i zatwierdzi start gry.
- **Then** System zapisuje te słowa w bazie danych dla tej sesji, a serwer gry losuje hasła do rysowania wyłącznie z tej niestandardowej puli.

### US-02: Narzędzia do rysowania
**Jako** gracz, który aktualnie rysuje, **chcę** mieć dostęp do dużej palety kolorów, **żeby** móc dobrze oddać wizję mojego hasła.
- **Given** Trwa runda, a system przydzielił danemu graczowi rolę Rysującego.
- **When** Gracz kliknie wybrany kolor z palety na ekranie telefonu.
- **Then** Aktywne narzędzie zmienia kolor, a wszystkie kolejne współrzędne wysyłane przez WebSocket na ekran główny rysują się w nowo wybranym kolorze.

### US-03: Zapis historii i rysunków
**Jako** host gry, **chcę** móc zapisywać historię gier wraz z rysunkami, **aby** później móc do nich wrócić.
- **Given** Rozgrywka w pokoju dobiegła końca.
- **When** Host wchodzi w zakładkę "Historia gier" w swoim profilu.
- **Then** System pobiera z bazy danych listę rozegranych meczów, wyświetla punktację oraz zarchiwizowane obrazy.

### US-04: Szybkie dołączanie (Frictionless Entry)
**Jako** uczestnik rozgrywki, **chcę** móc szybko i łatwo dołączyć do gry, **aby** nie tracić czasu na rejestrację.
- **Given** Host otworzył pokój, a na dużym ekranie widnieje 4-cyfrowy PIN oraz kod QR.
- **When** Gracz zeskanuje kod QR telefonem (lub wpisze PIN) i poda swój Nick.
- **Then** Serwer gry autoryzuje wejście i natychmiast dodaje gracza do poczekalni, bez logowania.

### US-05: Ochrona przed literówkami
**Jako** gracz zgadujący, **nie chcę**, żeby ktoś mógł zobaczyć hasło, które było prawie prawidłowe (np. z literówką), **aby** nie ułatwiać innym wygranej.
- **Given** Gracz próbuje odgadnąć poprawne hasło.
- **When** Gracz wyśle na czacie słowo z drobną literówką.
- **Then** System ukrywa tę wiadomość na czacie ogólnym i wysyła prywatny komunikat zwrotny do autora: "Jesteś bardzo blisko!".

---

## 4. Wymagania Funkcjonalne
| ID | Nazwa | Opis | Powiązanie |
|---|---|---|---|
| **REQ-FR-01** | Niestandardowe pule haseł | System pozwala Hostowi na wprowadzenie własnej listy słów podczas konfiguracji pokoju. | US-01 |
| **REQ-FR-02** | Narzędzia malarskie | System udostępnia rysującemu paletę barw w czasie rzeczywistym. | US-02 |
| **REQ-FR-03** | Archiwizacja sesji | System zapisuje rozegrane mecze i obrazy, przypisując je do konta Hosta. | US-03 |
| **REQ-FR-04** | Błyskawiczny dostęp | System generuje kod PIN oraz QR pozwalający na wejście bez konta. | US-04 |
| **REQ-FR-05** | Filtr bliskich trafień | System analizuje odległość znaków i filtruje literówki na czacie. | US-05 |

---

## 5. Wymagania Niefunkcjonalne wg ISO/IEC 25002
| ID | Kategoria SQuaRE | Nazwa | Kryterium / Metryka |
|---|---|---|---|
| **REQ-NFR-01** | Performance Efficiency | Opóźnienie transmisji | Opóźnienie dla przesyłu koordynatów X,Y < 50ms. |
| **REQ-NFR-02** | Reliability | Czas przywrócenia | MTTR dla awarii serwera < 2 minuty. |
| **REQ-NFR-03** | Usability | Czas dołączenia | Czas wejścia do gry < 15 sekund. |
| **REQ-NFR-04** | Security | Bezpieczeństwo sesji Hosta | 100% żądań mutujących do API musi posiadać prawidłowy token JWT. |
| **REQ-NFR-05** | Compatibility | Obsługa mobilna | Interfejs gracza renderuje się poprawnie. |

---

## 6. Diagramy

### Diagram Przypadków Użycia (UML Use Case)
Poniższy diagram obrazuje granice systemu oraz interakcje pomiędzy Hostem a Graczem.

![Diagram Przypadków Użycia](docs/img/use_case.png)

### Diagram Wymagań SysML (z podziałem na FR i NFR)
Hierarchia wymagań funkcjonalnych oraz niefunkcjonalnych (sklasyfikowanych wg normy SQuaRE) powiązanych z metrykami.

![Diagram Wymagań](docs/img/requirements.png)