import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "waitless_audio_call_settings_v1";

const DEFAULT_SETTINGS = {
  enabled: true,
  voiceURI: null,
  rate: 0.9,
  volume: 1,
};

function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function getAvailableVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function useAudioCall() {
  const supported =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

  const initial = loadSettings();
  const [enabled, setEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(initial.voiceURI);
  const [rate, setRate] = useState(initial.rate);
  const [volume, setVolume] = useState(initial.volume);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const settingsRef = useRef(initial);

  useEffect(() => {
    settingsRef.current = { enabled, voiceURI: selectedVoiceURI, rate, volume };
    saveSettings(settingsRef.current);
  }, [enabled, selectedVoiceURI, rate, volume]);

  useEffect(() => {
    if (!supported) return;
    const updateVoices = () => {
      const v = getAvailableVoices();
      const english = v.filter((voice) =>
        voice.lang?.toLowerCase().startsWith("en"),
      );
      const list = english.length > 0 ? english : v;
      setVoices(list);
      const selectionValid = list.some(
        (voice) => voice.voiceURI === selectedVoiceURI,
      );
      if (!selectionValid && list.length > 0) {
        const preferred =
          list.find((voice) => /google us english/i.test(voice.name)) ??
          list.find((voice) => voice.lang === "en-US") ??
          list.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ??
          list.find((voice) => voice.default) ??
          list[0];
        setSelectedVoiceURI(preferred.voiceURI);
      }
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [supported, selectedVoiceURI]);

  // Short two-tone chime before the spoken call, like a hospital PA ding —
  // cuts through waiting-area noise so patients notice the announcement.
  const playChime = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return 0;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.22 * (settingsRef.current.volume ?? 1);
      master.connect(ctx.destination);
      [880, 660].forEach((frequency, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.17);
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(master);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.18);
      });
      window.setTimeout(() => ctx.close().catch(() => {}), 900);
      return 480; // ms before speech starts
    } catch {
      return 0;
    }
  }, []);

  const buildUtterance = useCallback(
    (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.volume = volume;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      return utterance;
    },
    [voices, selectedVoiceURI, rate, volume],
  );

  const speak = useCallback(
    (text) => {
      if (!supported || !enabled || !text) return;
      window.speechSynthesis.cancel();
      const delay = playChime();
      const utterance = buildUtterance(text);
      // Chrome silently drops utterances queued synchronously after cancel().
      window.setTimeout(() => {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      }, Math.max(delay, 60));
    },
    [supported, enabled, buildUtterance, playChime],
  );

  const preview = useCallback(
    (text) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = buildUtterance(text);
      window.setTimeout(() => {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      }, 60);
    },
    [supported, buildUtterance],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const enableAudio = useCallback(() => {
    setEnabled(true);
    if (supported && window.speechSynthesis.speaking === false) {
      const warmup = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(warmup);
    }
  }, [supported]);

  const disableAudio = useCallback(() => {
    setEnabled(false);
    stop();
  }, [stop]);

  // Browsers gate speech/AudioContext playback behind a user gesture, so the
  // engine warms up on the first real interaction with the board page.
  useEffect(() => {
    if (!supported) return undefined;
    const events = ["pointerdown", "keydown", "touchstart"];
    const unlock = () => {
      enableAudio();
      events.forEach((type) => window.removeEventListener(type, unlock));
    };
    events.forEach((type) =>
      window.addEventListener(type, unlock, { once: true }),
    );
    return () => {
      events.forEach((type) => window.removeEventListener(type, unlock));
    };
  }, [supported, enableAudio]);

  // Chrome silently pauses speechSynthesis on idle/hidden tabs — queued calls
  // then play minutes late. Nudge resume() regularly so calls stay instant.
  useEffect(() => {
    if (!supported || !enabled) return undefined;
    const id = window.setInterval(() => {
      window.speechSynthesis.resume();
    }, 5000);
    return () => window.clearInterval(id);
  }, [supported, enabled]);

  return {
    supported,
    enabled,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    rate,
    setRate,
    volume,
    setVolume,
    isSpeaking,
    speak,
    preview,
    stop,
    enableAudio,
    disableAudio,
  };
}

// FIFO queue for call announcements — each called ticket holds the screen and
// the speaker for `holdMs` before the next one takes over, so back-to-back
// calls never cut each other off.
export function useAnnouncementQueue({ holdMs = 9000 } = {}) {
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState(null);

  const enqueue = useCallback((item) => {
    setPending((list) => [...list, item]);
  }, []);

  const clear = useCallback(() => {
    setPending([]);
    setActive(null);
  }, []);

  useEffect(() => {
    if (active || pending.length === 0) return undefined;
    const [next, ...rest] = pending;
    setPending(rest);
    setActive(next);
    const id = setTimeout(() => setActive(null), holdMs);
    return () => clearTimeout(id);
  }, [active, pending, holdMs]);

  return { active, pending, enqueue, clear };
}
