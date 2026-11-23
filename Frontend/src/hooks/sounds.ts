// hooks/sounds.ts
// Proste dźwięki generowane w przeglądarce (Web Audio API) – bez plików audio.
// Użycie: playSound('correct');  wyciszenie: setSoundEnabled(false);
// Przeglądarki odblokowują dźwięk dopiero po pierwszym kliknięciu/dotknięciu strony.

export type SoundName = 'correct' | 'tick' | 'start' | 'join' | 'fanfare';

const STORAGE_KEY = 'paintthat-sound';

let ctx: AudioContext | null = null;
let enabled = true;

try {
  enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
} catch {
  /* brak localStorage – zostaje domyślnie włączone */
}

function getContext(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// Odblokowanie dźwięku przy pierwszej interakcji użytkownika
if (typeof window !== 'undefined') {
  const unlock = () => {
    getContext();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

function tone(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  // Krótka obwiednia, żeby uniknąć „kliknięć” na początku i końcu dźwięku
  const t0 = audio.currentTime + startAt;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;

  switch (name) {
    case 'correct': // trafione hasło – dwa wznoszące się tony
      tone(audio, 660, 0, 0.15, 'triangle');
      tone(audio, 880, 0.12, 0.25, 'triangle');
      break;
    case 'tick': // mało czasu – krótkie tyknięcie
      tone(audio, 1000, 0, 0.06, 'square', 0.06);
      break;
    case 'start': // start rundy – trzy tony w górę
      tone(audio, 440, 0, 0.12, 'triangle');
      tone(audio, 660, 0.12, 0.12, 'triangle');
      tone(audio, 880, 0.24, 0.3, 'triangle');
      break;
    case 'join': // ktoś dołączył do pokoju
      tone(audio, 520, 0, 0.1, 'sine', 0.12);
      tone(audio, 780, 0.09, 0.18, 'sine', 0.12);
      break;
    case 'fanfare': // koniec gry
      [523, 659, 784].forEach((f, i) => tone(audio, f, i * 0.16, 0.2, 'triangle'));
      tone(audio, 1047, 0.5, 0.7, 'triangle', 0.18);
      break;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    /* ignorujemy */
  }
}
