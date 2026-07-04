'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Lang } from '@/lib/translations';
import { t } from '@/lib/translations';
import ConsentScreen from '@/components/InterviewUI/ConsentScreen';
import PhaseIndicator from '@/components/InterviewUI/PhaseIndicator';
import { useSpeech } from '@/components/InterviewUI/useSpeech';
import type { SpeechState } from '@/components/InterviewUI/useSpeech';
import type { VideoRecorderHandle } from '@/components/InterviewUI/VideoRecorder';

const VideoRecorder = dynamic(() => import('@/components/InterviewUI/VideoRecorder'), {
  ssr: false,
});

type Step =
  | 'loading'
  | 'error'
  | 'consent'
  | 'briefing'
  | 'resume-prompt'
  | 'interview'
  | 'break'
  | 'escalated'
  | 'finishing'
  | 'complete'
  | 'stopped'
  | 'already-completed';

type TurnEvent = { type: 'start' } | { type: 'resume' } | { type: 'answer'; text: string };

interface TurnResponse {
  action: 'speak' | 'break' | 'escalated' | 'end';
  utterance: string;
  phaseIndex: number;
  status: string;
  endReason?: 'closing_complete' | 'witness_stopped';
  error?: string;
}

function StateIndicator({ state, label }: { state: SpeechState; label: string }) {
  const dot =
    state === 'speaking'
      ? 'bg-accent'
      : state === 'listening'
      ? 'bg-emerald-500'
      : 'bg-faint';
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot} ${state !== 'idle' ? 'animate-pulse' : ''}`} />
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}

export default function InterviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('loading');
  const [lang, setLang] = useState<Lang>('en');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [turnError, setTurnError] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);

  const videoRef = useRef<VideoRecorderHandle>(null);
  const lastEventRef = useRef<TurnEvent | null>(null);
  const stepRef = useRef<Step>('loading');
  stepRef.current = step;

  // ── Server communication ──
  const postTurn = useCallback(
    async (event: TurnEvent): Promise<TurnResponse | null> => {
      if (!interviewId) return null;
      lastEventRef.current = event;
      try {
        const res = await fetch(`/api/interviews/${interviewId}/turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, event }),
        });
        if (!res.ok) return null;
        return (await res.json()) as TurnResponse;
      } catch {
        return null;
      }
    },
    [interviewId, token]
  );

  const uploadVideo = useCallback(
    async (blob: Blob) => {
      if (!interviewId) return;
      try {
        // Signed URL first: the recording goes straight to storage. The
        // serverless proxy path is a local-development fallback.
        const signRes = await fetch(`/api/interviews/${interviewId}/video?token=${token}`, {
          method: 'PUT',
        });
        const sign = await signRes.json();
        if (sign.mode === 'direct') {
          const put = await fetch(sign.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'video/webm' },
            body: blob,
          });
          if (put.ok) {
            await fetch(`/api/interviews/${interviewId}/video?token=${token}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storedPath: sign.storedPath }),
            });
            return;
          }
        }
        await fetch(`/api/interviews/${interviewId}/video?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'video/webm' },
          body: blob,
        });
      } catch {
        /* best-effort; the transcript is already safe server-side */
      }
    },
    [interviewId, token]
  );

  const finishInterview = useCallback(
    async (reason?: string) => {
      if (stepRef.current !== 'escalated') setStep('finishing');
      const blob = await videoRef.current?.stop();
      if (blob && interviewId) await uploadVideo(blob);
      if (interviewId) {
        await fetch(`/api/interviews/${interviewId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, endReason: reason }),
        }).catch(() => {});
      }
      if (stepRef.current !== 'escalated') {
        setStep(reason === 'witness_stopped' ? 'stopped' : 'complete');
      }
    },
    [interviewId, token, uploadVideo]
  );

  const handleTurnResult = useCallback(
    (result: TurnResponse | null) => {
      if (!result) {
        setTurnError(true);
        return;
      }
      setTurnError(false);
      setPhaseIndex(result.phaseIndex);
      setCurrentUtterance(result.utterance);
      setTypedAnswer('');

      if (result.action === 'speak') {
        speakRef.current(result.utterance, { thenListen: true });
      } else if (result.action === 'break') {
        speakRef.current(result.utterance, {
          onDone: () => {
            videoRef.current?.pause();
            setStep('break');
          },
        });
      } else if (result.action === 'escalated') {
        speakRef.current(result.utterance, {
          onDone: () => {
            setStep('escalated');
            void finishInterview('escalated');
          },
        });
      } else if (result.action === 'end') {
        speakRef.current(result.utterance, {
          onDone: () => void finishInterview(result.endReason),
        });
      }
    },
    [finishInterview]
  );

  const sendAnswer = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const result = await postTurn({ type: 'answer', text: text.trim() });
      handleTurnResult(result);
    },
    [postTurn, handleTurnResult]
  );

  const speech = useSpeech({
    lang,
    onAutoSubmit: (text) => void sendAnswer(text),
    onRepeatCommand: () => {
      if (currentUtterance) speakRef.current(currentUtterance, { thenListen: true });
    },
    onSilenceCheckIn: () => {
      speakRef.current(t(lang, 'checkIn'), { thenListen: true });
    },
  });
  const speakRef = useRef(speech.speak);
  speakRef.current = speech.speak;

  // ── Load & validate the link ──
  useEffect(() => {
    setSttSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    fetch(`/api/interviews/token/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 410) {
          setStep('already-completed');
          return;
        }
        if (!r.ok || data.error) {
          setStep('error');
          return;
        }
        setInterviewId(data.id);
        if (data.language === 'ur' || data.language === 'en') setLang(data.language);
        if (data.status === 'escalated') {
          setStep('escalated');
        } else if (data.status === 'in_progress' && data.consentAt) {
          setStep('resume-prompt');
        } else {
          setStep('consent');
        }
      })
      .catch(() => setStep('error'));
  }, [token]);

  // ── Handlers ──
  const handleConsent = useCallback(
    async (name: string, age: string) => {
      if (!interviewId) return;
      await fetch(`/api/interviews/${interviewId}/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, victimName: name, victimAge: age, language: lang }),
      });
      setStep('briefing');
    },
    [interviewId, token, lang]
  );

  const startInterview = useCallback(async () => {
    setStep('interview');
    await videoRef.current?.start();
    speech.setProcessing();
    handleTurnResult(await postTurn({ type: 'start' }));
  }, [postTurn, handleTurnResult, speech]);

  const resumeFromBreak = useCallback(async () => {
    setStep('interview');
    videoRef.current?.resume();
    speech.setProcessing();
    handleTurnResult(await postTurn({ type: 'resume' }));
  }, [postTurn, handleTurnResult, speech]);

  const resumeSession = useCallback(async () => {
    setStep('interview');
    await videoRef.current?.start();
    speech.setProcessing();
    handleTurnResult(await postTurn({ type: 'resume' }));
  }, [postTurn, handleTurnResult, speech]);

  const handleManualSubmit = useCallback(() => {
    const spoken = speech.takeBuffer();
    const answer = typedAnswer.trim() || spoken;
    if (answer) void sendAnswer(answer);
    else speech.startListening();
  }, [speech, typedAnswer, sendAnswer]);

  const retryLastEvent = useCallback(async () => {
    if (!lastEventRef.current) return;
    setTurnError(false);
    speech.setProcessing();
    handleTurnResult(await postTurn(lastEventRef.current));
  }, [postTurn, handleTurnResult, speech]);

  const isRTL = lang === 'ur';
  const dirProps = { dir: isRTL ? ('rtl' as const) : ('ltr' as const) };
  const urduCls = isRTL ? 'font-urdu' : '';

  const centered = (content: React.ReactNode) => (
    <div className="min-h-screen bg-paper flex items-center justify-center p-5" {...dirProps}>
      {content}
    </div>
  );

  const card = (content: React.ReactNode) => (
    <div className="max-w-md w-full text-center space-y-4 bg-white rounded-2xl border border-line p-6 sm:p-8 animate-fadeUp">
      {content}
    </div>
  );

  if (step === 'loading')
    return centered(<p className="text-faint animate-pulse text-sm">{t(lang, 'loading')}</p>);

  if (step === 'error')
    return centered(
      card(
        <p className="text-ink">
          This interview link could not be loaded. Please check it with the investigating officer.
        </p>
      )
    );

  if (step === 'already-completed')
    return centered(card(<p className={`text-ink ${urduCls}`}>{t(lang, 'alreadyCompleted')}</p>));

  if (step === 'consent')
    return centered(<ConsentScreen lang={lang} onLangChange={setLang} onConsent={handleConsent} />);

  if (step === 'briefing')
    return centered(
      <div className="max-w-lg w-full bg-white rounded-2xl border border-line p-6 sm:p-8 space-y-6 animate-fadeUp" {...dirProps}>
        <h2 className={`text-lg font-semibold text-ink ${urduCls}`}>{t(lang, 'groundRulesTitle')}</h2>
        <ul className="space-y-3">
          {[
            t(lang, 'groundRule1'),
            t(lang, 'groundRule2'),
            t(lang, 'groundRule3'),
            t(lang, 'groundRule4'),
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-surface border border-line text-muted text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className={`text-muted ${isRTL ? 'font-urdu text-base' : 'text-sm'}`}>{rule}</span>
            </li>
          ))}
        </ul>
        {!sttSupported && (
          <p className={`text-amber-800 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${urduCls}`}>
            {lang === 'ur'
              ? 'اس براؤزر میں آواز سے جواب دینا دستیاب نہیں۔ آپ اپنے جوابات ٹائپ کر سکتے ہیں۔'
              : "Voice input isn't available in this browser. You can type your answers, questions will still be spoken aloud."}
          </p>
        )}
        <p className={`text-faint text-xs ${urduCls}`}>{t(lang, 'micPermission')}</p>
        <button
          onClick={startInterview}
          className="w-full py-3 rounded-lg font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
        >
          <span className={urduCls}>{t(lang, 'continueBtn')}</span>
        </button>
      </div>
    );

  if (step === 'resume-prompt')
    return centered(
      card(
        <>
          <h2 className={`text-lg font-semibold text-ink ${urduCls}`}>{t(lang, 'resumeTitle')}</h2>
          <p className={`text-muted ${isRTL ? 'font-urdu text-base' : 'text-sm'}`}>
            {t(lang, 'resumeMessage')}
          </p>
          <button
            onClick={resumeSession}
            className="w-full py-3 rounded-lg font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
          >
            <span className={urduCls}>{t(lang, 'resumeBtn')}</span>
          </button>
        </>
      )
    );

  if (step === 'break')
    return centered(
      card(
        <>
          <h2 className={`text-lg font-semibold text-ink ${urduCls}`}>{t(lang, 'breakTitle')}</h2>
          <p className={`text-muted ${isRTL ? 'font-urdu text-base' : 'text-sm'}`}>
            {t(lang, 'breakMessage')}
          </p>
          <button
            onClick={resumeFromBreak}
            className="w-full py-3 rounded-lg font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
          >
            <span className={urduCls}>{t(lang, 'resumeBtn')}</span>
          </button>
        </>
      )
    );

  if (step === 'escalated')
    return centered(
      <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 p-6 sm:p-8 space-y-5 animate-fadeUp" {...dirProps}>
        <h2 className={`text-lg font-semibold text-ink text-center ${urduCls}`}>
          {t(lang, 'escalationTitle')}
        </h2>
        <p className={`text-muted text-center ${isRTL ? 'font-urdu text-base' : 'text-sm'}`}>
          {t(lang, 'escalationMessage')}
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className={`text-red-900 text-sm mb-1 ${urduCls}`}>{t(lang, 'escalationDanger')}</p>
          <p className="text-red-900 font-semibold text-lg">{t(lang, 'emergencyNumbers')}</p>
        </div>
        <p className={`text-faint text-center ${isRTL ? 'font-urdu text-sm' : 'text-xs'}`}>
          {t(lang, 'escalationOfficer')}
        </p>
      </div>
    );

  if (step === 'finishing')
    return centered(
      <div className="text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-line border-t-accent animate-spin" />
        <p className={`text-muted text-sm ${urduCls}`}>{t(lang, 'finishing')}</p>
      </div>
    );

  if (step === 'complete' || step === 'stopped')
    return centered(
      card(
        <>
          <h1 className={`text-xl font-semibold text-ink ${urduCls}`}>
            {t(lang, step === 'complete' ? 'thankYouTitle' : 'stoppedTitle')}
          </h1>
          <p className={`text-muted ${isRTL ? 'font-urdu text-base' : 'text-sm'}`}>
            {t(lang, step === 'complete' ? 'thankYouMessage' : 'stoppedMessage')}
          </p>
        </>
      )
    );

  // ── The interview room ──
  const statusLabel =
    speech.state === 'speaking'
      ? t(lang, 'aiSpeaking')
      : speech.state === 'listening'
      ? t(lang, 'listeningLabel')
      : t(lang, 'thinkingLabel');

  return (
    <div className="min-h-screen bg-paper flex flex-col" {...dirProps}>
      <header className="border-b border-line bg-white px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <p className="text-ink text-sm font-semibold tracking-tight shrink-0">Themis</p>
          <div className="flex-1">
            <PhaseIndicator currentPhaseIndex={phaseIndex} lang={lang} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
        <StateIndicator state={speech.state} label={statusLabel} />

        {/* Current question */}
        <div
          className={`bg-white rounded-2xl border border-line px-5 sm:px-7 py-5 ${
            isRTL ? 'text-right font-urdu text-lg leading-loose' : 'text-base sm:text-lg'
          }`}
        >
          <p className="text-ink leading-relaxed">{currentUtterance || t(lang, 'loading')}</p>
        </div>

        {/* Live transcription (hidden if STT unsupported) */}
        {sttSupported && (
          <div
            className={`min-h-[80px] w-full rounded-xl border px-4 py-3 transition-colors ${
              isRTL ? 'font-urdu text-right text-base' : 'text-sm'
            } ${
              speech.state === 'listening' ? 'border-emerald-300 bg-emerald-50/40' : 'border-line bg-white'
            } text-ink`}
          >
            {speech.buffer || speech.interim ? (
              <>
                {speech.buffer} <span className="text-faint">{speech.interim}</span>
              </>
            ) : (
              <span className="text-faint">
                {speech.state === 'listening'
                  ? lang === 'ur'
                    ? 'بولنا شروع کریں…'
                    : 'Start speaking…'
                  : ''}
              </span>
            )}
          </div>
        )}

        {/* Typed answer */}
        {speech.state === 'listening' && (
          <textarea
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder={t(lang, 'typeFallback')}
            className={`w-full bg-white border border-line rounded-xl px-4 py-3 text-ink text-sm resize-none focus:border-accent outline-none transition-colors ${
              isRTL ? 'font-urdu text-right text-base' : ''
            }`}
            rows={sttSupported ? 2 : 4}
          />
        )}

        {/* Voice command hints */}
        {sttSupported && (
          <div className={`flex flex-wrap items-center gap-1.5 text-xs text-faint ${urduCls}`}>
            <span>{t(lang, 'voiceHintTitle')}</span>
            {(['voiceHintRepeat', 'voiceHintBreak', 'voiceHintStop'] as const).map((k) => (
              <span key={k} className="bg-white border border-line rounded-full px-2.5 py-0.5">
                {t(lang, k)}
              </span>
            ))}
          </div>
        )}

        {/* Error / retry */}
        {turnError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-red-900 text-sm">
              {lang === 'ur'
                ? 'رابطے میں مسئلہ ہوا۔ کچھ ضائع نہیں ہوا, دوبارہ کوشش کریں۔'
                : 'Connection problem. Nothing was lost, please retry.'}
            </p>
            <button
              onClick={retryLastEvent}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm rounded-lg shrink-0"
            >
              {lang === 'ur' ? 'دوبارہ' : 'Retry'}
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-end justify-between gap-3 pb-4 mt-auto">
          <VideoRecorder ref={videoRef} />
          <button
            onClick={handleManualSubmit}
            disabled={speech.state !== 'listening' || (!speech.buffer && !typedAnswer.trim())}
            className="px-5 py-3 rounded-lg font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className={urduCls}>{t(lang, 'doneAnswering')}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
