'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@/lib/translations';

// Echo-proof speech engine.
//
// The cardinal rule: the microphone is NEVER open while Themis is speaking.
// TTS and STT are strictly sequenced, speak() hard-stops recognition first,
// and listening only begins after the utterance's onend fires (plus a small
// grace period so the tail of the TTS audio can't leak into the mic).

export type SpeechState = 'idle' | 'speaking' | 'listening' | 'processing';

interface UseSpeechOptions {
  lang: Lang;
  // Fired when the witness has answered and gone silent (auto-submit),
  // or when they pressed the done button (page calls submit directly).
  onAutoSubmit: (text: string) => void;
  // Fired on a locally recognized "repeat the question" voice command.
  onRepeatCommand: () => void;
  // Fired after prolonged silence with no speech, once per question.
  onSilenceCheckIn: () => void;
  silenceSubmitMs?: number;
  checkInMs?: number;
}

const REPEAT_PATTERNS = [
  /repeat (the )?question/i,
  /say (that|it) again/i,
  /سوال دہرائیں/,
  /دوبارہ (کہیں|بتائیں|پوچھیں)/,
];

// Voices load asynchronously in most browsers; the first getVoices() call
// often returns []. Resolve them once and cache.
let cachedVoices: SpeechSynthesisVoice[] = [];
function ensureVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([]);
    const now = window.speechSynthesis.getVoices();
    if (now.length > 0) {
      cachedVoices = now;
      return resolve(now);
    }
    const timer = setTimeout(() => resolve(window.speechSynthesis.getVoices()), timeoutMs);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

// Best voice for the language. For Urdu, prefer Pakistani voices and the
// higher-quality "Natural/Online" ones Edge exposes; never fall back to a
// non-Urdu voice (an English voice cannot read the script).
function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  if (lang === 'ur') {
    const urdu = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('ur') || /urdu/i.test(v.name)
    );
    if (urdu.length === 0) return null;
    return (
      urdu.find((v) => /natural|online/i.test(v.name) && v.lang.toLowerCase() === 'ur-pk') ||
      urdu.find((v) => v.lang.toLowerCase() === 'ur-pk') ||
      urdu[0]
    );
  }
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return (
    en.find((v) => /natural|online/i.test(v.name) && v.lang.toLowerCase() === 'en-us') ||
    en.find((v) => v.lang.toLowerCase() === 'en-us') ||
    en[0] ||
    null
  );
}

