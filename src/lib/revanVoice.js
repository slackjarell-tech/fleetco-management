const VOICE_KEY = 'fleetco_revan_voice_on';
const AUTO_KEY = 'fleetco_revan_auto_speak';
const CONTINUOUS_KEY = 'fleetco_revan_continuous';
export const REVAN_THREAD_KEY = 'fleetco_revan_thread_v1';

export function isRevanVoiceOn() {
  try {
    return localStorage.getItem(VOICE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setRevanVoiceOn(on) {
  try {
    localStorage.setItem(VOICE_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function isRevanAutoSpeak() {
  try {
    const v = localStorage.getItem(AUTO_KEY);
    if (v === null) return true;
    return v !== 'false';
  } catch {
    return true;
  }
}

export function isRevanContinuous() {
  try {
    return localStorage.getItem(CONTINUOUS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRevanContinuous(on) {
  try {
    localStorage.setItem(CONTINUOUS_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function loadRevanThread() {
  try {
    const raw = localStorage.getItem(REVAN_THREAD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRevanThread(messages) {
  try {
    const trimmed = (messages || []).slice(-30);
    localStorage.setItem(REVAN_THREAD_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function setRevanAutoSpeak(on) {
  try {
    localStorage.setItem(AUTO_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function speechSynthesisAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speechRecognitionAvailable() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function pickEnglishVoice() {
  if (!speechSynthesisAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /Microsoft (David|Mark)|Google UK English Male|Daniel|Matthew|Alex/i.test(v.name))
    || voices.find((v) => v.lang?.startsWith('en') && /male/i.test(v.name))
    || voices.find((v) => v.lang?.startsWith('en'))
    || null
  );
}

export function stopSpeaking() {
  if (!speechSynthesisAvailable()) return;
  window.speechSynthesis.cancel();
}

export function speakRevan(text, { onStart, onEnd, onError } = {}) {
  const clean = String(text || '').trim();
  if (!clean || !speechSynthesisAvailable()) return false;

  stopSpeaking();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 1.03;
  utter.pitch = 0.92;
  const voice = pickEnglishVoice();
  if (voice) utter.voice = voice;
  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = (e) => onError?.(e);

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const v = pickEnglishVoice();
      if (v) utter.voice = v;
      window.speechSynthesis.speak(utter);
    }, { once: true });
  }
  window.speechSynthesis.speak(utter);
  return true;
}

export function listenOnce({ onResult, onError, onEnd } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = 'en-US';
  rec.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) onResult?.(transcript);
  };
  rec.onerror = (e) => onError?.(e);
  rec.onend = () => onEnd?.();
  rec.start();
  return rec;
}

export function markdownToSpeakable(markdown) {
  return String(markdown || '')
    .replace(/\*\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[✓✗•#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}