import { API_CONFIG } from './config';

export interface CreateRoomResponse {
  gameId?: string;
  pin: string;
}

export interface SaveRoundRequest {
  pin: string;
  roundNumber: number;
  word: string;
  drawerNickname: string;
  imageBase64: string;
}

export async function createRoomRequest(hostUsername: string): Promise<CreateRoomResponse> {
  try {
    const response = await fetch(`${API_CONFIG.ASPNET_BASE_URL}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostUsername }),
    });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    return (await response.json()) as CreateRoomResponse;
  } catch (error) {
    console.warn('ASP.NET API niedostępne – używam lokalnego generatora PIN (Mock):', error);
    const mockPin = Math.floor(1000 + Math.random() * 9000).toString();
    return { pin: mockPin };
  }
}

export async function saveRoundDrawingRequest(data: SaveRoundRequest): Promise<{ imageUrl: string }> {
  const response = await fetch(`${API_CONFIG.ASPNET_BASE_URL}/history/save-round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Nie udało się zapisać rysunku z rundy w ASP.NET.');
  }

  return (await response.json()) as { imageUrl: string };
}