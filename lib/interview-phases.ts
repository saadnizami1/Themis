export type Phase =
  | 'rapport'
  | 'narrative_practice'
  | 'context_reinstatement'
  | 'substantive'
  | 'clarification'
  | 'closing';

export interface PhaseConfig {
  id: Phase;
  label: string;
  labelUr: string;
  description: string;
  minExchanges: number;
  maxExchanges: number;
  openingPrompt: string;
  openingPromptUr: string;
}

export const PHASES: PhaseConfig[] = [
  {
    id: 'rapport',
    label: 'Introduction',
    labelUr: 'تعارف',
    description: 'Ground rules and rapport building',
    minExchanges: 1,
    maxExchanges: 2,
    openingPrompt:
      "Hello. My name is Themis and I'm going to ask you some questions about what happened. There are no right or wrong answers. I just want to understand what you remember. Before we start, I want to go over three important things: First, if you don't know the answer to something, please just say 'I don't know'. Second, if you don't understand my question, please tell me and I'll ask it differently. Third, if I say something that isn't correct, please tell me. You can also say 'I need a break' at any time, and we will pause. Do you have any questions before we begin?",
    openingPromptUr:
      'السلام علیکم۔ میرا نام Themis ہے اور میں آپ سے کچھ سوالات پوچھنے والا ہوں۔ کوئی صحیح یا غلط جواب نہیں ہوتا۔ میں صرف یہ سمجھنا چاہتا ہوں کہ آپ کو کیا یاد ہے۔ شروع کرنے سے پہلے، میں تین اہم باتیں بتانا چاہتا ہوں: پہلی، اگر آپ کو کسی سوال کا جواب نہیں معلوم تو براہ کرم صرف "مجھے نہیں معلوم" کہیں۔ دوسری، اگر آپ میرا سوال نہ سمجھیں تو مجھے بتائیں اور میں اسے دوبارہ پوچھوں گا۔ تیسری، اگر میں کوئی غلط بات کہوں تو براہ کرم مجھے بتائیں۔ آپ کسی بھی وقت "مجھے وقفہ چاہیے" کہہ سکتے ہیں اور ہم رک جائیں گے۔ کیا آپ کا کوئی سوال ہے؟',
  },
  {
    id: 'narrative_practice',
    label: 'Warm-Up',
    labelUr: 'تیاری',
    description: 'Neutral free recall practice',
    minExchanges: 1,
    maxExchanges: 2,
    openingPrompt:
      "Before we talk about why you're here today, I'd like to practice. Can you tell me about what you did this morning, from when you woke up? Take your time and tell me everything you remember.",
    openingPromptUr:
      'آج کی بات شروع کرنے سے پہلے، میں تھوڑی مشق کرنا چاہتا ہوں۔ کیا آپ مجھے بتا سکتے ہیں کہ آج صبح آپ نے کیا کیا، جب سے آپ اٹھے؟ وقت لیں اور جو کچھ یاد ہے سب بتائیں۔',
  },
  {
    id: 'context_reinstatement',
    label: 'Recollection',
    labelUr: 'یادداشت',
    description: 'Mental context reinstatement',
    minExchanges: 1,
    maxExchanges: 2,
    openingPrompt:
      "Now I'd like you to think back to that day. If you're comfortable, close your eyes for a moment. Think about where you were. What could you see around you? What could you hear? How were you feeling at that time? Take your time.",
    openingPromptUr:
      'اب میں چاہتا ہوں کہ آپ اس دن کے بارے میں سوچیں۔ اگر آپ ٹھیک سمجھیں تو ایک لمحے کے لیے آنکھیں بند کریں۔ سوچیں کہ آپ کہاں تھے۔ آپ کے ارد گرد کیا نظر آ رہا تھا؟ آپ کیا سن سکتے تھے؟ اس وقت آپ کیسا محسوس کر رہے تھے؟ وقت لیں۔',
  },
  {
    id: 'substantive',
    label: 'Your Account',
    labelUr: 'آپ کی بات',
    description: 'Free narrative + open probes',
    minExchanges: 2,
    maxExchanges: 6,
    openingPrompt:
      'Now, in your own words, please tell me everything that happened, from the very beginning to the very end. Take as much time as you need.',
    openingPromptUr:
      'اب، اپنے الفاظ میں، مجھے وہ سب کچھ بتائیں جو ہوا، بالکل شروع سے آخر تک۔ جتنا وقت چاہیں لیں۔',
  },
  {
    id: 'clarification',
    label: 'Follow-Up',
    labelUr: 'مزید سوالات',
    description: 'Minimal, witness-grounded clarification',
    minExchanges: 1,
    maxExchanges: 4,
    openingPrompt:
      "Thank you for telling me all of that. I'd like to ask a few more questions about what you've already described.",
    openingPromptUr:
      'یہ سب بتانے کے لیے شکریہ۔ میں آپ کی بیان کردہ باتوں کے بارے میں کچھ اور سوالات پوچھنا چاہتا ہوں۔',
  },
  {
    id: 'closing',
    label: 'Closing',
    labelUr: 'اختتام',
    description: 'Closing and final check',
    minExchanges: 1,
    maxExchanges: 2,
    openingPrompt:
      "We're almost done. Is there anything else you want to tell me that I haven't asked about? Is there anything you're unsure about in what you've told me today?",
    openingPromptUr:
      'ہم تقریباً ختم ہو گئے ہیں۔ کیا کوئی اور بات ہے جو آپ مجھے بتانا چاہتے ہیں جو میں نے نہیں پوچھی؟ کیا کوئی بات ہے جس کے بارے میں آپ یقین نہیں رکھتے؟',
  },
];

export function getPhaseByIndex(index: number): PhaseConfig {
  return PHASES[Math.min(index, PHASES.length - 1)];
}

export function getPhaseById(id: Phase): PhaseConfig {
  return PHASES.find((p) => p.id === id) || PHASES[0];
}

export function shouldAdvancePhase(
  phase: Phase,
  exchangeCount: number,
  witnessResponses: string[]
): boolean {
  const config = getPhaseById(phase);

  if (exchangeCount < config.minExchanges) return false;
  if (exchangeCount >= config.maxExchanges) return true;

  // Heuristic: if last witness response is very short (< 10 words) and we've hit min, advance
  const lastResponse = witnessResponses[witnessResponses.length - 1] || '';
  const wordCount = lastResponse.trim().split(/\s+/).length;
  if (exchangeCount >= config.minExchanges + 1 && wordCount < 10) return true;

  return false;
}

export function getNextPhase(current: Phase): Phase | null {
  const idx = PHASES.findIndex((p) => p.id === current);
  if (idx === -1 || idx >= PHASES.length - 1) return null;
  return PHASES[idx + 1].id;
}
