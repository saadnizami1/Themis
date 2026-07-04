import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seeding is also the demo-workspace reset: it recreates the demo account's
// sample case from scratch every run. The admin officer account is only
// upserted, never touched beyond that.

const sampleTranscript = [
  { role: 'ai', phase: 'rapport', content: "Hello. My name is Themis and I'm going to ask you some questions about what happened. There are no right or wrong answers. If you don't know something, say 'I don't know'. If a question isn't clear, tell me and I'll ask it differently. You can say 'I need a break' at any time. Do you have any questions before we begin?" },
  { role: 'witness', phase: 'rapport', content: "No, I understand. We can start." },
  { role: 'ai', phase: 'rapport', content: "Thank you. Before we talk about why you're here, how are you feeling about speaking with me today?" },
  { role: 'witness', phase: 'rapport', content: "A bit nervous, but I want to get this done properly." },
  { role: 'ai', phase: 'rapport', content: "That's understandable. Take whatever time you need." },
  { role: 'witness', phase: 'rapport', content: "Okay, thank you." },
  { role: 'ai', phase: 'narrative_practice', content: "Before we talk about why you're here today, I'd like to practice. Can you tell me about what you did this morning, from when you woke up? Take your time and tell me everything you remember." },
  { role: 'witness', phase: 'narrative_practice', content: "I woke up around seven, had breakfast with my wife, dropped my daughter at school on the way to the shop. I opened the shop around nine, same as always." },
  { role: 'ai', phase: 'narrative_practice', content: "Thank you. What happened after you opened the shop?" },
  { role: 'witness', phase: 'narrative_practice', content: "Normal day. Customers in and out. My nephew came at noon to help with the stock." },
  { role: 'ai', phase: 'context_reinstatement', content: "Now I'd like you to think back to that evening. If you're comfortable, close your eyes for a moment. Think about where you were. What could you see around you? What could you hear? Take your time." },
  { role: 'witness', phase: 'context_reinstatement', content: "It was almost dark. I had just pulled the shutter halfway down. The street was quiet, most shops already closed. I could hear the generator from the pharmacy next door." },
  { role: 'ai', phase: 'context_reinstatement', content: "Thank you. What were you doing at that moment?" },
  { role: 'witness', phase: 'context_reinstatement', content: "Counting the day's cash at the counter. I keep the register near the back." },
  { role: 'ai', phase: 'substantive', content: "Now, in your own words, please tell me everything that happened, from the very beginning to the very end. Take as much time as you need." },
  { role: 'witness', phase: 'substantive', content: "Two men came in just before I finished closing. One stayed at the door. The other one came straight to the counter and told me to hand over the cash. He had his hand inside his jacket like he was holding something. I gave him the notes from the register. He also took my phone from the counter. Then they both left on a motorcycle that was waiting outside. The whole thing took maybe two minutes." },
  { role: 'ai', phase: 'substantive', content: "Thank you for telling me that. You mentioned the man at the counter. Tell me everything you remember about him." },
  { role: 'witness', phase: 'substantive', content: "Mid-twenties maybe. Thin. He had a grey hoodie with the hood up and kept his face down. Clean shaven, I think. He spoke quietly, in Urdu, ordinary accent. He never showed a weapon but kept that hand inside the jacket the whole time." },
  { role: 'ai', phase: 'substantive', content: "You said they left on a motorcycle that was waiting outside. Tell me more about that." },
  { role: 'witness', phase: 'substantive', content: "There was a third person driving it. Red bike, one of the common 70cc ones. I didn't see the plate, it was covered or missing. They went toward the main road." },
  { role: 'ai', phase: 'clarification', content: "Thank you for telling me all of that. I'd like to ask a few more questions about what you've already described. You mentioned the man at the door. What do you remember about him?" },
  { role: 'witness', phase: 'clarification', content: "Taller than the other one. Dark shirt. He kept looking up and down the street. I didn't get a good look at his face, I was focused on the one in front of me." },
  { role: 'ai', phase: 'clarification', content: "You said you gave him the notes from the register. Do you remember roughly how much that was?" },
  { role: 'witness', phase: 'clarification', content: "Around forty-two thousand rupees. I had counted most of it already, that's how I know." },
  { role: 'ai', phase: 'closing', content: "We're almost done. Is there anything else you want to tell me that I haven't asked about? Is there anything you're unsure about in what you've told me today?" },
  { role: 'witness', phase: 'closing', content: "Only that my nephew had left about ten minutes before it happened. I keep thinking they were watching and waited for him to go. I'm not sure about the driver, I only saw him for a second." },
  { role: 'ai', phase: 'closing', content: "Thank you for your time and your patience. The interview is now complete." },
].map((e, i) => ({
  ...e,
  timestamp: new Date(Date.parse('2026-07-02T18:05:00Z') + i * 65_000).toISOString(),
}));

const sampleLiveNotes = [
  { turn: 1, phase: 'rapport', note: 'Witness engaged, no comprehension issues.', signals: ['engaged'], distressLevel: 'none' },
  { turn: 2, phase: 'rapport', note: 'Reports nervousness but willing to proceed.', signals: ['self_reported_nervousness'], distressLevel: 'mild' },
  { turn: 4, phase: 'narrative_practice', note: 'Free recall practice produced ordered, specific detail.', signals: ['ordered_recall'], distressLevel: 'none' },
  { turn: 6, phase: 'context_reinstatement', note: 'Strong sensory reinstatement: light level, sounds, position in shop.', signals: ['sensory_detail'], distressLevel: 'none' },
  { turn: 8, phase: 'substantive', note: 'Uninterrupted narrative with clear sequence; witness distinguishes what he saw from what he assumed.', signals: ['source_monitoring', 'ordered_recall'], distressLevel: 'none' },
  { turn: 10, phase: 'substantive', note: 'Peripheral detail volunteered without prompting (waiting motorcycle, covered plate).', signals: ['unprompted_detail'], distressLevel: 'none' },
  { turn: 12, phase: 'clarification', note: 'Appropriately bounded uncertainty about the second man.', signals: ['calibrated_uncertainty'], distressLevel: 'none' },
  { turn: 14, phase: 'closing', note: 'Spontaneous addition about nephew leaving before the incident; flags own uncertainty about the driver.', signals: ['spontaneous_addition', 'calibrated_uncertainty'], distressLevel: 'none' },
];

