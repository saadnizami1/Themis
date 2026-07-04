'use client';

import { useState } from 'react';
import type { Lang } from '@/lib/translations';
import { t } from '@/lib/translations';

interface ConsentScreenProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onConsent: (name: string, age: string) => void;
}

export default function ConsentScreen({ lang, onLangChange, onConsent }: ConsentScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const isRTL = lang === 'ur';
  const isMinor = age !== '' && Number(age) < 18;

  const inputCls =
    'w-full bg-white border border-line rounded-lg px-4 py-2.5 text-ink focus:border-accent outline-none transition-colors';

  return (
    <div
      className={`max-w-lg w-full bg-white rounded-2xl border border-line p-6 sm:p-8 space-y-6 animate-fadeUp ${isRTL ? 'text-right' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-faint text-xs uppercase tracking-widest mb-1">Themis</p>
          <h1 className={`text-xl sm:text-2xl font-semibold text-ink ${isRTL ? 'font-urdu' : ''}`}>
            {t(lang, 'welcome')}
          </h1>
        </div>
        <select
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
          className="bg-white border border-line text-ink rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
        >
          <option value="en">English</option>
          <option value="ur">اردو</option>
        </select>
      </div>

      <p className={`text-muted text-sm leading-relaxed ${isRTL ? 'font-urdu text-base' : ''}`}>
        {t(lang, 'welcomeSubtitle')}
      </p>

      <div className="space-y-3">
        <div>
          <label className={`block text-sm text-muted mb-1.5 ${isRTL ? 'font-urdu' : ''}`}>
            {t(lang, 'yourName')}
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={`block text-sm text-muted mb-1.5 ${isRTL ? 'font-urdu' : ''}`}>
            {t(lang, 'yourAge')}
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={1}
            max={120}
            className={`${inputCls} w-32`}
          />
          {isMinor && (
            <p className={`text-amber-800 text-xs mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${isRTL ? 'font-urdu text-sm' : ''}`}>
              {lang === 'ur'
                ? 'چونکہ آپ کی عمر 18 سال سے کم ہے، براہ کرم یقینی بنائیں کہ کوئی سرپرست یا قابلِ اعتماد بالغ آپ کے ساتھ موجود ہو۔'
                : 'Because you are under 18, please make sure a guardian or trusted adult is present with you.'}
            </p>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-line p-4">
        <h2 className={`font-medium text-ink mb-2 text-sm ${isRTL ? 'font-urdu text-base' : ''}`}>
          {t(lang, 'consentTitle')}
        </h2>
        <p className={`text-muted text-sm leading-relaxed ${isRTL ? 'font-urdu text-base' : ''}`}>
          {t(lang, 'consentText')}
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-accent"
          />
          <span className={`text-sm text-ink ${isRTL ? 'font-urdu text-base' : ''}`}>
            {t(lang, 'consentCheckbox')}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 accent-accent"
          />
          <span className={`text-sm text-ink ${isRTL ? 'font-urdu text-base' : ''}`}>
            {isRTL ? (
              t(lang, 'consentTerms')
            ) : (
              <>
                I have read and accept the{' '}
                <a href="/terms" target="_blank" className="text-accent underline underline-offset-2">
                  Terms of Use
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-accent underline underline-offset-2">
                  Privacy Notice
                </a>
              </>
            )}
          </span>
        </label>
      </div>

      <button
        disabled={!agreed || !agreedTerms || !name.trim()}
        onClick={() => onConsent(name.trim(), age)}
        className="w-full py-3 rounded-lg font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span className={isRTL ? 'font-urdu' : ''}>{t(lang, 'beginInterview')}</span>
      </button>
    </div>
  );
}
