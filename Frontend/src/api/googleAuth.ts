import { API_CONFIG } from './config';

// Logowanie / rejestracja przez Google (Google Identity Services, OAuth 2.0 popup).
// Wymaga zmiennej VITE_GOOGLE_CLIENT_ID w pliku .env (patrz instrukcja niżej).

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Nie udało się załadować skryptu Google. Sprawdź połączenie z internetem.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: API_CONFIG.GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error || 'Google nie zwrócił tokenu.'));
      },
      error_callback: (error) => {
        reject(
          new Error(
            error.type === 'popup_closed'
              ? 'Okno logowania Google zostało zamknięte.'
              : 'Nie udało się otworzyć okna logowania Google (sprawdź, czy przeglądarka nie blokuje popupów).'
          )
        );
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}

async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Nie udało się pobrać danych konta Google.');
  return (await response.json()) as GoogleProfile;
}

/**
 * Otwiera okno Google i zwraca profil zalogowanego użytkownika.
 * mode: 'signin' (logowanie) lub 'signup' (zakładanie konta) – przekazywane do backendu.
 */
export async function signInWithGoogle(mode: 'signin' | 'signup'): Promise<GoogleProfile> {
  if (!API_CONFIG.GOOGLE_CLIENT_ID) {
    throw new Error('Brak VITE_GOOGLE_CLIENT_ID – skonfiguruj logowanie Google w pliku .env.');
  }

  await loadGoogleScript();
  const accessToken = await requestAccessToken();
  const profile = await fetchProfile(accessToken);

  // Opcjonalnie: backend ASP.NET tworzy konto (signup) / loguje (signin).
  // Dopóki endpoint nie istnieje, działamy lokalnie na profilu z Google (jak mock PIN-u).
  try {
    const response = await fetch(`${API_CONFIG.ASPNET_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, mode }),
    });
    if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
  } catch (error) {
    console.warn('Endpoint /auth/google niedostępny – używam samego profilu Google:', error);
  }

  return profile;
}