const sampleAnalysis = {
  linguisticFlags: [
    {
      type: 'UNDER_SPECIFICITY',
      severity: 'low',
      evidence: "I didn't get a good look at his face, I was focused on the one in front of me.",
      note: 'Vagueness about the second suspect is plausibly explained by attention focus on the immediate threat.',
    },
    {
      type: 'HEDGING_LANGUAGE',
      severity: 'low',
      evidence: "Clean shaven, I think.",
      note: 'Isolated hedge on a peripheral detail; not concentrated in critical parts of the account.',
    },
  ],
  contradictions: [],
  positiveIndicators: [
    'SPONTANEOUS_CORRECTIONS',
    'UNPROMPTED_DETAIL',
    'CALIBRATED_UNCERTAINTY',
  ],
  overallConsistencyScore: 84,
  summaryNote:
    'Account is internally consistent with an ordered timeline. The witness distinguishes observed detail from inference, volunteers peripheral information, and bounds his own uncertainty. Low-severity flags relate to peripheral details only.',
};

const sampleContradictions = {
  items: [],
  statementSummary:
    'The witness, a shopkeeper, states that two men entered his shop shortly before closing on the evening of 2 July 2026. One man remained at the door as a lookout while the second approached the counter, implied possession of a weapon by keeping a hand inside his jacket, and demanded cash. The witness handed over approximately PKR 42,000 in notes and a mobile phone taken from the counter. Both men left on a red 70cc motorcycle driven by a third person; the number plate was covered or missing. The witness describes the man at the counter as approximately mid-twenties, thin, wearing a grey hoodie, speaking quietly in Urdu. He notes that his nephew had left the shop roughly ten minutes before the incident and believes the men may have been observing the premises.',
  followUpQuestions: [
    'You mentioned the motorcycle was waiting outside. Where exactly was it positioned relative to the shop entrance?',
    'Tell me more about the days before the incident. Had you noticed anyone paying attention to the shop?',
    'You said the man kept his hand inside his jacket. Describe what you saw of that hand or the jacket.',
    'What happened in the minutes immediately after the men left?',
  ],
  endReason: 'closing_complete',
};

async function main() {
  // Admin officer (never reset beyond upsert)
  const adminHash = await bcrypt.hash('1s4ad', 12);
  await prisma.user.upsert({
    where: { email: 'approvedbysaad@themis.pk' },
    update: {},
    create: {
      email: 'approvedbysaad@themis.pk',
      password: adminHash,
      name: 'Admin Officer',
      station: 'Central Police Station',
      role: 'officer',
    },
  });

  // Demo account, recreated sample data on every seed run
  const demoHash = await bcrypt.hash('themis-demo', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@themis.app' },
    update: {},
    create: {
      email: 'demo@themis.app',
      password: demoHash,
      name: 'Demo Officer',
      station: 'Demonstration Workspace',
      role: 'demo',
    },
  });

  // Reset the demo workspace
  const demoCases = await prisma.case.findMany({ where: { officerId: demo.id }, select: { id: true } });
  const demoCaseIds = demoCases.map((c) => c.id);
  await prisma.interview.deleteMany({ where: { caseId: { in: demoCaseIds } } });
  await prisma.case.deleteMany({ where: { id: { in: demoCaseIds } } });

  const demoCase = await prisma.case.create({
    data: {
      caseNumber: 'FIR-2026-0187',
      incidentType: 'Armed Robbery',
      description:
        'Shopkeeper reports two men entered his general store near closing time on 2 July 2026 and took the day\'s cash and his mobile phone. A third man waited outside on a motorcycle. No shots fired, no injuries reported.',
      officerId: demo.id,
      createdAt: new Date('2026-07-02T14:30:00Z'),
    },
  });

  // Completed interview with full handwritten record
  await prisma.interview.create({
    data: {
      caseId: demoCase.id,
      interviewNumber: 1,
      status: 'completed',
      language: 'en',
      victimName: 'M. Akram',
      victimAge: 47,
      consentName: 'M. Akram',
      consentAt: new Date('2026-07-02T18:04:00Z'),
      currentPhase: 'closing',
      exchangeCount: 2,
      transcript: sampleTranscript,
      liveNotes: sampleLiveNotes,
      linguisticFlags: sampleAnalysis,
      contradictions: sampleContradictions,
      createdAt: new Date('2026-07-02T18:00:00Z'),
      completedAt: new Date('2026-07-02T18:33:00Z'),
    },
  });

  // A pending interview so demo visitors can run a live one immediately
  await prisma.interview.create({
    data: {
      caseId: demoCase.id,
      interviewNumber: 2,
      status: 'pending',
      language: 'en',
    },
  });

  console.log('Seed complete.');
  console.log('  Admin: approvedbysaad@themis.pk / 1s4ad');
  console.log('  Demo:  demo@themis.app / themis-demo (sample case reset)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