export function useSpeech({
  lang,
  onAutoSubmit,
  onRepeatCommand,
  onSilenceCheckIn,
  silenceSubmitMs = 4000,
  checkInMs = 30000,
}: UseSpeechOptions) {
  const [state, setState] = useState<SpeechState>('idle');
  const [buffer, setBuffer] = useState('');
  const [interim, setInterim] = useState('');
  const [ttsSupported, setTtsSupported] = useState(true);
  // True when the device has no voice for the chosen language (typically
  // Urdu on browsers without an Urdu voice pack). Questions appear as text.
  const [voiceMissing, setVoiceMissing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Each speak() bumps the epoch; stale watchdogs from an earlier utterance
  // must never fire into a newer one (they would open the mic mid-speech).
  const speakEpochRef = useRef(0);
  const finalRef = useRef('');
  const stateRef = useRef<SpeechState>('idle');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInFiredRef = useRef(false);
  const callbacksRef = useRef({ onAutoSubmit, onRepeatCommand, onSilenceCheckIn });
  callbacksRef.current = { onAutoSubmit, onRepeatCommand, onSilenceCheckIn };

  const setStateBoth = (s: SpeechState) => {
    stateRef.current = s;
    setState(s);
  };

  const clearTimers = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current);
    silenceTimerRef.current = null;
    checkInTimerRef.current = null;
  };

  // Hard-stop the microphone. Used before any TTS and on unmount.
  const stopListening = useCallback(() => {
    clearTimers();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const text = finalRef.current.trim();
      if (text && stateRef.current === 'listening') {
        stopListening();
        setStateBoth('processing');
        callbacksRef.current.onAutoSubmit(text);
      }
    }, silenceSubmitMs);
  }, [silenceSubmitMs, stopListening]);

  const startListening = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      // No speech recognition (e.g. iOS). Enter listening state anyway so the
      // typed answer field and submit button work, TTS still speaks questions.
      stopListening();
      finalRef.current = '';
      setBuffer('');
      setInterim('');
      setStateBoth('listening');
      return;
    }

    stopListening();
    finalRef.current = '';
    setBuffer('');
    setInterim('');
    checkInFiredRef.current = false;
    setStateBoth('listening');

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang === 'ur' ? 'ur-PK' : 'en-US';

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = '';
      let newFinal = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) newFinal += text + ' ';
        else interimText += text;
      }

      if (newFinal) {
        // Local voice command: "repeat the question", instant, no server trip
        if (!finalRef.current.trim() && REPEAT_PATTERNS.some((p) => p.test(newFinal))) {
          stopListening();
          callbacksRef.current.onRepeatCommand();
          return;
        }
        finalRef.current += newFinal;
        setBuffer(finalRef.current.trim());
        armSilenceTimer();
      }
      setInterim(interimText);
      if (interimText && silenceTimerRef.current) {
        // Witness resumed speaking, hold the auto-submit
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (interimText === '' && finalRef.current.trim()) armSilenceTimer();
    };

    rec.onerror = () => {};
    rec.onend = () => {
      // Chrome ends recognition after ~60s of audio or silence; restart while listening
      if (stateRef.current === 'listening' && recognitionRef.current === rec) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };

    try {
      rec.start();
    } catch {
      /* ignore */
    }
    recognitionRef.current = rec;

    // Gentle check-in if the witness hasn't spoken at all
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current);
    checkInTimerRef.current = setTimeout(() => {
      if (!finalRef.current.trim() && stateRef.current === 'listening' && !checkInFiredRef.current) {
        checkInFiredRef.current = true;
        callbacksRef.current.onSilenceCheckIn();
      }
    }, checkInMs);
  }, [lang, armSilenceTimer, checkInMs, stopListening]);

  // Speak with the mic hard-muted; open the mic only after TTS fully ends.
  const speak = useCallback(
    (text: string, opts?: { thenListen?: boolean; onDone?: () => void }) => {
      stopListening();
      setStateBoth('speaking');
      setBuffer('');
      setInterim('');

      const epoch = ++speakEpochRef.current;
      const finish = () => {
        if (speakEpochRef.current !== epoch) return;
        // Grace period: let the audio tail fade before the mic opens
        setTimeout(() => {
          if (speakEpochRef.current !== epoch) return;
          if (opts?.thenListen) startListening();
          else setStateBoth('idle');
          opts?.onDone?.();
        }, 350);
      };

      if (!('speechSynthesis' in window)) {
        setTtsSupported(false);
        // No TTS, go straight to listening so the interview still works
        finish();
        return;
      }

      window.speechSynthesis.cancel();

      void ensureVoices().then((voices) => {
        const voice = pickVoice(voices.length ? voices : cachedVoices, lang);

        if (lang === 'ur' && !voice) {
          // No Urdu voice on this device. Speaking Urdu text with an English
          // voice produces gibberish or silence, so show the question as
          // text instead and keep the flow moving.
          setVoiceMissing(true);
          finish();
          return;
        }
        setVoiceMissing(false);

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
        utter.rate = lang === 'ur' ? 0.9 : 0.92;
        if (voice) utter.voice = voice;

        let done = false;
        const once = () => {
          if (done) return;
          done = true;
          finish();
        };
        utter.onend = once;
        utter.onerror = once;
        // Watchdog: some engines never fire onend for unsupported voices.
        const expectedMs = Math.min(60_000, 4000 + text.length * 90);
        setTimeout(once, expectedMs);

        window.speechSynthesis.speak(utter);
      });
    },
    [lang, startListening, stopListening]
  );

  // Take whatever is in the buffer now (manual "done answering" button)
  const takeBuffer = useCallback((): string => {
    const text = finalRef.current.trim();
    stopListening();
    setStateBoth('processing');
    return text;
  }, [stopListening]);

  const goIdle = useCallback(() => {
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setStateBoth('idle');
  }, [stopListening]);

  const setProcessing = useCallback(() => {
    stopListening();
    setStateBoth('processing');
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopListening]);

  return {
    state,
    buffer,
    interim,
    ttsSupported,
    voiceMissing,
    speak,
    startListening,
    takeBuffer,
    setProcessing,
    goIdle,
  };
}
