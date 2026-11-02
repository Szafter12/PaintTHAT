# ADR 0006: Zapis i obsługa historii gier (C++ Server & ASP.NET Core)

**Data:** 2026-11-01
**Status:** Zaakceptowany

## 1. Kontekst
Architektura aplikacji składa się z dwóch współpracujących backendów:
1.  **GameServer (C++ / Crow):** Odpowiada za logikę czasu rzeczywistego (WebSocket) i płynność rozgrywki. Nie posiada uwierzytelniania, bazy danych ani trwałego stanu poza trwającą grą.
2.  **API / Panel Hosta (ASP.NET Core / C#):** Główny system zarządzający (REST API), obsługujący rejestrację Hostów (Identity), autoryzację, zarządzanie pokojami przed startem oraz trwałą bazę danych (Entity Framework Core).

Wymaganiem biznesowym jest przechowywanie historii gier dla Hostów, wraz ze szczegółami rund i wygenerowanymi rysunkami. Zapisywanie rysunków jako punktów z `canvas` obciążyłoby bazy danych, a realizacja zapisu w C++ złamałaby zasadę podziału odpowiedzialności (GameServer nie ma dostępu do bazy).

## 2. Decyzja
Zdecydowaliśmy się na hybrydowe podejście:
1.  **Zrzut z ekranu:** Frontend (TV) na koniec rundy konwertuje płótno do formatu WebP (Base64).
2.  **Delegacja zapisu do ASP.NET:** Zamiast wysyłać rysunek przez WebSocket do C++, Frontend wysyła zwykłe zapytanie HTTP POST (zawierające Base64, statystyki i Bearer Token) bezpośrednio do głównego API w ASP.NET Core.
3.  **Przechowywanie w chmurze/na dysku:** ASP.NET odbiera plik i zapisuje go w systemie plików (Blob Storage lub dedykowany folder `wwwroot/drawings/`), a w bazie relacyjnej (SQL Server/PostgreSQL) umieszcza jedynie metadane:
    *   `GameId`
    *   `RoundNumber`
    *   `Word`
    *   `DrawerId`
    *   `ImageUrl` (ścieżka do zapisanego pliku)

## 3. Implementacja (ASP.NET Core)

### Model Danych (Entity Framework)
```csharp
public class GameHistory
{
    public Guid Id { get; set; }
    public string HostId { get; set; } // Z ASP.NET Identity
    public DateTime PlayedAt { get; set; }
    public ICollection<RoundHistory> Rounds { get; set; }
}

public class RoundHistory
{
    public Guid Id { get; set; }
    public Guid GameHistoryId { get; set; }
    public string Word { get; set; }
    public string DrawerNickname { get; set; }
    public string ImageUrl { get; set; } // np. "/drawings/game123_round1.webp"
}
```

### Kontroler Zapisujący (Endpoint)
```csharp
[Authorize] // Tylko zalogowany Host może wysłać historię
[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public HistoryController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("save-round")]
    public async Task<IActionResult> SaveRound([FromBody] SaveRoundDto request)
    {
        // 1. Oczyszczenie Base64
        var base64Data = request.ImageBase64.Substring(request.ImageBase64.IndexOf(",") + 1);
        byte[] imageBytes = Convert.FromBase64String(base64Data);

        // 2. Generowanie unikalnej nazwy i ścieżki
        var fileName = $"{Guid.NewGuid()}.webp";
        var filePath = Path.Combine(_env.WebRootPath, "drawings", fileName);

        // 3. Zapis pliku asynchronicznie (I/O na dysku nie blokuje wątku)
        await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

        // 4. Zapis do bazy danych
        var round = new RoundHistory
        {
            Word = request.Word,
            DrawerNickname = request.DrawerNickname,
            ImageUrl = $"/drawings/{fileName}",
            GameHistoryId = request.GameId // Pobierane z trwającej sesji gry
        };

        _context.Rounds.Add(round);
        await _context.SaveChangesAsync();

        return Ok(new { url = round.ImageUrl });
    }
}
```

## 4. Konsekwencje

Pozytywne:

- Separacja kompetencji (SoC): GameServer w C++ pozostaje lekki i skupiony wyłącznie na strumieniowaniu danych w czasie rzeczywistym. ASP.NET przejmuje ciężar autoryzacji, bazy danych i obsługi plików.

- Wydajność bazy danych: Trzymamy pliki poza bazą, więc tabele są małe i szybko się indeksują.

- Skalowalność: W przyszłości można łatwo przenieść zapis plików z dysku wwwroot na AWS S3 / Azure Blob Storage za pomocą wbudowanych w C# interfejsów (np. IStorageService), bez ruszania kodu gry.

- Bezpieczeństwo: Endpoint jest chroniony atrybutem [Authorize], więc nikt z zewnątrz nie zapcha nam dysku "lewymi" obrazkami.

Negatywne:

- Asynchroniczność systemów: Frontend musi pilnować, aby wysłać raport z rundy przed całkowitym wyczyszczeniem ekranu (GameServer może już kazać zacząć następną).

- Czyszczenie danych (Data Retention): Wymagany będzie dodatkowy mechanizm (np. Hangfire lub BackgroundService w ASP.NET), który po określonym czasie usunie z dysku przestarzałe rysunki i "sieroty" (pliki bez powiązania w bazie).