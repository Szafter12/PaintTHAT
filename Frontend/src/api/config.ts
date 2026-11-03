export const API_CONFIG = {
  ASPNET_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5098/api',
  CPP_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:18080/ws',
} as const;