// hooks/notice.ts
// Wywołanie: showNotice('Nie znaleziono pokoju');
// Działa z dowolnego miejsca (komponent, handler WebSocketa) – bez Reacta.
// Wymaga jednego <NoticeHost /> zamontowanego w App.tsx.

export const NOTICE_EVENT = 'game-notice';

export type NoticeType = 'error' | 'info' | 'success';

export interface NoticeOptions {
  /** Nagłówek okna (domyślnie zależy od typu). */
  title?: string;
  /** Kolor / charakter komunikatu. Domyślnie 'error'. */
  type?: NoticeType;
  /** Wywoływane po zamknięciu okna (np. powrót do menu). */
  onClose?: () => void;
}

export interface NoticeItem extends NoticeOptions {
  id: number;
  message: string;
}

let nextId = 1;

export function showNotice(message: string, options: NoticeOptions = {}): void {
  const detail: NoticeItem = { id: nextId++, message, ...options };
  window.dispatchEvent(new CustomEvent<NoticeItem>(NOTICE_EVENT, { detail }));
}
