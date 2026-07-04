'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@/lib/translations';

// Echo-proof speech engine.
//
// The cardinal rule: the microphone is NEVER open while Themis is speaking.
// TTS and STT are strictly sequenced — speak() hard-stops recognition first,
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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
      // typed answer field and submit button work — TTS still speaks questions.
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
        // Local voice command: "repeat the question" — instant, no server trip
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
        // Witness resumed speaking — hold the auto-submit
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

      if (!('speechSynthesis' in window)) {
        setTtsSupported(false);
        // No TTS — go straight to listening so the interview still works
        if (opts?.thenListen) startListening();
        else setStateBoth('idle');
        opts?.onDone?.();
        return;
      }

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
      utter.rate = 0.92;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith(lang === 'ur' ? 'ur' : 'en'));
      if (preferred) utter.voice = preferred;

      const finish = () => {
        // Grace period: let the audio tail fade before the mic opens
        setTimeout(() => {
          if (opts?.thenListen) startListening();
          else setStateBoth('idle');
          opts?.onDone?.();
        }, 350);
      };
      utter.onend = finish;
      utter.onerror = finish;

      window.speechSynthesis.speak(utter);
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
    speak,
    startListening,
    takeBuffer,
    setProcessing,
    goIdle,
  };
}
