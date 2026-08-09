import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "waitless_audio_call_settings_v1";

const DEFAULT_SETTINGS = {
  enabled: false,
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
  const [enabled, setEnabled] = useState(initial.enabled);
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
      setVoices(v);
      if (!selectedVoiceURI && v.length > 0) {
        const defaultVoice =
          v.find((voice) => voice.default) ?? v[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [supported, selectedVoiceURI]);

  const speak = useCallback(
    (text) => {
      if (!supported || !enabled || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.volume = volume;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported, enabled, voices, selectedVoiceURI, rate, volume],
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
    stop,
    enableAudio,
    disableAudio,
  };
}
