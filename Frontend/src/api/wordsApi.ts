import { API_CONFIG } from './config';

export const fetchRandomWords = async (count: number = 100): Promise<string[]> => {
  const response = await fetch(`${API_CONFIG.ASPNET_BASE_URL}/words/random?count=${count}`);
  
  if (!response.ok) {
    throw new Error('Błąd pobierania słów z API');
  }
  
  return response.json();
};