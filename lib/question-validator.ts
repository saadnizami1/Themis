import {
  QUESTION_VALIDATOR_SYSTEM_PROMPT,
  buildValidatorPrompt,
  parseLlmJson,
  jsonCompletion,
} from './ai';

export interface ValidationResult {
  safe: boolean;
  flags: string[];
  reason: string;
  suggested_rewrite: string;
}

export async function validateQuestion(
  question: string,
  transcript: Array<{ role: string; content: string }>
): Promise<ValidationResult> {
  const raw = await jsonCompletion(
    [
      { role: 'system', content: QUESTION_VALIDATOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildValidatorPrompt({ question, transcript }),
      },
    ],
    512
  );
  const parsed = parseLlmJson<ValidationResult>(raw);

  // If parse fails, assume safe to avoid blocking the interview
  return (
    parsed ?? {
      safe: true,
      flags: [],
      reason: 'Validation parse error; defaulting to safe',
      suggested_rewrite: question,
    }
  );
}

// Models sometimes wrap the rewrite in meta-instructions ("Instead, ask 'X?'").
// Only the question itself may ever be spoken to a witness.
function extractSpokenQuestion(rewrite: string): string {
  const trimmed = rewrite.trim();
  if (/^(instead|consider|try|rephrase|you could|ask)/i.test(trimmed)) {
    const quoted = trimmed.match(/['‘“"]([^'’”"]{10,})['’”"]/);
    if (quoted) return quoted[1].trim();
  }
  return trimmed;
}

export async function validateAndRefine(
  question: string,
  transcript: Array<{ role: string; content: string }>,
  maxRetries = 2
): Promise<string> {
  let candidate = question;

  for (let i = 0; i <= maxRetries; i++) {
    const result = await validateQuestion(candidate, transcript);
    if (result.safe) return candidate;
    const rewrite = result.suggested_rewrite
      ? extractSpokenQuestion(result.suggested_rewrite)
      : '';
    if (rewrite && rewrite !== candidate) {
      candidate = rewrite;
    } else {
      // No useful rewrite; return original and log
      console.warn('[QuestionValidator] Could not produce safe rewrite:', result);
      return candidate;
    }
  }

  return candidate;
}
