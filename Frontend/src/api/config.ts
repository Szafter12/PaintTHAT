const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const defaultWsUrl =
  typeof window !== 'undefined' ? `${wsProtocol}//${window.location.host}/ws` : 'ws://localhost:18080/ws';

export const API_CONFIG = {
  ASPNET_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  CPP_WS_URL: import.meta.env.VITE_WS_URL || defaultWsUrl,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
} as const;