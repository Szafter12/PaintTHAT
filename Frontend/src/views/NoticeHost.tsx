import { useCallback, useEffect, useState } from 'react';
import { NOTICE_EVENT } from '../hooks/notice';
import type { NoticeItem, NoticeType } from '../hooks/notice';
import '../styles/game.css';
import '../styles/notice.css';

const DEFAULT_TITLES: Record<NoticeType, string> = {
  error: 'Uwaga!',
  info: 'Informacja',
  success: 'Super!',
};

export function NoticeHost() {
  const [queue, setQueue] = useState<NoticeItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<NoticeItem>).detail;
      setQueue((q) => [...q, item]);
    };
    window.addEventListener(NOTICE_EVENT, handler);
    return () => window.removeEventListener(NOTICE_EVENT, handler);
  }, []);

  const current = queue[0];

  const close = useCallback(() => {
    if (!current) return;
    current.onClose?.();
    setQueue((q) => q.slice(1));
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, close]);

  if (!current) return null;

  const type: NoticeType = current.type ?? 'error';

  return (
    <div className="notice-overlay" role="alertdialog" aria-modal="true" aria-labelledby="notice-title">
      <div className={`notice-box ${type}`}>
        {/* Miejsce na Twoją grafikę ostrzeżenia – patrz --notice-img w notice.css */}
        <div className="notice-icon" aria-hidden="true"></div>

        <h2 id="notice-title" className="notice-title">
          {current.title ?? DEFAULT_TITLES[type]}
        </h2>
        <p className="notice-message">{current.message}</p>

        <button className="game-btn notice-ok" onClick={close} autoFocus>
          OK
        </button>
      </div>
    </div>
  );
}
